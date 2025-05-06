from flask import Blueprint, jsonify, request, send_from_directory, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
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
# Path to the JSON file
UPLOADS_FILE = 'uploads.json'

MAX_FILES_PER_HOUR = 10  # Max number of files per hour
MAX_SIZE_PER_DAY_GB = 50  # Max size per day in GB

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
            if not os.path.isfile(filepath) or not allowed_file(filename):
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

def save_uploads_data(data):
    try:
        """Save the updated upload data back to the JSON file."""
        with open(UPLOADS_FILE, 'w') as file:
            json.dump(data, file, indent=4)
    except Exception as e:
        print(f"Error saving uploads data: {str(e)}")

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

    if total_uploaded_size_today + file_size > MAX_SIZE_PER_DAY_GB * 1024 * 1024 * 1024:
        return False, "You have exceeded the maximum total upload size of 50 GB per day."
    
    return True, ""

def check_and_upload_file(user_id, file):
    """Checks if file can be uploaded based on rate limits and size, then uploads."""
    try:
        # Secure the filename and get file size
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        try:
            file.stream.seek(0, os.SEEK_END)
            file_size = file.stream.tell()
            file.stream.seek(0)
        except Exception:
            file_size = 0  # fallback to 0 if we can't determine size
        
        # Check if upload is allowed (rate limits and size limits)
        is_allowed, message = check_upload_limits(user_id, file_size)
        if not is_allowed:
            return False, message
        
        # Save the file to the filesystem
        file.save(filepath)

        # Save upload metadata (timestamp and size)
        timestamp = datetime.now().isoformat()
        data = load_uploads_data()
        if user_id not in data:
            data[user_id] = {"uploads": []}
        
        data[user_id]["uploads"].append({"timestamp": timestamp, "size": file_size})
        save_uploads_data(data)

        return True, "File uploaded successfully"

    except Exception as e:
        print(f"File upload failed: {str(e)}")
        return False, str(e)
        

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def verify_file_name(filename):
    # Check if the filename is valid (no special characters, etc.)
    # This is a simple regex check; you can modify it as needed
    return re.match(r'^[\w\-. ]+$', filename) is not None

@file_bp.route('/list', methods=['GET'])
@jwt_required()
def get_files():
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        synchronize_filesystem_with_db()

        # Get all files from database that are not private

        #files = File.query.all()
        if not user.is_admin:
            files = File.query.filter_by(is_private=False).all()
        else:
            files = File.query.all()

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
@jwt_required()
def get_private_files():
    """Get private files for a specific user."""
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        
        files = File.query.filter_by(uploaded_by=user.id, is_private=True).all()
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
@jwt_required()
def upload_file():
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        
        if 'file' not in request.files:
            return jsonify({
                "message": "No file part in the request",
            }), 400

        file = request.files['file']
        if not verify_file_name(file.filename):
            return jsonify({
                "message": "Invalid file name"
            }), 400
        
        if file.filename == '':
            return jsonify({
                "message": "No selected file"
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                "message": "File type not allowed"
            }), 400
        
        # Get privacy setting from form data (default to False)
        is_private = request.form.get('isPrivate', 'false').lower() == 'true'
        
        # Secure the filename first
        filename = secure_filename(file.filename)
        base_name, extension = os.path.splitext(filename)
        
        # Check for existing file before saving
        existing_file = File.query.filter_by(
            file_name=base_name,
            file_extension=extension[1:].lower()
        ).first()

        if existing_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{base_name}_{timestamp}{extension}"
        
        # Save file first to get actual size
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)  # Save the file first
        
        # Now get the actual file size
        stat = os.stat(filepath)
        file_size = stat.st_size
        
        # Get other metadata
        file_type, _ = mimetypes.guess_type(filename)
        
        # Create DB record
        new_file = File(
            file_name=base_name,
            file_extension=extension[1:].lower(),
            uploaded_by=user.id,
            file_size=file_size,
            file_path=filepath,
            mime_type=file_type,
            is_private=is_private,  # Use the parsed boolean value
            description=request.form.get('description', '')
        )

        db.session.add(new_file)
        db.session.commit()

        return jsonify({
            "message": "File uploaded successfully",
            "data": {
                "id": new_file.id,
                "name": filename,
                "size": file_size,
                "is_private": is_private
            }
        }), 201

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
@jwt_required()
def download_file(file_id):
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        # Get file from database
        file = File.query.get(file_id)
        if not file:
            abort(404, message="File not found")
        
        # Check if user has permission (example: private files)
        if file.is_private and file.uploaded_by != get_jwt_identity():
            abort(403, message="Access denied")
        
        # Check if file exists in filesystem
        if not os.path.isfile(file.file_path):
            abort(404, message="File not found on server")
        
        return send_from_directory(
            directory=os.path.dirname(file.file_path),
            path=os.path.basename(file.file_path),
            as_attachment=True,
            mimetype=file.mime_type or 'application/octet-stream'
        )
    
    except Exception as e:
        print(f"Download failed: {str(e)}")
        abort(500, message="Internal server error")

@file_bp.route('/delete/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    try:
        user, message = check_permission(get_jwt_identity())
        if message:
            return message
        
        # Get file from database
        file = File.query.get(file_id)
        if not file:
            return jsonify({
                "message": "File not found"
            }), 404
        
        # Check permissions (admin or owner)
        if not user.is_admin and file.uploaded_by != user.id:
            print(f"User {user.username} attempted to delete file {file_id} without permission.")
            return jsonify({
                "message": "Permission denied"
            }), 403

        # Delete from filesystem
        if os.path.exists(file.file_path):
            os.remove(file.file_path)
        else:
            print(f"File not found on disk: File ID: {file.id}, File Path: {file.file_path}")
            print(f"User: {user.username} attempted to delete a file that does not exist on disk.")
            print(f"Deleting file from DB: {file.to_dict()}")
            db.session.delete(file)
            db.session.commit()
            return jsonify({
                "message": "File not found on disk - Contact admin rumix9866"
            }), 500

        
        # Delete from database
        db.session.delete(file)
        db.session.commit()
        
        return jsonify({
            "message": "File deleted successfully",
            "data": True
        })

    except Exception as e:
        print(f"File deletion failed: {str(e)}")
        db.session.rollback()
        return jsonify({
            "message": str(e)
        }), 500