from flask import Blueprint, jsonify, request, send_from_directory, abort
from app.api.permissions_wrapper import permissions_wrapper
from datetime import datetime
from werkzeug.utils import secure_filename
import mimetypes
import os
from app.models.user import User
from app.models.file import File
from app import db
import json
from datetime import datetime, timedelta
import threading


file_bp = Blueprint('file_bp', __name__)

UPLOAD_FOLDER = r'C:\srv\files'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'xlsx', 'pptx', 'zip', 'rar'}
UPLOADS_FILE = 'uploads.json'

MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024  # Max file size in bytes (50 GB)
MAX_SIZE_PER_DAY = 50 * 1024 * 1024 * 1024  # Max size per day in GB

MAX_FILE_SIZE_GB = 50
MAX_SIZE_PER_DAY_GB = 50
MAX_FILES_PER_HOUR = 10  # Max number of files per hour

TOLERANCE_BYTES = 1 * 1024 * 1024  # allow 1MB mismatch

LOW_TOLERANCE_BYTES = 256 * 1024  # allow 256KB mismatch
MEDIUM_TOLERANCE_BYTES = 512 * 1024  # allow 512kB mismatch
HIGH_TOLERANCE_BYTES = 1 * 1024 * 1024  # allow 1MB mismatch

sync_lock = threading.Lock()
sync_in_progress = False

def synchronize_filesystem_with_db(db_parent=None, base_path=None, tracked_paths=None):
    base_path = base_path or UPLOAD_FOLDER
    base_path = os.path.abspath(base_path)

    if tracked_paths is None:
        tracked_paths = set()

    for entry in os.scandir(base_path):
        is_folder = entry.is_dir()
        file_path = os.path.abspath(entry.path)
        file_name = entry.name
        tracked_paths.add(file_path)

        # Check if already exists in DB
        existing = File.query.filter_by(file_path=file_path).first()

        file_size = None
        mime_type = None
        if not is_folder:
            file_size = os.path.getsize(file_path)
            mime_type = mimetypes.guess_type(file_path)[0]

        if existing:
            # Update if anything changed
            changed = False
            if existing.is_folder != is_folder:
                existing.is_folder = is_folder
                changed = True
            if existing.file_size != file_size:
                existing.file_size = file_size
                changed = True
            if existing.mime_type != mime_type:
                existing.mime_type = mime_type
                changed = True
            if existing.file_name != file_name:
                existing.file_name = file_name
                changed = True
            if existing.parent != db_parent:
                existing.parent = db_parent
                changed = True

            if changed:
                db.session.add(existing)

        else:
            # New entry
            new_file = File(
                file_name=file_name,
                file_path=file_path,
                is_folder=is_folder,
                file_size=file_size,
                mime_type=mime_type,
                uploaded_by=None,  # System
                parent=db_parent,
            )
            db.session.add(new_file)
            db.session.flush()  # so we get its ID for children

            existing = new_file  # for recursion

        # Recurse into subfolders
        if is_folder:
            synchronize_filesystem_with_db(db_parent=existing, base_path=file_path, tracked_paths=tracked_paths)

    # Commit + cleanup (top-level only)
    if db_parent is None:
        # Clean up orphaned DB entries
        all_db_files = File.query.all()
        for item in all_db_files:
            if not item.file_path.startswith(base_path):
                continue  # Skip entries outside sync scope
            if item.file_path not in tracked_paths and not os.path.exists(item.file_path):
                db.session.delete(item)

        db.session.commit()

def sync_filesystem():
    global sync_in_progress

    acquired = sync_lock.acquire(blocking=False)

    if not acquired:
        return False

    try:
        if sync_in_progress:
            return False

        sync_in_progress = True
        synchronize_filesystem_with_db()
        return True

    finally:
        sync_in_progress = False
        sync_lock.release()


def verify_file(file):
    if not file:
        return False  # No file at all

    # Sanitize and extract filename + extension
    filename = secure_filename(file.filename)

    ext = os.path.splitext(filename)[1].lower()

    # Check if filename or extension is missing
    if not filename or not ext:
        return False

    # Check extension
    if ext[1:] not in ALLOWED_EXTENSIONS:
        return False

    return filename

