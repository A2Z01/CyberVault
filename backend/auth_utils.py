import os
import jwt
import bcrypt
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request
from bson import ObjectId

JWT_ALGORITHM = "HS256"
logger = logging.getLogger(__name__)


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request, db) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Convert _id to string and store as both _id and id for compatibility
        user_id = str(user["_id"])
        user["_id"] = user_id
        user["id"] = user_id
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def send_notification_email(recipient_email: str, subject: str, html_content: str):
    """Send email notification. Logs to console if RESEND_API_KEY is not set."""
    resend_key = os.environ.get("RESEND_API_KEY", "")
    
    if not resend_key:
        logger.info("=" * 80)
        logger.info("EMAIL NOTIFICATION (Console Mode - No Resend Key)")
        logger.info("=" * 80)
        logger.info(f"To: {recipient_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{html_content}")
        logger.info("=" * 80)
        return {"status": "logged", "message": "Email logged to console"}
    
    try:
        import resend
        resend.api_key = resend_key
        sender_email = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
        
        params = {
            "from": sender_email,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content
        }
        
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {recipient_email}")
        return {"status": "sent", "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return {"status": "failed", "error": str(e)}
