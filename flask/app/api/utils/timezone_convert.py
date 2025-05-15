from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import pytz

def format_datetime_for_frontend(dt_str: str) -> str:
    dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))  # Handle UTC if needed
    return dt.strftime('%d-%m-%Y %H:%M')

def convert_utc_to_user_tz(utc_dt: datetime, user_tz_str: str) -> str | None:
    """
    Convert a UTC datetime to the user's timezone.
    Returns ISO 8601 string (without timezone info) or None if utc_dt is None.
    """
    print(f"Converting UTC datetime {utc_dt} to timezone {user_tz_str}")

    if utc_dt is None:
        print("No datetime provided, returning None")
        return None
    
    try:
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
        try:
            # First try with modern zoneinfo
            user_dt = utc_dt.astimezone(ZoneInfo(user_tz_str))
        except:
            # Fallback to pytz if zoneinfo fails
            user_dt = utc_dt.astimezone(pytz.timezone(user_tz_str))
            
        # Convert to naive datetime (without timezone info)
        naive_dt = user_dt.replace(tzinfo=None)
        print(f"Converted datetime: {naive_dt}")
        return format_datetime_for_frontend(naive_dt.isoformat())
    except Exception as e:
        print(f"Error converting timezone: {user_tz_str}. Defaulting to UTC.")
        print(f"Exception: {e}")
        return utc_dt.replace(tzinfo=None).isoformat()  # Also return naive UTC