def load_uploads_data():
    try:
        """Load the current upload data from the JSON file."""
        if os.path.exists(UPLOADS_FILE):
            with open(UPLOADS_FILE, 'r') as file:
                content = file.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        return {}
    except Exception as e:
        print(f"Error loading uploads data: {str(e)}")
        return {}

def save_uploads_data(user_id, new_upload_data):
    """Load current upload data, append new data, and save back to the JSON file."""
    try:
        # Load current data
        data = load_uploads_data()

        # Ensure the user has an entry in the data
        if user_id not in data:
            data[user_id] = {"uploads": []}

        # Append the new upload data
        data[user_id]["uploads"].append(new_upload_data)

        # Save the updated data back to the file
        with open(UPLOADS_FILE, 'w') as file:
            json.dump(data, file, indent=4)
    
    except Exception as e:
        print(f"Error saving uploads data: {str(e)}")
        return False

    return True
    
def check_upload_limits(user_id, file_size):
    """Check upload limits: 10 files per hour and 50GB per day."""
    data = load_uploads_data()
    
    if user_id not in data:
        data[user_id] = {"uploads": []}

    user_uploads = data[user_id]["uploads"]
    
    # Check files uploaded in the last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    file_count_last_hour = sum(1 for upload in user_uploads if datetime.fromisoformat(upload["timestamp"]) > one_hour_ago)

    if file_count_last_hour >= MAX_FILES_PER_HOUR:
        return False, "You have exceeded the maximum file upload limit of 10 files per hour."

    # Check total file size uploaded today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_uploaded_size_today = sum(upload["size"] for upload in user_uploads if datetime.fromisoformat(upload["timestamp"]) > today_start)

    if total_uploaded_size_today + file_size > MAX_SIZE_PER_DAY:
        return False, "You have exceeded the maximum total upload size of 50 GB per day."
    
    return True, ""

def get_remaining_limits(user_id):
    """Check upload limits: 10 files per hour and 50GB per day."""
    return_data = {}
    data = load_uploads_data()
    if user_id not in data:
        data[user_id] = {"uploads": []}
    user_uploads = data[user_id]["uploads"]
    # Check files uploaded in the last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    file_count_last_hour = sum(1 for upload in user_uploads if datetime.fromisoformat(upload["timestamp"]) > one_hour_ago)
    if file_count_last_hour >= MAX_FILES_PER_HOUR:
        return_data["per_hour"] = "You have exceeded the maximum file upload limit of 10 files per hour."
    else:
        return_data["per_hour"] = f"Files today: {file_count_last_hour}/{MAX_FILES_PER_HOUR}"
    # Check total file size uploaded today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_uploaded_size_today = sum(upload["size"] for upload in user_uploads if datetime.fromisoformat(upload["timestamp"]) > today_start)
    if total_uploaded_size_today >= MAX_SIZE_PER_DAY:
        return_data["today"] = "You have exceeded the maximum total upload size of 50 GB per day."
    else:
        return_data["today"] = f"Total size today: {total_uploaded_size_today} / {MAX_SIZE_PER_DAY_GB} GB"
    
    return return_data

@file_bp.route('/list/<string:parent_id>', methods=['GET'])
@permissions_wrapper(['file.route.list', 'file.route.list.all'])
def get_files(parent_id, current_user, permissions_status):
    """Get files from a specific parent folder, filtered by permissions."""
    try:
        if not parent_id.isdigit():
            if not parent_id == "null":
                return jsonify({
                    "message": "Invalid request"
                }), 400
            parent_id = None
        else:
            parent_id = int(parent_id)

        sync_filesystem()  # Assuming this syncs the DB with actual files

        # Base query filtered by parent_id
        query = File.query.filter_by(parent_id=parent_id)

        # Apply permission-based filtering
        if not permissions_status['file.route.list.all']:
            # Regular users only see non-private files in this folder
            files = query.filter_by(is_private=False).all()
        else:
            # Admins see all files in this folder
            files = query.all()

        if not files:
            return jsonify({
                "message": "No files found",
                "data": []
            }), 200

        limits = get_remaining_limits(current_user.id)

        return jsonify({
            "message": "Files retrieved successfully",
            "data": {"files":[file.to_dict(current_user.timezone) for file in files], "limits": limits}
        }), 200

    except Exception as e:
        return jsonify({
            "message": f"Error retrieving files: {str(e)}",
        }), 500


