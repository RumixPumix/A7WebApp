from datetime import datetime, timedelta
from app import db

class Ban(db.Model):
    __tablename__ = 'ban'

    id = db.Column(db.Integer, primary_key=True)
    is_banned = db.Column(db.Boolean, default=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref='bans', foreign_keys=[user_id])

    ban_reason = db.Column(db.String(350), nullable=True)
    ban_duration = db.Column(db.Integer, nullable=True)  # Duration in days
    is_permanent = db.Column(db.Boolean, default=False)

    banned_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    banned_by_user = db.relationship('User', foreign_keys=[banned_by])

    banned_at = db.Column(db.DateTime, default=datetime.utcnow)

    unbanned_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    unbanned_by_user = db.relationship('User', foreign_keys=[unbanned_by])

    unbanned_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (
        db.Index('ix_user_id_is_banned', 'user_id', 'is_banned'),
    )

    # 1. BAN A USER
    @staticmethod
    def ban_user(user_id, banned_by_id, reason=None, days=None):
        """Ban a user with either permanent or temporary ban"""
        is_permanent = (days is None)

        new_ban = Ban(
            user_id=user_id,
            is_banned=True,
            banned_by=banned_by_id,
            ban_reason=reason,
            ban_duration=days,
            is_permanent=is_permanent
        )
        db.session.add(new_ban)
        db.session.commit()
        return new_ban

    # 2. UNBAN A USER
    @staticmethod
    def unban_user(user_id, unbanned_by_id):
        """Manually unban a user"""
        active_ban = Ban.check_and_auto_unban(user_id)
        if active_ban:
            ban_record = Ban.query.get(active_ban['ban_id'])
            ban_record.is_banned = False
            ban_record.unbanned_at = datetime.utcnow()
            ban_record.unbanned_by = unbanned_by_id
            db.session.commit()
            return True
        return False

    # 3. CHECK BAN STATUS (with auto-unban if expired)
    @staticmethod
    def check_and_auto_unban(user_id):
        """Check if user is banned, and auto-unban if temporary ban expired"""
        ban = Ban.query.filter(
            Ban.user_id == user_id,
            Ban.is_banned == True,
        ).order_by(Ban.banned_at.desc()).first()

        if not ban:
            return False

        # Check if temporary ban expired
        if not ban.is_permanent and ban.ban_duration:
            ban_end = ban.banned_at + timedelta(days=ban.ban_duration)
            days_left = (ban_end - datetime.utcnow()).days

            if days_left < 0:
                # Auto-unban expired ban
                ban.unbanned_at = datetime.utcnow()
                ban.unbanned_by = None  # None means system auto-unbanned
                ban.is_banned = False
                db.session.commit()
                return False

        # Still active ban
        return {
            'is_banned': ban.is_banned,
            'ban_id': ban.id,
            'reason': ban.ban_reason,
            'banned_by': ban.banned_by,
            'banned_at': ban.banned_at,
            'is_permanent': ban.is_permanent,
            'days_left': max(0, (ban.banned_at + timedelta(days=ban.ban_duration) - datetime.utcnow()).days)
            if not ban.is_permanent and ban.ban_duration else None
        }


# Example usage
#Ban a user for 7 days
#Ban.ban_user(user_id=5, banned_by_id=1, reason="Spamming", days=7)

#Ban a user permanently
#Ban.ban_user(user_id=6, banned_by_id=2, reason="Abusive behavior")

#Unban a user
#Ban.unban_user(user_id=5, unbanned_by_id=1)

#Check ban status
#status = Ban.check_and_auto_unban(user_id=5)