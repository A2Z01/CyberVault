from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, EmailStr
import secrets
import math
from datetime import datetime, timezone
from bson import ObjectId

from auth_utils import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    get_current_user, send_notification_email
)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Hardcoded wordlist
WORDLIST = [
    "account", "action", "admin", "agent", "algorithm", "anchor", "android", "api",
    "apple", "archive", "array", "atom", "avatar", "backend", "balance", "banner",
    "battery", "beacon", "binary", "bitcoin", "blockchain", "boolean", "border", "branch",
    "browser", "buffer", "bundle", "button", "cache", "canvas", "carbon", "cascade",
    "castle", "catalog", "chamber", "channel", "chapter", "cipher", "circuit", "client",
    "cloud", "cluster", "code", "comet", "command", "compiler", "component", "console",
    "container", "context", "contract", "control", "cookie", "copper", "core", "cosmos",
    "counter", "crypto", "crystal", "cursor", "cyber", "cycle", "daemon", "dashboard",
    "database", "debug", "decimal", "decoder", "delta", "desktop", "device", "diamond",
    "digital", "domain", "dragon", "driver", "drone", "dynamic", "eclipse", "editor",
    "electron", "element", "encoder", "engine", "entity", "epsilon", "error", "ethereum",
    "event", "falcon", "fiber", "filter", "firewall", "firmware", "folder", "forest",
    "formula", "fortress", "fragment", "frame", "frontend", "function", "fusion", "galaxy",
    "gateway", "generator", "genome", "ghost", "glacier", "global", "gradient", "graph",
    "gravity", "grid", "guardian", "handler", "harbor", "hardware", "harvest", "header",
    "helix", "horizon", "hunter", "hybrid", "icon", "identity", "index", "infinite",
    "input", "instance", "integer", "interface", "internet", "invoice", "island", "iteration",
    "kernel", "lambda", "laser", "layer", "legend", "library", "lightning", "linear",
    "linux", "liquid", "logger", "logic", "machine", "macro", "magnet", "matrix",
    "memory", "merchant", "message", "metadata", "meteor", "method", "metric", "micro",
    "mirror", "mission", "module", "monitor", "mountain", "navigator", "nebula", "network",
    "neural", "nexus", "node", "nucleus", "object", "ocean", "omega", "operator",
    "orbit", "origin", "output", "package", "packet", "palette", "parallel", "parser",
    "particle", "password", "pattern", "payload", "phoenix", "photon", "pipeline", "pixel",
    "plasma", "platform", "player", "plugin", "pointer", "polygon", "portal", "prism",
    "process", "profile", "program", "project", "protocol", "proxy", "pulse", "python",
    "quantum", "query", "queue", "radar", "radius", "random", "reactor", "realm",
    "recipe", "record", "redirect", "refactor", "register", "render", "report", "request",
    "resolver", "response", "reverse", "rocket", "router", "runtime", "sample", "sandbox",
    "satellite", "scanner", "schema", "scope", "script", "sector", "segment", "selector",
    "sensor", "sentinel", "sequence", "server", "session", "shadow", "signal", "silicon",
    "silver", "socket", "solar", "spectrum", "sphere", "spider", "spiral", "stack",
    "standard", "station", "storage", "stream", "string", "structure", "sublime", "subnet",
    "swift", "switch", "symbol", "syntax", "system", "tablet", "target", "template",
    "terminal", "terraform", "thread", "thunder", "tiger", "timeline", "token", "tornado",
    "tracker", "traffic", "trigger", "trinity", "tunnel", "turbo", "ultra", "unicode",
    "union", "universal", "upload", "urban", "user", "utility", "vacuum", "validation",
    "value", "variable", "vault", "vector", "velocity", "vertex", "virtual", "vision",
    "void", "vortex", "wallet", "warrior", "watcher", "wave", "widget", "window",
    "wireless", "wizard", "worker", "workflow", "wrapper", "xenon", "yaml", "zenith",
    "zero", "zombie", "zone"
]


# Pydantic Models
class GenerateRequest(BaseModel):
    word_count: int = Field(default=4, ge=3, le=8)
    separator: str = Field(default="-")
    append_digit: bool = Field(default=False)


class GenerateResponse(BaseModel):
    passphrase: str
    entropy: float
    strength: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = "User"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str


class SavePassphraseRequest(BaseModel):
    passphrase: str
    entropy: float
    strength: str
    word_count: int
    separator: str
    has_numbers: bool
    use_case: str = "general"
    label: str = ""