@file_bp.route('/private/<string:parent_id>', methods=['GET'])
@permissions_wrapper(['file.route.get.private.files'])
def get_private_files(parent_id, current_user, permissions_status):
    """Get private files for a specific user within a parent folder."""
    try:
        if not parent_id.isdigit():
            if not parent_id == "null":
                return jsonify({
                    "message": "Invalid request"
                }), 400
            parent_id = None
        else:
            parent_id = int(parent_id)
        # Get private files for current user in the specified folder
        files = File.query.filter(
            File.parent_id == parent_id,
            File.uploaded_by == current_user.id,
            File.is_private == True
        ).all()

        if not files:
            return jsonify({
                "message": "No private files found",
                "data": []
            }), 200

        limits = get_remaining_limits(current_user.id)

        return jsonify({
            "message": "Private files retrieved successfully",
            "data": {"files":[file.to_dict(current_user.timezone) for file in files], "limits": limits}
        }), 200

    except Exception as e:
        return jsonify({
            "message": f"Error retrieving private files: {str(e)}",
        }), 500

@file_bp.route('/upload', methods=['POST'])
@permissions_wrapper(['file.route.upload', 'file.route.upload.nolimit', 'file.route.upload.private.file', 'file.route.upload.private.file.nolimit'])
def upload_file(current_user, permissions_status):
    """Upload a file to the server."""
    try:
        if 'file' not in request.files:
            return jsonify({"message": "No file part in the request",}), 400

        file = request.files['file']
        content_length = request.content_length


        print(f"Content length: {content_length}")
        if content_length is None:
            return jsonify({"message": "Content length not provided",}), 400
        if content_length <= 0:
            return jsonify({"message": "File is empty",}), 400
        if content_length > MAX_FILE_SIZE:
            return jsonify({"message": "File size exceeds the maximum limit of 50 GB",}), 400
        
        filename = verify_file(file)
        if not filename:
            return jsonify({"message": "Invalid file",}), 400
        parent_id = request.form.get('parent_id')

        if parent_id == "null":
            parent_id = None
        elif parent_id and not parent_id.isdigit():
            return jsonify({"message": "Invalid parent ID"}), 400
        elif parent_id:
            parent_id = int(parent_id)

        parent_id_folder = File.query.get(parent_id) if parent_id else None
        if parent_id_folder and not parent_id_folder.is_folder:
            return jsonify({"message": "Parent ID must be a folder"}), 400

        is_folder = request.form.get('is_folder', 'false').lower() == 'true'
        
        # Get privacy setting from form data (default to False)
        is_private = request.form.get('is_private', 'false').lower() == 'true'
        if is_private and not (permissions_status['file.route.upload.private.file'] or permissions_status['file.route.upload.private.file.nolimit']):
            return jsonify({"message": "You do not have permission to upload private files",}), 403
        
        if is_private and not permissions_status['file.route.upload.private.file.nolimit']:
            status = check_upload_limits(current_user.id, content_length)
            if not status[0]:
                return jsonify({"message": status[1]}), 403
            
        if not is_private and not (permissions_status['file.route.upload'] or permissions_status['file.route.upload.nolimit']):
            return jsonify({"message": "You do not have permission to upload files",}), 403

        if not is_private and not permissions_status['file.route.upload.nolimit']:
            status = check_upload_limits(current_user.id, content_length)
            if not status[0]:
                return jsonify({"message": status[1]}), 403
        
        # Check for existing file before saving
        existing_file = File.query.filter_by(
            file_name=filename,
            parent_id=parent_id
        ).first()

        if existing_file:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}_{filename}"

        #Calculate the file path
        parent_id_folder_path = parent_id_folder.file_path if parent_id_folder else UPLOAD_FOLDER
        
        # Save file first to get actual size
        filepath = os.path.join(parent_id_folder_path, filename)

        # Save file
        file.save(filepath)  # Save the file first
        
        # Now get the actual file size
        file_size = os.stat(filepath).st_size
        if content_length:
            diff = abs(file_size - content_length)

            if diff > HIGH_TOLERANCE_BYTES:
                os.remove(filepath)
                return jsonify({"message": "File size mismatch exceeds allowable limit"}), 400
            elif diff > MEDIUM_TOLERANCE_BYTES:
                print(f"[WARNING] File size mismatch passed with HIGH tolerance: {diff} bytes")
            elif diff > LOW_TOLERANCE_BYTES:
                print(f"[INFO] File size mismatch passed with MEDIUM tolerance: {diff} bytes")
            elif diff > 0:
                print(f"[DEBUG] File size mismatch passed with LOW tolerance: {diff} bytes")
        
        file_type, _ = mimetypes.guess_type(filename)
        
        # Create DB record
        new_file = File(
            file_name=filename,
            mime_type=file_type,
            file_path=filepath,
            file_size=file_size,
            is_private=is_private,
            is_folder=is_folder,
            uploaded_by=current_user.id,
        )

        db.session.add(new_file)
        db.session.commit()

        upload_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "size": file_size
        }

        # Save the upload data
        if save_uploads_data(current_user.id, upload_data):
            return jsonify({
                "message": "File uploaded successfully",
                "data": True
            }), 201
        else:
            return jsonify({
                "message": "Failed to save upload data"
            }), 500

    except Exception as e:
        db.session.rollback()
        print(f"File upload failed: {str(e)}")
        # Clean up if file was partially uploaded
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
            
        return jsonify({
            "message": str(e)
        }), 500

