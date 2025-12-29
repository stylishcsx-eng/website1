from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import a2s
import asyncio
import aiohttp

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'cs16-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 48

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_email = payload.get("sub")
    if not user_email:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def create_audit_log(admin_email: str, admin_nickname: str, action: str, details: str):
    """Create an audit log entry for admin actions"""
    log_doc = {
        "id": str(uuid.uuid4()),
        "admin_email": admin_email,
        "admin_nickname": admin_nickname,
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(log_doc)

async def send_discord_webhook(message: str):
    """Send notification to Discord webhook if configured"""
    webhook_url = os.environ.get('DISCORD_WEBHOOK_URL')
    if not webhook_url:
        return
    
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(webhook_url, json={"content": message})
    except Exception as e:
        logger.error(f"Failed to send Discord webhook: {e}")

async def query_game_server():
    """Query the CS 1.6 server for live status"""
    server_ip = os.environ.get('GAME_SERVER_IP', '82.22.174.126')
    server_port = int(os.environ.get('GAME_SERVER_PORT', '27016'))
    
    try:
        # Query server info
        info = await asyncio.wait_for(
            asyncio.to_thread(a2s.info, (server_ip, server_port)),
            timeout=5.0
        )
        
        # Query player list
        try:
            players = await asyncio.wait_for(
                asyncio.to_thread(a2s.players, (server_ip, server_port)),
                timeout=5.0
            )
            player_names = [p.name for p in players if p.name]
        except:
            player_names = []
        
        return {
            "online": True,
            "server_name": info.server_name,
            "server_ip": f"{server_ip}:{server_port}",
            "current_map": info.map_name,
            "players_online": info.player_count,
            "max_players": info.max_players,
            "players_list": player_names
        }
    except Exception as e:
        logger.warning(f"Failed to query game server: {e}")
        # Return fallback data
        return {
            "online": False,
            "server_name": "CS 1.6 Elite Server",
            "server_ip": f"{server_ip}:{server_port}",
            "current_map": "Unknown",
            "players_online": 0,
            "max_players": 32,
            "players_list": []
        }

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nickname: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    nickname: str
    role: str
    steamid: Optional[str] = None
    created_at: str

class Ban(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    player_nickname: str
    steamid: str
    ip: str
    reason: str
    admin_name: str
    duration: str
    ban_date: str

class Player(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nickname: str
    steamid: str
    rank: int
    level: int
    kills: int
    deaths: int
    playtime: int
    kd_ratio: float

class AdminApplication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nickname: str
    steamid: str
    age: int
    experience: str
    reason: str
    status: str
    submitted_at: str

class AdminApplicationCreate(BaseModel):
    nickname: str
    steamid: str
    age: int
    experience: str
    reason: str

class ServerStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    online: bool
    server_name: str
    server_ip: str
    current_map: str
    players_online: int
    max_players: int
    players_list: Optional[List[str]] = []

class DashboardStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_users: int
    total_players: int
    total_bans: int
    online_players: int

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    admin_email: str
    admin_nickname: str
    action: str
    details: str
    timestamp: str

class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    page_size: int
    total_pages: int

# Routes - Auth
@api_router.post("/auth/register")
async def register(user: UserRegister):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hash_password(user.password),
        "nickname": user.nickname,
        "role": "user",
        "steamid": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user.email})
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k != 'password'}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": credentials.email})
    return {"token": token, "user": {k: v for k, v in user.items() if k != 'password'}}

@api_router.get("/auth/me", response_model=User)
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != 'password'}

# Routes - Dashboard
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    total_users = await db.users.count_documents({})
    total_players = await db.players.count_documents({})
    total_bans = await db.bans.count_documents({})
    server = await db.server_status.find_one({}, {"_id": 0})
    online_players = server.get("players_online", 0) if server else 0
    
    return {
        "total_users": total_users,
        "total_players": total_players,
        "total_bans": total_bans,
        "online_players": online_players
    }

@api_router.get("/server-status", response_model=ServerStatus)
async def get_server_status():
    status = await db.server_status.find_one({}, {"_id": 0})
    if not status:
        raise HTTPException(status_code=404, detail="Server status not found")
    return status

