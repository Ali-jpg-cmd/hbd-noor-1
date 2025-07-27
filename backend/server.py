from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import base64
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Birthday Celebration API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.user_connections:
            await self.user_connections[user_id].send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass

manager = ConnectionManager()

# =============================================================================
# DATA MODELS
# =============================================================================

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    display_name: str
    role: str = "guest"  # "husband", "wife", "guest"
    partner_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    is_online: bool = False

class UserCreate(BaseModel):
    email: str
    display_name: str
    role: str = "guest"
    partner_name: Optional[str] = None

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    partner_name: Optional[str] = None
    avatar_url: Optional[str] = None

# Photo Models
class Photo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    image_data: str  # base64 encoded image
    thumbnail_data: Optional[str] = None
    file_size: int
    mime_type: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    likes: List[str] = []  # user_ids who liked
    comments: List[Dict[str, Any]] = []
    is_featured: bool = False

class PhotoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image_data: str
    mime_type: str
    file_size: int

class PhotoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_featured: Optional[bool] = None

# Video Models
class Video(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    video_data: str  # base64 encoded video
    thumbnail_data: Optional[str] = None
    file_size: int
    mime_type: str
    duration: Optional[int] = None  # in seconds
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    likes: List[str] = []
    comments: List[Dict[str, Any]] = []
    views: int = 0

class VideoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    video_data: str
    mime_type: str
    file_size: int
    duration: Optional[int] = None

# Birthday Wishes Models
class BirthdayWish(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    message: str
    is_anonymous: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    likes: List[str] = []
    is_approved: bool = True

class BirthdayWishCreate(BaseModel):
    message: str
    is_anonymous: bool = False

# Games Models
class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    game_type: str  # "love_trivia", "tic_tac_hearts", "memory_match", etc.
    players: List[str]  # user_ids
    game_state: Dict[str, Any]
    status: str = "waiting"  # "waiting", "active", "completed"
    winner: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class GameMove(BaseModel):
    game_id: str
    player_id: str
    move_data: Dict[str, Any]

# Watch Together Models
class WatchSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    host_id: str
    title: str
    url: str
    platform: str  # "netflix", "youtube", "custom"
    participants: List[str]
    current_time: float = 0.0
    is_playing: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    chat_messages: List[Dict[str, Any]] = []

class WatchSessionCreate(BaseModel):
    title: str
    url: str
    platform: str

class WatchControl(BaseModel):
    action: str  # "play", "pause", "seek"
    timestamp: Optional[float] = None

# Video Call Models
class VideoCallSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    caller_id: str
    callee_id: str
    status: str = "calling"  # "calling", "active", "ended"
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None

# =============================================================================
# API ENDPOINTS
# =============================================================================

@api_router.get("/")
async def root():
    return {"message": "Birthday Celebration API", "version": "1.0.0"}

# =============================================================================
# USER MANAGEMENT
# =============================================================================

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate):
    """Update user information"""
    update_data = {k: v for k, v in user_data.dict().items() if v is not None}
    update_data["last_active"] = datetime.utcnow()
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

@api_router.get("/users", response_model=List[User])
async def get_online_users():
    """Get all online users"""
    users = await db.users.find({"is_online": True}).to_list(100)
    return [User(**user) for user in users]

# =============================================================================
# PHOTO GALLERY
# =============================================================================

@api_router.post("/photos", response_model=Photo)
async def upload_photo(user_id: str = Form(...), photo_data: PhotoCreate = Form(...)):
    """Upload a new photo"""
    photo = Photo(user_id=user_id, **photo_data.dict())
    await db.photos.insert_one(photo.dict())
    
    # Broadcast new photo notification
    await manager.broadcast({
        "type": "new_photo",
        "photo_id": photo.id,
        "user_id": user_id,
        "title": photo.title
    })
    
    return photo

@api_router.get("/photos", response_model=List[Photo])
async def get_photos(skip: int = 0, limit: int = 20, featured_only: bool = False):
    """Get photos with pagination"""
    query = {"is_featured": True} if featured_only else {}
    photos = await db.photos.find(query).sort("uploaded_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Photo(**photo) for photo in photos]

@api_router.get("/photos/{photo_id}", response_model=Photo)
async def get_photo(photo_id: str):
    """Get a specific photo"""
    photo = await db.photos.find_one({"id": photo_id})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return Photo(**photo)

@api_router.put("/photos/{photo_id}", response_model=Photo)
async def update_photo(photo_id: str, photo_data: PhotoUpdate):
    """Update photo information"""
    update_data = {k: v for k, v in photo_data.dict().items() if v is not None}
    
    result = await db.photos.update_one(
        {"id": photo_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    updated_photo = await db.photos.find_one({"id": photo_id})
    return Photo(**updated_photo)

@api_router.post("/photos/{photo_id}/like")
async def like_photo(photo_id: str, user_id: str):
    """Like or unlike a photo"""
    photo = await db.photos.find_one({"id": photo_id})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    likes = photo.get("likes", [])
    if user_id in likes:
        likes.remove(user_id)
        action = "unliked"
    else:
        likes.append(user_id)
        action = "liked"
    
    await db.photos.update_one(
        {"id": photo_id},
        {"$set": {"likes": likes}}
    )
    
    return {"status": action, "total_likes": len(likes)}

@api_router.post("/photos/{photo_id}/comment")
async def add_photo_comment(photo_id: str, user_id: str, comment: str):
    """Add a comment to a photo"""
    comment_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "comment": comment,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.photos.update_one(
        {"id": photo_id},
        {"$push": {"comments": comment_data}}
    )
    
    return {"status": "success", "comment": comment_data}

# =============================================================================
# VIDEO GALLERY
# =============================================================================

@api_router.post("/videos", response_model=Video)
async def upload_video(user_id: str = Form(...), video_data: VideoCreate = Form(...)):
    """Upload a new video"""
    video = Video(user_id=user_id, **video_data.dict())
    await db.videos.insert_one(video.dict())
    
    # Broadcast new video notification
    await manager.broadcast({
        "type": "new_video",
        "video_id": video.id,
        "user_id": user_id,
        "title": video.title
    })
    
    return video

@api_router.get("/videos", response_model=List[Video])
async def get_videos(skip: int = 0, limit: int = 20):
    """Get videos with pagination"""
    videos = await db.videos.find({}).sort("uploaded_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Video(**video) for video in videos]

@api_router.get("/videos/{video_id}", response_model=Video)
async def get_video(video_id: str):
    """Get a specific video"""
    video = await db.videos.find_one({"id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Increment view count
    await db.videos.update_one(
        {"id": video_id},
        {"$inc": {"views": 1}}
    )
    
    return Video(**video)

@api_router.post("/videos/{video_id}/like")
async def like_video(video_id: str, user_id: str):
    """Like or unlike a video"""
    video = await db.videos.find_one({"id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    likes = video.get("likes", [])
    if user_id in likes:
        likes.remove(user_id)
        action = "unliked"
    else:
        likes.append(user_id)
        action = "liked"
    
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {"likes": likes}}
    )
    
    return {"status": action, "total_likes": len(likes)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
