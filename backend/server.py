from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import a2s
import asyncio
import aiomysql

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET', 'shadowzm-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# CS 1.6 Server Config
CS_SERVER_IP = "82.22.174.126"
CS_SERVER_PORT = 27016
CS_SERVER_NAME = "shadowzm: Zombie reverse"

# AMXBans MySQL Config (set via environment or defaults)
AMXBANS_HOST = os.environ.get('AMXBANS_HOST', '82.22.174.126')
AMXBANS_PORT = int(os.environ.get('AMXBANS_PORT', '3306'))
AMXBANS_DB = os.environ.get('AMXBANS_DB', 'amx')
AMXBANS_USER = os.environ.get('AMXBANS_USER', 'root')
AMXBANS_PASS = os.environ.get('AMXBANS_PASS', '')

# Webhook secret for ban sync
BAN_WEBHOOK_SECRET = os.environ.get('BAN_WEBHOOK_SECRET', 'shadowzm-ban-secret-2024')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserCreate(BaseModel):
    nickname: str
    email: EmailStr
    password: str
    steamid: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    nickname: str
    email: str
    steamid: Optional[str] = None
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class BanCreate(BaseModel):
    player_nickname: str
    steamid: str
    ip: str
    reason: str
    admin_name: str
    duration: str

class BanResponse(BaseModel):
    id: str
    player_nickname: str
    steamid: str
    ip: str
    reason: str
    admin_name: str
    duration: str
    ban_date: str

class AdminApplicationCreate(BaseModel):
    nickname: str
    steamid: str
    age: int
    experience: str
    reason: str

class AdminApplicationResponse(BaseModel):
    id: str
    nickname: str
    steamid: str
    age: int
    experience: str
    reason: str
    status: str
    submitted_at: str

class AdminApplicationUpdate(BaseModel):
    status: str

class NotificationResponse(BaseModel):
    id: str
    steamid: Optional[str] = None
    nickname: Optional[str] = None
    message: str
    type: str
    read: bool
    created_at: str

class PlayerResponse(BaseModel):
    id: str
    nickname: str
    steamid: str
    kills: int
    deaths: int
    headshots: int
    level: int
    rank: int
    kd_ratio: float
    last_seen: str

class ServerStatusResponse(BaseModel):
    online: bool
    server_name: str
    server_ip: str
    current_map: str
    players_online: int
    max_players: int
    ping: int
    players: List[dict]

class DashboardStats(BaseModel):
    total_users: int
    total_players: int
    total_bans: int
    online_players: int
    pending_applications: int

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        return user
    except:
        return None