# Routes - Bans
@api_router.get("/bans", response_model=List[Ban])
async def get_bans(search: Optional[str] = None, skip: int = 0, limit: int = 50):
    query = {}
    if search:
        query = {"$or": [
            {"player_nickname": {"$regex": search, "$options": "i"}},
            {"steamid": {"$regex": search, "$options": "i"}}
        ]}
    
    bans = await db.bans.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(1000)
    return bans

@api_router.post("/bans", response_model=Ban)
async def create_ban(ban_data: dict, admin: dict = Depends(get_admin_user)):
    ban_doc = {
        "id": str(uuid.uuid4()),
        "player_nickname": ban_data["player_nickname"],
        "steamid": ban_data["steamid"],
        "ip": ban_data["ip"],
        "reason": ban_data["reason"],
        "admin_name": admin["nickname"],
        "duration": ban_data["duration"],
        "ban_date": datetime.now(timezone.utc).isoformat()
    }
    await db.bans.insert_one(ban_doc)
    return ban_doc

# Routes - Players
@api_router.get("/players", response_model=List[Player])
async def get_players(skip: int = 0, limit: int = 50):
    players = await db.players.find({}, {"_id": 0}).sort("rank", 1).skip(skip).limit(limit).to_list(1000)
    return players

@api_router.get("/players/{steamid}", response_model=Player)
async def get_player(steamid: str):
    player = await db.players.find_one({"steamid": steamid}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api_router.get("/rankings/top", response_model=List[Player])
async def get_top_players(limit: int = 10):
    players = await db.players.find({}, {"_id": 0}).sort("rank", 1).limit(limit).to_list(limit)
    return players

# Routes - Admin Applications
@api_router.post("/admin-applications", response_model=AdminApplication)
async def submit_application(app_data: AdminApplicationCreate):
    app_doc = {
        "id": str(uuid.uuid4()),
        "nickname": app_data.nickname,
        "steamid": app_data.steamid,
        "age": app_data.age,
        "experience": app_data.experience,
        "reason": app_data.reason,
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_applications.insert_one(app_doc)
    return app_doc

@api_router.get("/admin-applications", response_model=List[AdminApplication])
async def get_applications(admin: dict = Depends(get_admin_user)):
    apps = await db.admin_applications.find({}, {"_id": 0}).to_list(1000)
    return apps

@api_router.patch("/admin-applications/{app_id}")
async def update_application_status(app_id: str, status_data: dict, admin: dict = Depends(get_admin_user)):
    result = await db.admin_applications.update_one(
        {"id": app_id},
        {"$set": {"status": status_data["status"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application updated"}

# Routes - Admin Panel
@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.delete("/bans/{ban_id}")
async def delete_ban(ban_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.bans.delete_one({"id": ban_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ban not found")
    return {"message": "Ban deleted"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def init_db():
    await db.users.create_index("email", unique=True)
    await db.bans.create_index("steamid")
    await db.players.create_index("steamid", unique=True)
    await init_dummy_data()

async def init_dummy_data():
    if await db.users.count_documents({}) > 0:
        return
    
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@cs16server.com",
        "password": hash_password("admin123"),
        "nickname": "ServerAdmin",
        "role": "admin",
        "steamid": "STEAM_0:0:123456",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    
    demo_user = {
        "id": str(uuid.uuid4()),
        "email": "demo@player.com",
        "password": hash_password("demo123"),
        "nickname": "DemoPlayer",
        "role": "user",
        "steamid": "STEAM_0:1:789012",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(demo_user)
    
    server_status = {
        "online": True,
        "server_name": "CS 1.6 Elite Server",
        "server_ip": "82.22.174.126:27016",
        "current_map": "de_dust2",
        "players_online": 18,
        "max_players": 32
    }
    await db.server_status.insert_one(server_status)
    
    players_data = [
        {"id": str(uuid.uuid4()), "nickname": "ProGamer", "steamid": "STEAM_0:0:111111", "rank": 1, "level": 50, "kills": 5420, "deaths": 2150, "playtime": 24580, "kd_ratio": 2.52},
        {"id": str(uuid.uuid4()), "nickname": "HeadshotKing", "steamid": "STEAM_0:1:222222", "rank": 2, "level": 48, "kills": 4890, "deaths": 2010, "playtime": 22100, "kd_ratio": 2.43},
        {"id": str(uuid.uuid4()), "nickname": "SniperElite", "steamid": "STEAM_0:0:333333", "rank": 3, "level": 46, "kills": 4520, "deaths": 1980, "playtime": 20450, "kd_ratio": 2.28},
        {"id": str(uuid.uuid4()), "nickname": "RusherPro", "steamid": "STEAM_0:1:444444", "rank": 4, "level": 44, "kills": 4210, "deaths": 2250, "playtime": 18900, "kd_ratio": 1.87},
        {"id": str(uuid.uuid4()), "nickname": "TacticalMaster", "steamid": "STEAM_0:0:555555", "rank": 5, "level": 42, "kills": 3980, "deaths": 2100, "playtime": 17650, "kd_ratio": 1.90},
        {"id": str(uuid.uuid4()), "nickname": "CamperLegend", "steamid": "STEAM_0:1:666666", "rank": 6, "level": 40, "kills": 3750, "deaths": 2400, "playtime": 16200, "kd_ratio": 1.56},
        {"id": str(uuid.uuid4()), "nickname": "AWPerGod", "steamid": "STEAM_0:0:777777", "rank": 7, "level": 38, "kills": 3520, "deaths": 2150, "playtime": 15100, "kd_ratio": 1.64},
        {"id": str(uuid.uuid4()), "nickname": "NadeExpert", "steamid": "STEAM_0:1:888888", "rank": 8, "level": 36, "kills": 3290, "deaths": 2300, "playtime": 13850, "kd_ratio": 1.43},
        {"id": str(uuid.uuid4()), "nickname": "ClutchKing", "steamid": "STEAM_0:0:999999", "rank": 9, "level": 34, "kills": 3050, "deaths": 2250, "playtime": 12500, "kd_ratio": 1.36},
        {"id": str(uuid.uuid4()), "nickname": "FragMachine", "steamid": "STEAM_0:1:101010", "rank": 10, "level": 32, "kills": 2820, "deaths": 2200, "playtime": 11200, "kd_ratio": 1.28}
    ]
    await db.players.insert_many(players_data)
    
    bans_data = [
        {"id": str(uuid.uuid4()), "player_nickname": "Cheater1337", "steamid": "STEAM_0:0:123123", "ip": "192.168.1.***", "reason": "Aimbot detected", "admin_name": "ServerAdmin", "duration": "Permanent", "ban_date": "2025-03-10T14:20:00Z"},
        {"id": str(uuid.uuid4()), "player_nickname": "WallHacker", "steamid": "STEAM_0:1:456456", "ip": "192.168.2.***", "reason": "Wallhack", "admin_name": "ServerAdmin", "duration": "Permanent", "ban_date": "2025-03-15T09:30:00Z"},
        {"id": str(uuid.uuid4()), "player_nickname": "ToxicPlayer", "steamid": "STEAM_0:0:789789", "ip": "192.168.3.***", "reason": "Toxic behavior and insults", "admin_name": "ServerAdmin", "duration": "30 days", "ban_date": "2025-03-18T16:45:00Z"},
        {"id": str(uuid.uuid4()), "player_nickname": "Spammer123", "steamid": "STEAM_0:1:321321", "ip": "192.168.4.***", "reason": "Chat spam", "admin_name": "ServerAdmin", "duration": "7 days", "ban_date": "2025-03-20T11:15:00Z"},
        {"id": str(uuid.uuid4()), "player_nickname": "TeamKiller", "steamid": "STEAM_0:0:654654", "ip": "192.168.5.***", "reason": "Repeated team killing", "admin_name": "ServerAdmin", "duration": "14 days", "ban_date": "2025-03-22T13:00:00Z"}
    ]
    await db.bans.insert_many(bans_data)
    
    applications_data = [
        {"id": str(uuid.uuid4()), "nickname": "NewAdmin1", "steamid": "STEAM_0:0:111222", "age": 25, "experience": "3 years CS 1.6 experience, was admin on another server", "reason": "I love this server and want to help maintain fair play", "status": "pending", "submitted_at": "2025-03-25T10:00:00Z"},
        {"id": str(uuid.uuid4()), "nickname": "HelpfulPlayer", "steamid": "STEAM_0:1:333444", "age": 28, "experience": "5 years playing CS, good knowledge of rules", "reason": "Want to contribute to the community", "status": "pending", "submitted_at": "2025-03-26T14:30:00Z"}
    ]
    await db.admin_applications.insert_many(applications_data)
    
    logger.info("Dummy data initialized successfully")