class SavedPassphraseResponse(BaseModel):
    id: str
    passphrase: str
    entropy: float
    strength: str
    word_count: int
    separator: str
    has_numbers: bool
    use_case: str
    label: str
    created_at: str


class RecommendationRequest(BaseModel):
    use_case: str
    typing_frequency: str
    priority: str
    requires_special_chars: bool


def calculate_entropy(passphrase: str, word_count: int, append_digit: bool) -> float:
    wordlist_size = len(WORDLIST)
    combinations = wordlist_size ** word_count
    
    if append_digit:
        combinations *= 10
    
    entropy = math.log2(combinations)
    return round(entropy, 2)


def get_strength_level(entropy: float) -> str:
    if entropy < 45:
        return "weak"
    elif entropy < 65:
        return "medium"
    else:
        return "secure"


# Passphrase Generation Endpoints
@api_router.get("/")
async def root():
    return {"message": "Cyber-Vault Passphrase Generator API"}


@api_router.post("/generate", response_model=GenerateResponse)
async def generate_passphrase(request: GenerateRequest):
    try:
        if not 3 <= request.word_count <= 8:
            raise HTTPException(status_code=400, detail="word_count must be between 3 and 8")
        
        words = [secrets.choice(WORDLIST) for _ in range(request.word_count)]
        passphrase = request.separator.join(words)
        
        if request.append_digit:
            digit = secrets.randbelow(10)
            passphrase += str(digit)
        
        entropy = calculate_entropy(passphrase, request.word_count, request.append_digit)
        strength = get_strength_level(entropy)
        
        return GenerateResponse(passphrase=passphrase, entropy=entropy, strength=strength)
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generating passphrase: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate passphrase")


# Authentication Endpoints
@api_router.post("/auth/register")
async def register(request: RegisterRequest, response: Response):
    email = request.email.lower()
    
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = hash_password(request.password)
    
    user_doc = {
        "email": email,
        "password_hash": password_hash,
        "name": request.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token", value=access_token, httponly=True,
        secure=False, samesite="lax", max_age=900, path="/"
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token, httponly=True,
        secure=False, samesite="lax", max_age=604800, path="/"
    )
    
    # Send welcome email
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #020617 0%, #0f172a 100%);">
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 40px; text-align: center;">
            <h1 style="color: #34d399; font-size: 32px; margin-bottom: 20px;">🛡️ Welcome to Cyber-Vault!</h1>
            <p style="color: #cbd5e1; font-size: 18px; margin-bottom: 30px;">Your account has been successfully created.</p>
            <div style="background: rgba(2, 6, 23, 0.6); border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="color: #94a3b8; margin: 0; font-size: 14px;">Registered Email</p>
                <p style="color: #34d399; font-size: 20px; font-weight: bold; margin: 10px 0;">{email}</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                You can now generate cryptographically secure passphrases with our advanced generator.
                Start creating strong, memorable passwords today!
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(52, 211, 153, 0.2);">
                <p style="color: #64748b; font-size: 12px; margin: 0;">Powered by Python's secrets module for maximum security</p>
            </div>
        </div>
    </div>
    """
    await send_notification_email(email, "Welcome to Cyber-Vault! 🛡️", html_content)
    
    return {
        "id": user_id,
        "email": email,
        "name": request.name,
        "role": "user",
        "created_at": user_doc["created_at"].isoformat()
    }


@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response, req: Request):
    email = request.email.lower()
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(
        key="access_token", value=access_token, httponly=True,
        secure=False, samesite="lax", max_age=900, path="/"
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token, httponly=True,
        secure=False, samesite="lax", max_age=604800, path="/"
    )
    
    # Send login notification email
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #020617 0%, #0f172a 100%);">
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 40px; text-align: center;">
            <h1 style="color: #34d399; font-size: 28px; margin-bottom: 20px;">⚡ Login Detected</h1>
            <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 30px;">A new login to your Cyber-Vault account was detected.</p>
            <div style="background: rgba(2, 6, 23, 0.6); border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="color: #94a3b8; margin: 0; font-size: 14px;">Login Time</p>
                <p style="color: #34d399; font-size: 18px; font-weight: bold; margin: 10px 0;">{datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                If this wasn't you, please secure your account immediately by changing your password.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(52, 211, 153, 0.2);">
                <p style="color: #64748b; font-size: 12px; margin: 0;">Stay secure with Cyber-Vault 🔒</p>
            </div>
        </div>
    </div>
    """
    await send_notification_email(email, "New Login to Cyber-Vault ⚡", html_content)
    
    return {
        "id": user_id,
        "email": email,
        "name": user.get("name", "User"),
        "role": user.get("role", "user"),
        "created_at": user["created_at"].isoformat() if "created_at" in user else datetime.now(timezone.utc).isoformat()
    }