async def require_auth(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(user = Depends(require_auth)):
    if user.get("role") not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_owner(user = Depends(require_auth)):
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return user

# ==================== INIT DEFAULT ADMIN ====================

async def init_default_admin():
    owner = await db.users.find_one({"role": "owner"})
    if not owner:
        owner_user = {
            "id": str(uuid.uuid4()),
            "nickname": "Stylish",
            "email": "owner@shadowzm.com",
            "password": hash_password("Itachi1849"),
            "steamid": "STEAM_0:0:000000",
            "role": "owner",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(owner_user)
        logging.info("Default owner created: Stylish")
            "nickname": "Stylish",
            "email": "admin@shadowzm.com",
            "password": hash_password("Itachi1849"),
            "steamid": "STEAM_0:0:000000",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logging.info("Default admin created: Stylish")

# ==================== SERVER STATUS ====================

async def query_cs_server():
    try:
        loop = asyncio.get_event_loop()
        address = (CS_SERVER_IP, CS_SERVER_PORT)
        
        info = await loop.run_in_executor(None, lambda: a2s.info(address, timeout=5))
        players = await loop.run_in_executor(None, lambda: a2s.players(address, timeout=5))
        
        player_list = [{"name": p.name, "score": p.score, "duration": int(p.duration)} for p in players if p.name]
        
        return {
            "online": True,
            "server_name": info.server_name or CS_SERVER_NAME,
            "server_ip": f"{CS_SERVER_IP}:{CS_SERVER_PORT}",
            "current_map": info.map_name or "de_dust2",
            "players_online": info.player_count,
            "max_players": info.max_players,
            "ping": int(info.ping * 1000) if hasattr(info, 'ping') else 0,
            "players": player_list
        }
    except Exception as e:
        logging.warning(f"Failed to query CS server: {e}")
        return {
            "online": False,
            "server_name": CS_SERVER_NAME,
            "server_ip": f"{CS_SERVER_IP}:{CS_SERVER_PORT}",
            "current_map": "N/A",
            "players_online": 0,
            "max_players": 32,
            "ping": 0,
            "players": []
        }

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "id": str(uuid.uuid4()),
        "nickname": data.nickname,
        "email": data.email,
        "password": hash_password(data.password),
        "steamid": data.steamid,
        "role": "player",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

@api_router.post("/auth/admin-login", response_model=TokenResponse)
async def admin_login(data: AdminLogin):
    user = await db.users.find_one({"nickname": data.username, "role": "admin"}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = create_token({"sub": user["id"], "role": user["role"]})
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user = Depends(require_auth)):
    return {k: v for k, v in user.items() if k != "password"}

# ==================== SERVER STATUS ROUTES ====================

@api_router.get("/server-status", response_model=ServerStatusResponse)
async def get_server_status():
    return await query_cs_server()

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    server_status = await query_cs_server()
    total_users = await db.users.count_documents({})
    total_players = await db.players.count_documents({})
    total_bans = await db.bans.count_documents({})
    pending_apps = await db.admin_applications.count_documents({"status": "pending"})
    
    return {
        "total_users": total_users,
        "total_players": total_players,
        "total_bans": total_bans,
        "online_players": server_status["players_online"],
        "pending_applications": pending_apps
    }

# ==================== BANS ROUTES ====================

@api_router.get("/bans", response_model=List[BanResponse])
async def get_bans(search: Optional[str] = None):
    query = {}
    if search:
        query["$or"] = [
            {"player_nickname": {"$regex": search, "$options": "i"}},
            {"steamid": {"$regex": search, "$options": "i"}}
        ]
    bans = await db.bans.find(query, {"_id": 0}).to_list(1000)
    return bans

@api_router.post("/bans", response_model=BanResponse)
async def create_ban(data: BanCreate, user = Depends(require_admin)):
    ban = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "ban_date": datetime.now(timezone.utc).isoformat()
    }
    await db.bans.insert_one(ban)
    return ban

@api_router.delete("/bans/{ban_id}")
async def delete_ban(ban_id: str, user = Depends(require_admin)):
    result = await db.bans.delete_one({"id": ban_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ban not found")
    return {"message": "Ban removed"}

@api_router.delete("/bans/clear/demo")
async def clear_demo_bans(user = Depends(require_admin)):
    """Clear all demo bans"""
    result = await db.bans.delete_many({})
    return {"message": f"Cleared {result.deleted_count} bans"}

# ==================== PLAYERS / RANKINGS ROUTES ====================

@api_router.get("/players", response_model=List[PlayerResponse])
async def get_players(search: Optional[str] = None):
    query = {}
    if search:
        query["$or"] = [
            {"nickname": {"$regex": search, "$options": "i"}},
            {"steamid": {"$regex": search, "$options": "i"}}
        ]
    players = await db.players.find(query, {"_id": 0}).sort("kills", -1).to_list(100)
    return players

@api_router.get("/players/{steamid}", response_model=PlayerResponse)
async def get_player(steamid: str):
    player = await db.players.find_one({"steamid": steamid}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api_router.get("/rankings/top", response_model=List[PlayerResponse])
async def get_top_players(limit: int = 15):
    players = await db.players.find({}, {"_id": 0}).sort("kills", -1).to_list(limit)
    for i, p in enumerate(players):
        p["rank"] = i + 1
    return players

# ==================== ADMIN APPLICATIONS ROUTES ====================

@api_router.get("/admin-applications", response_model=List[AdminApplicationResponse])
async def get_admin_applications(user = Depends(require_admin)):
    apps = await db.admin_applications.find({}, {"_id": 0}).sort("submitted_at", -1).to_list(100)
    return apps

@api_router.post("/admin-applications", response_model=AdminApplicationResponse)
async def create_admin_application(data: AdminApplicationCreate):
    # Check if user has applied in the last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_app = await db.admin_applications.find_one({
        "steamid": data.steamid,
        "submitted_at": {"$gte": thirty_days_ago}
    })
    if recent_app:
        raise HTTPException(status_code=400, detail="You can only apply once per month. Please wait before reapplying.")
    
    app = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_applications.insert_one(app)
    return app

@api_router.patch("/admin-applications/{app_id}", response_model=AdminApplicationResponse)
async def update_admin_application(app_id: str, data: AdminApplicationUpdate, user = Depends(require_admin)):
    application = await db.admin_applications.find_one({"id": app_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    result = await db.admin_applications.find_one_and_update(
        {"id": app_id},
        {"$set": {"status": data.status}},
        return_document=True
    )
    result.pop("_id", None)
    
    # Create notification for the applicant
    notification = {
        "id": str(uuid.uuid4()),
        "steamid": application["steamid"],
        "nickname": application["nickname"],
        "message": f"Your admin application has been {data.status}!" if data.status in ["approved", "rejected"] else f"Application status: {data.status}",
        "type": "application_" + data.status,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return result

@api_router.delete("/admin-applications/{app_id}")
async def delete_admin_application(app_id: str, user = Depends(require_admin)):
    result = await db.admin_applications.delete_one({"id": app_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted"}

@api_router.delete("/admin-applications/bulk/old")
async def delete_old_applications(user = Depends(require_admin)):
    """Delete all applications older than 30 days"""
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    result = await db.admin_applications.delete_many({
        "submitted_at": {"$lt": thirty_days_ago}
    })
    return {"message": f"Deleted {result.deleted_count} old applications"}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(steamid: Optional[str] = None, nickname: Optional[str] = None):
    query = {}
    if steamid:
        query["steamid"] = steamid
    if nickname:
        query["nickname"] = nickname
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifications

@api_router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str):
    await db.notifications.update_one({"id": notif_id}, {"$set": {"read": True}})
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str):
    await db.notifications.delete_one({"id": notif_id})
    return {"message": "Notification deleted"}

# ==================== PLAYER STATS WEBHOOK (Live Rankings) ====================

class PlayerStatsWebhookData(BaseModel):
    secret: str
    nickname: str
    steamid: str
    kills: int
    deaths: int
    headshots: int = 0

@api_router.post("/players/webhook")
async def receive_player_stats_webhook(data: PlayerStatsWebhookData):
    """Receive player stats from game server webhook"""
    if data.secret != BAN_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    kd_ratio = round(data.kills / max(data.deaths, 1), 2)
    level = min(50, data.kills // 500)  # Level based on kills
    
    # Update or insert player
    existing = await db.players.find_one({"steamid": data.steamid})
    
    player_data = {
        "nickname": data.nickname,
        "steamid": data.steamid,
        "kills": data.kills,
        "deaths": data.deaths,
        "headshots": data.headshots,
        "kd_ratio": kd_ratio,
        "level": level,
        "last_seen": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.players.update_one(
            {"steamid": data.steamid},
            {"$set": player_data}
        )
        return {"message": "Player updated", "steamid": data.steamid}
    else:
        player_data["id"] = str(uuid.uuid4())
        player_data["rank"] = 0  # Will be calculated
        await db.players.insert_one(player_data)
        return {"message": "Player added", "steamid": data.steamid}

@api_router.delete("/players/clear/demo")
async def clear_demo_players(user = Depends(require_admin)):
    """Clear all demo players"""
    result = await db.players.delete_many({})
    return {"message": f"Cleared {result.deleted_count} players"}

# ==================== BAN WEBHOOK (Simple Solution) ====================

class BanWebhookData(BaseModel):
    secret: str
    player_nickname: str
    steamid: str
    reason: str
    admin_name: str
    duration: str  # e.g., "Permanent", "30 days", "7 days"

@api_router.post("/bans/webhook")
async def receive_ban_webhook(data: BanWebhookData):
    """Receive ban from game server webhook - no IP stored"""
    if data.secret != BAN_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    # Check if ban already exists
    existing = await db.bans.find_one({"steamid": data.steamid, "reason": data.reason})
    if existing:
        return {"message": "Ban already exists", "id": existing["id"]}
    
    ban = {
        "id": str(uuid.uuid4()),
        "player_nickname": data.player_nickname,
        "steamid": data.steamid,
        "ip": "Hidden",  # Don't store IP
        "reason": data.reason,
        "admin_name": data.admin_name,
        "duration": data.duration,
        "ban_date": datetime.now(timezone.utc).isoformat(),
        "source": "server"
    }
    await db.bans.insert_one(ban)
    return {"message": "Ban added", "id": ban["id"]}

@api_router.delete("/bans/webhook/{steamid}")
async def remove_ban_webhook(steamid: str, secret: str):
    """Remove ban via webhook (for unbans)"""
    if secret != BAN_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    result = await db.bans.delete_many({"steamid": steamid})
    return {"message": f"Removed {result.deleted_count} ban(s)"}

# ==================== AMXBANS LIVE SYNC ====================

async def fetch_amxbans():
    """Fetch bans from AMXBans MySQL database"""
    try:
        conn = await aiomysql.connect(
            host=AMXBANS_HOST,
            port=AMXBANS_PORT,
            user=AMXBANS_USER,
            password=AMXBANS_PASS,
            db=AMXBANS_DB
        )
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("""
                SELECT player_nick, player_id, player_ip, ban_reason, admin_nick, ban_length, ban_created 
                FROM amx_bans 
                WHERE expired = 0 OR ban_length = 0
                ORDER BY ban_created DESC
                LIMIT 100
            """)
            bans = await cur.fetchall()
        conn.close()
        return bans
    except Exception as e:
        logging.warning(f"Failed to fetch AMXBans: {e}")
        return None

async def sync_amxbans_to_db():
    """Sync AMXBans to local MongoDB"""
    amx_bans = await fetch_amxbans()
    if amx_bans is None:
        return False
    
    for ban in amx_bans:
        existing = await db.bans.find_one({"steamid": ban.get("player_id", ""), "source": "amxbans"})
        if not existing:
            duration = "Permanent" if ban.get("ban_length", 0) == 0 else f"{ban.get('ban_length', 0)} min"
            new_ban = {
                "id": str(uuid.uuid4()),
                "player_nickname": ban.get("player_nick", "Unknown"),
                "steamid": ban.get("player_id", ""),
                "ip": ban.get("player_ip", ""),
                "reason": ban.get("ban_reason", "No reason"),
                "admin_name": ban.get("admin_nick", "Server"),
                "duration": duration,
                "ban_date": datetime.fromtimestamp(ban.get("ban_created", 0), tz=timezone.utc).isoformat() if ban.get("ban_created") else datetime.now(timezone.utc).isoformat(),
                "source": "amxbans"
            }
            await db.bans.insert_one(new_ban)
    return True

@api_router.post("/bans/sync-amxbans")
async def sync_amxbans(user = Depends(require_admin)):
    """Manually sync bans from AMXBans database"""
    success = await sync_amxbans_to_db()
    if success:
        return {"message": "AMXBans synced successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to connect to AMXBans database. Check MySQL credentials.")

@api_router.get("/bans/amxbans-status")
async def check_amxbans_status():
    """Check if AMXBans connection is working"""
    try:
        conn = await aiomysql.connect(
            host=AMXBANS_HOST,
            port=AMXBANS_PORT,
            user=AMXBANS_USER,
            password=AMXBANS_PASS,
            db=AMXBANS_DB
        )
        conn.close()
        return {"connected": True, "host": AMXBANS_HOST, "database": AMXBANS_DB}
    except Exception as e:
        return {"connected": False, "error": str(e)}

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(user = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

# ==================== SEED DATA ====================

async def seed_demo_data():
    # Seed some demo players
    players_count = await db.players.count_documents({})
    if players_count == 0:
        demo_players = [
            {"id": str(uuid.uuid4()), "nickname": "HeadshotKing", "steamid": "STEAM_0:1:12345678", "kills": 15420, "deaths": 4521, "headshots": 8920, "level": 45, "rank": 1, "kd_ratio": 3.41, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "NightProwler", "steamid": "STEAM_0:0:23456789", "kills": 12890, "deaths": 5120, "headshots": 6540, "level": 42, "rank": 2, "kd_ratio": 2.52, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "ShadowStriker", "steamid": "STEAM_0:1:34567890", "kills": 11200, "deaths": 4890, "headshots": 5890, "level": 40, "rank": 3, "kd_ratio": 2.29, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "BulletStorm", "steamid": "STEAM_0:0:45678901", "kills": 9870, "deaths": 4230, "headshots": 4560, "level": 38, "rank": 4, "kd_ratio": 2.33, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "FragMaster", "steamid": "STEAM_0:1:56789012", "kills": 8540, "deaths": 3980, "headshots": 4120, "level": 35, "rank": 5, "kd_ratio": 2.15, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "ColdBlood", "steamid": "STEAM_0:0:67890123", "kills": 7650, "deaths": 3560, "headshots": 3890, "level": 33, "rank": 6, "kd_ratio": 2.15, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "QuickScope", "steamid": "STEAM_0:1:78901234", "kills": 6890, "deaths": 3210, "headshots": 3450, "level": 31, "rank": 7, "kd_ratio": 2.15, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "TacticalAce", "steamid": "STEAM_0:0:89012345", "kills": 6120, "deaths": 2980, "headshots": 3120, "level": 29, "rank": 8, "kd_ratio": 2.05, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "DeathDealer", "steamid": "STEAM_0:1:90123456", "kills": 5430, "deaths": 2760, "headshots": 2780, "level": 27, "rank": 9, "kd_ratio": 1.97, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "StealthHunter", "steamid": "STEAM_0:0:01234567", "kills": 4890, "deaths": 2540, "headshots": 2450, "level": 25, "rank": 10, "kd_ratio": 1.93, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "IronSight", "steamid": "STEAM_0:1:11223344", "kills": 4320, "deaths": 2310, "headshots": 2180, "level": 23, "rank": 11, "kd_ratio": 1.87, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "ViperStrike", "steamid": "STEAM_0:0:22334455", "kills": 3780, "deaths": 2050, "headshots": 1920, "level": 21, "rank": 12, "kd_ratio": 1.84, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "GhostWalker", "steamid": "STEAM_0:1:33445566", "kills": 3210, "deaths": 1780, "headshots": 1650, "level": 19, "rank": 13, "kd_ratio": 1.80, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "RapidFire", "steamid": "STEAM_0:0:44556677", "kills": 2650, "deaths": 1520, "headshots": 1380, "level": 17, "rank": 14, "kd_ratio": 1.74, "last_seen": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "nickname": "SilentKill", "steamid": "STEAM_0:1:55667788", "kills": 2120, "deaths": 1250, "headshots": 1100, "level": 15, "rank": 15, "kd_ratio": 1.70, "last_seen": datetime.now(timezone.utc).isoformat()},
        ]
        await db.players.insert_many(demo_players)
        logging.info("Demo players seeded")
    
    # Seed some demo bans
    bans_count = await db.bans.count_documents({})
    if bans_count == 0:
        demo_bans = [
            {"id": str(uuid.uuid4()), "player_nickname": "CheatMaster", "steamid": "STEAM_0:0:99999999", "ip": "192.168.1.100", "reason": "Aimbot detected", "admin_name": "Stylish", "duration": "Permanent", "ban_date": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "player_nickname": "WallHacker", "steamid": "STEAM_0:1:88888888", "ip": "10.0.0.50", "reason": "Wallhack usage", "admin_name": "Stylish", "duration": "30 days", "ban_date": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "player_nickname": "ToxicPlayer", "steamid": "STEAM_0:0:77777777", "ip": "172.16.0.25", "reason": "Toxic behavior and harassment", "admin_name": "Stylish", "duration": "7 days", "ban_date": datetime.now(timezone.utc).isoformat()},
        ]
        await db.bans.insert_many(demo_bans)
        logging.info("Demo bans seeded")

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "shadowzm: Zombie reverse API", "version": "1.0.0"}

# Include router
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

@app.on_event("startup")
async def startup():
    await init_default_admin()
    # Demo data seeding removed - only real data from your server

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
