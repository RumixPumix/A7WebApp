from flask import Blueprint, jsonify, request, send_from_directory, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.permissions_wrapper import permissions_wrapper
from datetime import datetime
from werkzeug.utils import secure_filename
import mimetypes
import os
from app.models.user import User
from app.models.file import File
from app import db
import json
import re
from datetime import datetime, timedelta
import threading


file_bp = Blueprint('file_bp', __name__)

UPLOAD_FOLDER = '/srv/files'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'xlsx', 'pptx', 'zip', 'rar'}
UPLOADS_FILE = 'uploads.json'

MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024  # Max file size in bytes (50 GB)
MAX_SIZE_PER_DAY_GB = 50 * 1024 * 1024 * 1024  # Max size per day in GB
MAX_FILES_PER_HOUR = 10  # Max number of files per hour

def check_permission(current_user):
    user = User.query.get(current_user)
    if not user:
        return None, (jsonify({"message": "You need to login first!"}), 401)
    return user, None

sync_lock = threading.Lock()

def synchronize_filesystem_with_db():
    """Synchronize files in the filesystem with the database records."""

    if not sync_lock.acquire(blocking=False):
        print("Sync already in progress, skipping...")
        return

    try:
        # Get all files from the database
        db_files = File.query.all()
        db_file_paths = {file.file_path for file in db_files}

        # Track changes
        added_count = 0
        removed_count = 0

        # Check for files in the filesystem that are not in the database
        for filename in os.listdir(UPLOAD_FOLDER):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            # Skip directories and non-allowed files
            if not os.path.isfile(filepath):
                continue

            # If file exists in filesystem but not in DB
            if filepath not in db_file_paths:
                try:
                    stat = os.stat(filepath)
                    file_type, _ = mimetypes.guess_type(filename)
                    base_name, extension = os.path.splitext(filename)

                    new_file = File(
                        file_name=base_name,
                        file_extension=extension[1:].lower(),
                        uploaded_by=1,  # Default to SYSTEM_USER_ID or admin user ID
                        file_size=stat.st_size,
                        file_path=filepath,
                        mime_type=file_type,
                        description="Added on Disk"
                    )
                    db.session.add(new_file)
                    added_count += 1
                except Exception as e:
                    print(f"Failed to add {filename} to DB: {str(e)}")
                    continue

        # Check for files in DB that don't exist in filesystem
        for file in db_files:
            if not os.path.exists(file.file_path):
                db.session.delete(file)
                removed_count += 1

        db.session.commit()
        
        if added_count or removed_count:
            print(f"Sync complete: Added {added_count} files, removed {removed_count} DB entries")

    except Exception as e:
        db.session.rollback()
        print(f"Sync failed: {str(e)}")
    finally:
        sync_lock.release()

def verify_file(file):
    if not file:
        return False  # No file at all

    # Sanitize and extract filename + extension
    filename = secure_filename(file.filename)
    if '..' in filename or filename.startswith('/'):
        return False
    ext = os.path.splitext(filename)[1].lower()

    # Check if filename or extension is missing
    if not filename or not ext:
        return False

    # Check extension
    if ext not in ALLOWED_EXTENSIONS:
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
    one_hour_ago = datetime.now() - timedelta(hours=1)
    file_count_last_hour = sum(1 for upload in user_uploads if datetime.fromisoformat(upload["timestamp"]) > one_hour_ago)

    if file_count_last_hour >= MAX_FILES_PER_HOUR:
        return False, "You have exceeded the maximum file upload limit of 10 files per hour."

    # Check total file size uploaded today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    total_uploaded_size_today = sum(upload["size"] for upload in user_uploads if datetime.fromisoformat(upload["timestamp"]) > today_start)

    if total_uploaded_size_today + file_size > MAX_SIZE_PER_DAY_GB:
        return False, "You have exceeded the maximum total upload size of 50 GB per day."
    
    return True, ""

@file_bp.route('/list', methods=['GET'])
@permissions_wrapper(['file.route.list', 'file.route.list.limited'])
def get_files(current_user, permissions_status):
    """Get all files from the database."""
    try:
        synchronize_filesystem_with_db()

        if permissions_status['file.route.list.limited'] and not permissions_status['file.route.list']:
            files = File.query.filter_by(is_private=False).all()
        elif permissions_status['file.route.list']:
            files = File.query.all()
        else:
            return jsonify({
                "message": "You do not have permission to view files",
            }), 403


        if not files:
            return jsonify({
                "message": "No files found",
                "data": []
            }), 200
        
        return jsonify({
            "message": "Files retrieved successfully",
            "data": [file.to_dict() for file in files]
        }), 200

    except Exception as e:
        return jsonify({
            "message": str(e),
        }), 500
    
