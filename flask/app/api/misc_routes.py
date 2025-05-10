from flask import Blueprint, render_template
from app import db
from app.models.user import User
from datetime import datetime

misc_bp = Blueprint('misc_bp', __name__)

@misc_bp.route('/verify/<string:uuid>', methods=['GET'])
def email_verification(uuid):
    """Verify the email using the UUID"""
    user = User.query.filter_by(email_verification_code=uuid).first()

    if not user:
        return render_template('verification/failed.html'), 400

    if user.email_verified:
        return render_template('verification/already_verified.html'), 400

    # Check if the verification code is expired
    if datetime.utcnow() > user.email_verification_code_expires:
        return render_template('verification/expired.html'), 400

    # Mark email as verified
    user.email_verified = True
    user.email_verification_code = None
    user.email_verification_code_expires = None
    db.session.commit()

    return render_template('verification/success.html'), 200

@misc_bp.route('/privacy', methods=['GET'])
def privacy_policy():
    """Render the privacy policy page."""
    return render_template('privacy/privacy.html'), 200

@misc_bp.route('/terms', methods=['GET'])
def terms_of_service():
    """Render the terms of service page."""
    return render_template('terms/terms.html'), 200