@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request, db)
    return user


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}


# Passphrase Recommendations
@api_router.post("/recommend")
async def get_recommendations(request: RecommendationRequest):
    """Get passphrase recommendations based on user needs."""
    
    # Define recommendation rules
    recommendations = {
        "word_count": 4,
        "separator": "-",
        "append_digit": False,
        "explanation": ""
    }
    
    # Banking, Work, High Security
    if request.use_case in ["banking", "work", "email", "financial"]:
        recommendations["word_count"] = 6 if request.priority == "security" else 5
        recommendations["append_digit"] = True
        recommendations["separator"] = "-"
        recommendations["explanation"] = f"For {request.use_case}, we recommend {recommendations['word_count']} words with numbers for strong security."
    
    # Social Media, Gaming
    elif request.use_case in ["social_media", "gaming", "entertainment"]:
        recommendations["word_count"] = 4 if request.typing_frequency == "daily" else 5
        recommendations["append_digit"] = request.requires_special_chars
        recommendations["separator"] = "-"
        recommendations["explanation"] = f"For {request.use_case}, a memorable {recommendations['word_count']}-word passphrase works well."
    
    # Personal, Notes, Low Security
    elif request.use_case in ["personal", "notes", "low_security"]:
        recommendations["word_count"] = 3
        recommendations["append_digit"] = False
        recommendations["separator"] = " "
        recommendations["explanation"] = "For personal use, a simple 3-word passphrase is easy to remember."
    
    # Maximum Security
    else:
        if request.priority == "security":
            recommendations["word_count"] = 8
            recommendations["append_digit"] = True
            recommendations["separator"] = "-"
            recommendations["explanation"] = "For maximum security, we recommend 8 words with numbers."
        else:
            recommendations["word_count"] = 4
            recommendations["append_digit"] = request.requires_special_chars
            recommendations["separator"] = "-"
            recommendations["explanation"] = "A balanced 4-word passphrase offers good security and memorability."
    
    # Adjust based on typing frequency
    if request.typing_frequency == "daily" and recommendations["word_count"] > 5:
        recommendations["word_count"] = 5
        recommendations["explanation"] += " Reduced to 5 words since you'll type it daily."
    
    return recommendations


# Saved Passphrases Endpoints
@api_router.post("/passphrases/save")
async def save_passphrase(request: SavePassphraseRequest, req: Request):
    """Save a passphrase to user's history."""
    user = await get_current_user(req, db)
    
    passphrase_doc = {
        "user_id": user["id"],
        "passphrase": request.passphrase,
        "entropy": request.entropy,
        "strength": request.strength,
        "word_count": request.word_count,
        "separator": request.separator,
        "has_numbers": request.has_numbers,
        "use_case": request.use_case,
        "label": request.label,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.saved_passphrases.insert_one(passphrase_doc)
    
    return {
        "id": str(result.inserted_id),
        "message": "Passphrase saved successfully"
    }


@api_router.get("/passphrases/saved")
async def get_saved_passphrases(request: Request):
    """Get all saved passphrases for the current user."""
    user = await get_current_user(request, db)
    
    passphrases = await db.saved_passphrases.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add id field from MongoDB _id
    cursor = db.saved_passphrases.find({"user_id": user["id"]}).sort("created_at", -1).limit(100)
    passphrases = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["created_at"] = doc["created_at"].isoformat()
        passphrases.append(doc)
    
    return passphrases


@api_router.delete("/passphrases/{passphrase_id}")
async def delete_passphrase(passphrase_id: str, request: Request):
    """Delete a saved passphrase."""
    user = await get_current_user(request, db)
    
    result = await db.saved_passphrases.delete_one({
        "_id": ObjectId(passphrase_id),
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Passphrase not found")
    
    return {"message": "Passphrase deleted successfully"}


# Startup: Seed admin and create indexes
@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.saved_passphrases.create_index([("user_id", 1), ("created_at", -1)])
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if existing_admin is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logging.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logging.info(f"Admin password updated: {admin_email}")
    
    # Write test credentials
    creds_path = Path("/app/memory/test_credentials.md")
    creds_path.parent.mkdir(parents=True, exist_ok=True)
    creds_path.write_text(f"""# Test Credentials for Cyber-Vault

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

## Passphrase Endpoints
- POST /api/generate
""")
    logging.info("Test credentials saved to /app/memory/test_credentials.md")


# Include the router in the main app
app.include_router(api_router)

# CORS configuration
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