@file_bp.route('/private', methods=['GET'])
@permissions_wrapper(['file.route.get.private.files'])
def get_private_files(current_user, permissions_status):
    """Get private files for a specific user."""
    try:
        if not permissions_status['file.route.get.private.files']:
            return jsonify({
                "message": "You do not have permission to view private files",
            }), 403
        
        files = File.query.filter_by(uploaded_by=current_user.id, is_private=True).all()
        if not files:
            return jsonify({
                "message": "No private files found",
                "data": []
            }), 200
            
        return jsonify({
            "message": "Private files retrieved successfully",
            "data": [file.to_dict() for file in files]
        }), 200
    except Exception as e:
        return jsonify({
            "message": str(e),
        }), 500

@file_bp.route('/upload', methods=['POST'])
@permissions_wrapper(['file.route.upload', 'file.route.upload.limited', 'file.route.upload.private.file', 'file.route.upload.private.file.limited'])
def upload_file(current_user, permissions_status):
    """Upload a file to the server."""
    try:
        if 'file' not in request.files:
            return jsonify({"message": "No file part in the request",}), 400

        file = request.files['file']
        content_length = request.content_length
        if content_length is None:
            return jsonify({"message": "Content length not provided",}), 400
        if content_length > MAX_FILE_SIZE:
            return jsonify({"message": "File size exceeds the maximum limit of 50 GB",}), 400
        filename = verify_file(file)

        if not filename:
            return jsonify({"message": "Invalid file",}), 400
        
        base, ext = os.path.splitext(filename)

        # Get privacy setting from form data (default to False)
        is_private = request.form.get('isPrivate', 'false').lower() == 'true'
        if is_private and not (permissions_status['file.route.upload.private.file'] or permissions_status['file.route.upload.private.file.limited']):
            return jsonify({"message": "You do not have permission to upload private files",}), 403
        
        if is_private and not permissions_status['file.route.upload.private.file']:
            status = check_upload_limits(current_user.id, content_length)
            if not status[0]:
                return jsonify({"message": status[1]}), 403

        if not is_private and not permissions_status['file.route.upload']:
            status = check_upload_limits(current_user.id, content_length)
            if not status[0]:
                return jsonify({"message": status[1]}), 403
        
        # Check for existing file before saving
        existing_file = File.query.filter_by(
            file_name=base,
            file_extension=ext[1:].lower()
        ).first()

        if existing_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{base}_{timestamp}{ext}"
        
        # Save file first to get actual size
        final_filename = f"{base}{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, final_filename)

        # Save file
        file.save(filepath)  # Save the file first
        
        # Now get the actual file size
        file_size = os.stat(filepath).st_size
        file_type, _ = mimetypes.guess_type(final_filename)
        
        # Create DB record
        new_file = File(
            file_name=base,
            file_extension=ext[1:].lower(),
            uploaded_by=current_user.id,
            file_size=file_size,
            file_path=filepath,
            mime_type=file_type,
            is_private=is_private,
            description=request.form.get('description', '')
        )

        db.session.add(new_file)
        db.session.commit()

        upload_data = {
            "timestamp": datetime.now().isoformat(),
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
@permissions_wrapper(['file.route.download', 'file.route.download.limited'])
def download_file(file_id, current_user, permissions_status):
    try:
        # Get file from database
        file = File.query.get_or_404(file_id)
        
        # Verify file exists on filesystem
        if not os.path.isfile(file.file_path):
            abort(404, message="File not found on server")

        # Admin can download anything
        if permissions_status['file.route.download']:
            return _send_file(file)

        if not permissions_status['file.route.download.limited']:
            abort(403, message="No download permission")
            
        if file.is_private and file.uploaded_by != current_user.id:
            abort(403, message="Access denied to private file")
        
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
@permissions_wrapper(['file.route.delete', 'file.route.delete.limited'])
def delete_file(file_id, current_user, permissions_status):
    try:
        
        # Get file from database
        file = File.query.get(file_id)
        if not file:
            return jsonify({
                "message": "File not found"
            }), 404
        
        # Check permissions
        if permissions_status['file.route.delete']:
            return _delete_file(file)
        
        if not permissions_status['file.route.delete.limited']:
            return jsonify({
                "message": "You do not have permission to delete files",
            }), 403
        
        if file.is_private and file.uploaded_by != current_user.id:
            return jsonify({
                "message": "You do not have permission to delete this file",
            }), 403
        
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