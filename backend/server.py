from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
import secrets
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Hardcoded list of 100+ common nouns for passphrase generation
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


class GenerateRequest(BaseModel):
    word_count: int = Field(default=4, ge=3, le=8)
    separator: str = Field(default="-")
    append_digit: bool = Field(default=False)


class GenerateResponse(BaseModel):
    passphrase: str
    entropy: float
    strength: str


def calculate_entropy(passphrase: str, word_count: int, append_digit: bool) -> float:
    """
    Calculate entropy in bits based on the configuration.
    Entropy = log2(possible_combinations)
    """
    wordlist_size = len(WORDLIST)
    combinations = wordlist_size ** word_count
    
    if append_digit:
        combinations *= 10  # 0-9 digits
    
    entropy = math.log2(combinations)
    return round(entropy, 2)


def get_strength_level(entropy: float) -> str:
    """Return strength classification based on entropy."""
    if entropy < 45:
        return "weak"
    elif entropy < 65:
        return "medium"
    else:
        return "secure"


@api_router.get("/")
async def root():
    return {"message": "Cyber-Vault Passphrase Generator API"}


@api_router.post("/generate", response_model=GenerateResponse)
async def generate_passphrase(request: GenerateRequest):
    """
    Generate a cryptographically secure passphrase.
    
    Parameters:
    - word_count: Number of words (3-8)
    - separator: Character to join words
    - append_digit: Whether to append a random digit
    """
    try:
        # Validate word_count range
        if not 3 <= request.word_count <= 8:
            raise HTTPException(
                status_code=400,
                detail="word_count must be between 3 and 8"
            )
        
        # Generate random words using secrets module for cryptographic randomness
        words = [secrets.choice(WORDLIST) for _ in range(request.word_count)]
        
        # Join with separator
        passphrase = request.separator.join(words)
        
        # Append random digit if requested
        if request.append_digit:
            digit = secrets.randbelow(10)
            passphrase += str(digit)
        
        # Calculate entropy
        entropy = calculate_entropy(passphrase, request.word_count, request.append_digit)
        strength = get_strength_level(entropy)
        
        return GenerateResponse(
            passphrase=passphrase,
            entropy=entropy,
            strength=strength
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generating passphrase: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate passphrase"
        )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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