@file_bp.route('/download/<int:file_id>', methods=['GET'])
@permissions_wrapper(['file.route.download', 'file.route.download.all'])
def download_file(file_id, current_user, permissions_status):
    try:
        # Get file from database
        file = File.query.get_or_404(file_id)
        
        # Verify file exists on filesystem
        if not os.path.isfile(file.file_path):
            abort(404, message="File not found on server")

        if not permissions_status['file.route.download.all']:
            if file.is_private and file.uploaded_by != current_user.id:
                abort(403, message="Access denied to private file")

        # Admin can download anything
        return _send_file(file)

    except Exception as e:
        print(f"Download failed: {str(e)}")
        abort(500, message="Internal server error")

def _send_file(file):
    """Helper function to send file with proper headers"""
    if not os.path.isfile(file.file_path):
        abort(404, message="File not found on server")
    
    return send_from_directory(
        directory=os.path.dirname(file.file_path),
        path=os.path.basename(file.file_path),
        as_attachment=True,
        mimetype=file.mime_type or 'application/octet-stream'
    )

@file_bp.route('/delete/<int:file_id>', methods=['DELETE'])
@permissions_wrapper(['file.route.delete', 'file.route.delete.all'])
def delete_file(file_id, current_user, permissions_status):
    try:
        
        # Get file from database
        file = File.query.get(file_id)
        if not file:
            return jsonify({
                "message": "File not found"
            }), 404
        
        # Check permissions
        if not permissions_status['file.route.delete.all']:
            if file.uploaded_by == current_user.id:
                pass
            else:
                return jsonify({"message": "You do not have permission to delete this file"}), 403
            
        
        return _delete_file(file)

    except Exception as e:
        print(f"File deletion failed: {str(e)}")
        db.session.rollback()
        return jsonify({
            "message": str(e)
        }), 500
    
def _delete_file(file):
    """Helper function to delete file from filesystem and database."""
    db.session.delete(file)
    db.session.commit()
    if os.path.exists(file.file_path):
        os.remove(file.file_path)
        return jsonify({
            "message": "File deleted successfully",
            "data": True
        }), 200
    else:
        return jsonify({
            "message": "File deleted - not found on disk",
        }), 404