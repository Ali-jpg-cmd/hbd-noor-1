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

# =============================================================================
# BIRTHDAY WISHES
# =============================================================================

@api_router.post("/wishes", response_model=BirthdayWish)
async def create_birthday_wish(user_id: str, wish_data: BirthdayWishCreate):
    """Create a new birthday wish"""
    # Get user info
    user = await db.users.find_one({"id": user_id})
    user_name = user["display_name"] if user else "Anonymous"
    
    wish = BirthdayWish(
        user_id=user_id,
        user_name=user_name,
        **wish_data.dict()
    )
    await db.birthday_wishes.insert_one(wish.dict())
    
    # Broadcast new wish notification
    await manager.broadcast({
        "type": "new_wish",
        "wish_id": wish.id,
        "user_name": user_name,
        "message": wish.message[:50] + "..." if len(wish.message) > 50 else wish.message
    })
    
    return wish

@api_router.get("/wishes", response_model=List[BirthdayWish])
async def get_birthday_wishes(skip: int = 0, limit: int = 50):
    """Get birthday wishes"""
    wishes = await db.birthday_wishes.find({"is_approved": True}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [BirthdayWish(**wish) for wish in wishes]

@api_router.post("/wishes/{wish_id}/like")
async def like_wish(wish_id: str, user_id: str):
    """Like or unlike a birthday wish"""
    wish = await db.birthday_wishes.find_one({"id": wish_id})
    if not wish:
        raise HTTPException(status_code=404, detail="Wish not found")
    
    likes = wish.get("likes", [])
    if user_id in likes:
        likes.remove(user_id)
        action = "unliked"
    else:
        likes.append(user_id)
        action = "liked"
    
    await db.birthday_wishes.update_one(
        {"id": wish_id},
        {"$set": {"likes": likes}}
    )
    
    return {"status": action, "total_likes": len(likes)}

# =============================================================================
# GAMES SYSTEM
# =============================================================================

@api_router.post("/games/create", response_model=GameSession)
async def create_game_session(game_type: str, player_id: str):
    """Create a new game session"""
    game_session = GameSession(
        game_type=game_type,
        players=[player_id],
        game_state=get_initial_game_state(game_type),
        status="waiting"
    )
    await db.game_sessions.insert_one(game_session.dict())
    
    # Broadcast game creation
    await manager.broadcast({
        "type": "game_created",
        "game_id": game_session.id,
        "game_type": game_type,
        "host_id": player_id
    })
    
    return game_session

@api_router.post("/games/{game_id}/join")
async def join_game(game_id: str, player_id: str):
    """Join an existing game session"""
    game = await db.game_sessions.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if player_id in game["players"]:
        return {"status": "already_joined"}
    
    # Add player and start game if we have enough players
    players = game["players"] + [player_id]
    status = "active" if len(players) >= get_min_players(game["game_type"]) else "waiting"
    
    await db.game_sessions.update_one(
        {"id": game_id},
        {
            "$set": {
                "players": players,
                "status": status,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Broadcast game join
    await manager.broadcast({
        "type": "player_joined",
        "game_id": game_id,
        "player_id": player_id,
        "status": status
    })
    
    return {"status": "joined", "game_status": status}

@api_router.post("/games/{game_id}/move")
async def make_game_move(game_id: str, move: GameMove):
    """Make a move in a game"""
    game = await db.game_sessions.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if move.player_id not in game["players"]:
        raise HTTPException(status_code=403, detail="Player not in game")
    
    # Process move based on game type
    new_game_state, game_status, winner = process_game_move(
        game["game_type"], 
        game["game_state"], 
        move.move_data, 
        move.player_id
    )
    
    # Update game state
    update_data = {
        "game_state": new_game_state,
        "status": game_status,
        "updated_at": datetime.utcnow()
    }
    
    if winner:
        update_data["winner"] = winner
    
    await db.game_sessions.update_one(
        {"id": game_id},
        {"$set": update_data}
    )
    
    # Broadcast move to all players
    await manager.broadcast({
        "type": "game_move",
        "game_id": game_id,
        "player_id": move.player_id,
        "move_data": move.move_data,
        "game_state": new_game_state,
        "status": game_status,
        "winner": winner
    })
    
    return {
        "status": "success",
        "game_state": new_game_state,
        "game_status": game_status,
        "winner": winner
    }

@api_router.get("/games/{game_id}", response_model=GameSession)
async def get_game_session(game_id: str):
    """Get game session details"""
    game = await db.game_sessions.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return GameSession(**game)

@api_router.get("/games", response_model=List[GameSession])
async def get_active_games(status: str = "active"):
    """Get active game sessions"""
    games = await db.game_sessions.find({"status": status}).sort("created_at", -1).to_list(20)
    return [GameSession(**game) for game in games]

# =============================================================================
# WATCH TOGETHER
# =============================================================================

@api_router.post("/watch/create", response_model=WatchSession)
async def create_watch_session(host_id: str, session_data: WatchSessionCreate):
    """Create a new watch together session"""
    watch_session = WatchSession(
        host_id=host_id,
        participants=[host_id],
        **session_data.dict()
    )
    await db.watch_sessions.insert_one(watch_session.dict())
    
    # Broadcast session creation
    await manager.broadcast({
        "type": "watch_session_created",
        "session_id": watch_session.id,
        "title": watch_session.title,
        "host_id": host_id
    })
    
    return watch_session

@api_router.post("/watch/{session_id}/join")
async def join_watch_session(session_id: str, user_id: str):
    """Join a watch together session"""
    session = await db.watch_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Watch session not found")
    
    if user_id not in session["participants"]:
        participants = session["participants"] + [user_id]
        await db.watch_sessions.update_one(
            {"id": session_id},
            {"$set": {"participants": participants}}
        )
        
        # Broadcast join
        await manager.broadcast({
            "type": "user_joined_watch",
            "session_id": session_id,
            "user_id": user_id
        })
    
    return {"status": "joined"}

@api_router.post("/watch/{session_id}/control")
async def control_watch_session(session_id: str, user_id: str, control: WatchControl):
    """Control video playback (play/pause/seek)"""
    session = await db.watch_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Watch session not found")
    
    if user_id not in session["participants"]:
        raise HTTPException(status_code=403, detail="User not in session")
    
    # Update session state
    update_data = {}
    if control.action == "play":
        update_data["is_playing"] = True
    elif control.action == "pause":
        update_data["is_playing"] = False
    elif control.action == "seek" and control.timestamp is not None:
        update_data["current_time"] = control.timestamp
    
    if update_data:
        await db.watch_sessions.update_one(
            {"id": session_id},
            {"$set": update_data}
        )
        
        # Broadcast control action
        await manager.broadcast({
            "type": "watch_control",
            "session_id": session_id,
            "user_id": user_id,
            "action": control.action,
            "timestamp": control.timestamp,
            "is_playing": update_data.get("is_playing", session["is_playing"])
        })
    
    return {"status": "success"}

@api_router.post("/watch/{session_id}/chat")
async def send_watch_chat(session_id: str, user_id: str, message: str):
    """Send a chat message during watch session"""
    chat_message = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await db.watch_sessions.update_one(
        {"id": session_id},
        {"$push": {"chat_messages": chat_message}}
    )
    
    # Broadcast chat message
    await manager.broadcast({
        "type": "watch_chat",
        "session_id": session_id,
        "message": chat_message
    })
    
    return {"status": "success"}

@api_router.get("/watch/{session_id}", response_model=WatchSession)
async def get_watch_session(session_id: str):
    """Get watch session details"""
    session = await db.watch_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Watch session not found")
    return WatchSession(**session)

# =============================================================================
# VIDEO CALLING
# =============================================================================

@api_router.post("/videocall/initiate")
async def initiate_video_call(caller_id: str, callee_id: str):
    """Initiate a video call"""
    call_session = VideoCallSession(
        caller_id=caller_id,
        callee_id=callee_id,
        status="calling"
    )
    await db.video_calls.insert_one(call_session.dict())
    
    # Send call notification to callee
    await manager.send_personal_message({
        "type": "incoming_call",
        "call_id": call_session.id,
        "caller_id": caller_id
    }, callee_id)
    
    return {"call_id": call_session.id, "status": "calling"}

@api_router.post("/videocall/{call_id}/answer")
async def answer_video_call(call_id: str, user_id: str, accept: bool):
    """Answer or reject a video call"""
    call = await db.video_calls.find_one({"id": call_id})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if user_id != call["callee_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    status = "active" if accept else "ended"
    
    await db.video_calls.update_one(
        {"id": call_id},
        {"$set": {"status": status}}
    )
    
    # Notify caller
    await manager.send_personal_message({
        "type": "call_answered",
        "call_id": call_id,
        "accepted": accept
    }, call["caller_id"])
    
    return {"status": status}

@api_router.post("/videocall/{call_id}/end")
async def end_video_call(call_id: str, user_id: str):
    """End a video call"""
    call = await db.video_calls.find_one({"id": call_id})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if user_id not in [call["caller_id"], call["callee_id"]]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    end_time = datetime.utcnow()
    duration = int((end_time - datetime.fromisoformat(call["started_at"].replace('Z', '+00:00'))).total_seconds())
    
    await db.video_calls.update_one(
        {"id": call_id},
        {
            "$set": {
                "status": "ended",
                "ended_at": end_time,
                "duration": duration
            }
        }
    )
    
    # Notify other participant
    other_user = call["callee_id"] if user_id == call["caller_id"] else call["caller_id"]
    await manager.send_personal_message({
        "type": "call_ended",
        "call_id": call_id
    }, other_user)
    
    return {"status": "ended", "duration": duration}

# =============================================================================
# WEBSOCKET ENDPOINT
# =============================================================================

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    
    # Update user online status
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_online": True, "last_active": datetime.utcnow()}}
    )
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "heartbeat":
                await websocket.send_text(json.dumps({"type": "heartbeat_ack"}))
            elif message.get("type") == "typing":
                # Broadcast typing indicator
                await manager.broadcast({
                    "type": "user_typing",
                    "user_id": user_id,
                    "context": message.get("context", "general")
                })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        
        # Update user offline status
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"is_online": False, "last_active": datetime.utcnow()}}
        )

# =============================================================================
# GAME LOGIC HELPER FUNCTIONS
# =============================================================================

def get_initial_game_state(game_type: str) -> Dict[str, Any]:
    """Get initial game state for different game types"""
    if game_type == "tic_tac_hearts":
        return {
            "board": [["" for _ in range(3)] for _ in range(3)],
            "current_player": 0,
            "moves": []
        }
    elif game_type == "love_trivia":
        return {
            "current_question": 0,
            "scores": {},
            "questions": get_trivia_questions(),
            "answers": []
        }
    elif game_type == "memory_match":
        return {
            "cards": generate_memory_cards(),
            "flipped": [],
            "matched": [],
            "current_player": 0,
            "scores": {}
        }
    elif game_type == "word_love":
        return {
            "target_word": get_random_love_word(),
            "guesses": [],
            "current_guess": "",
            "attempts": 0,
            "max_attempts": 6
        }
    elif game_type == "distance_quest":
        return {
            "level": 1,
            "player_positions": {},
            "items_collected": {},
            "challenges": get_quest_challenges()
        }
    elif game_type == "love_puzzles":
        return {
            "puzzle_pieces": generate_puzzle_pieces(),
            "placed_pieces": {},
            "completed": False
        }
    
    return {}

def get_min_players(game_type: str) -> int:
    """Get minimum players required for game type"""
    return 2  # Most games require 2 players

def process_game_move(game_type: str, game_state: Dict[str, Any], move_data: Dict[str, Any], player_id: str):
    """Process a game move and return new state"""
    if game_type == "tic_tac_hearts":
        return process_tic_tac_move(game_state, move_data, player_id)
    elif game_type == "love_trivia":
        return process_trivia_move(game_state, move_data, player_id)
    elif game_type == "memory_match":
        return process_memory_move(game_state, move_data, player_id)
    # Add more game types...
    
    return game_state, "active", None

def process_tic_tac_move(game_state: Dict[str, Any], move_data: Dict[str, Any], player_id: str):
    """Process tic-tac-toe move"""
    row, col = move_data["row"], move_data["col"]
    board = game_state["board"]
    
    if board[row][col] != "":
        return game_state, "active", None  # Invalid move
    
    # Place move
    symbol = "❤️" if game_state["current_player"] == 0 else "💙"
    board[row][col] = symbol
    
    # Check for win
    winner = check_tic_tac_winner(board)
    if winner:
        return {**game_state, "board": board}, "completed", player_id
    
    # Check for draw
    if all(cell != "" for row in board for cell in row):
        return {**game_state, "board": board}, "completed", "draw"
    
    # Switch player
    return {
        **game_state,
        "board": board,
        "current_player": 1 - game_state["current_player"]
    }, "active", None

def check_tic_tac_winner(board):
    """Check if there's a winner in tic-tac-toe"""
    # Check rows, columns, and diagonals
    for i in range(3):
        if board[i][0] == board[i][1] == board[i][2] != "":
            return board[i][0]
        if board[0][i] == board[1][i] == board[2][i] != "":
            return board[0][i]
    
    if board[0][0] == board[1][1] == board[2][2] != "":
        return board[0][0]
    if board[0][2] == board[1][1] == board[2][0] != "":
        return board[0][2]
    
    return None

def get_trivia_questions():
    """Get love trivia questions"""
    return [
        {
            "question": "What's your favorite memory together?",
            "type": "open",
            "points": 10
        },
        {
            "question": "When did we first meet?",
            "type": "date",
            "points": 15
        },
        {
            "question": "What's my favorite color?",
            "type": "multiple_choice",
            "options": ["Red", "Blue", "Green", "Purple"],
            "points": 5
        }
    ]

def generate_memory_cards():
    """Generate memory match cards"""
    symbols = ["❤️", "💙", "💚", "💛", "💜", "🧡", "🤍", "🖤"]
    cards = symbols + symbols  # Duplicate for matching
    import random
    random.shuffle(cards)
    return cards

def get_random_love_word():
    """Get random word for word love game"""
    words = ["HEART", "SWEET", "HONEY", "ANGEL", "DARLING", "BELOVED"]
    import random
    return random.choice(words)

def generate_puzzle_pieces():
    """Generate puzzle pieces"""
    return [{"id": i, "x": 0, "y": 0, "correct_x": i % 4, "correct_y": i // 4} for i in range(16)]

def get_quest_challenges():
    """Get distance quest challenges"""
    return [
        {"id": 1, "type": "riddle", "content": "I am always with you, even when apart. What am I?"},
        {"id": 2, "type": "task", "content": "Send a virtual hug to your partner"},
        {"id": 3, "type": "memory", "content": "Share your favorite moment together"}
    ]

def process_trivia_move(game_state: Dict[str, Any], move_data: Dict[str, Any], player_id: str):
    """Process trivia game move"""
    # Implementation for trivia game logic
    return game_state, "active", None

def process_memory_move(game_state: Dict[str, Any], move_data: Dict[str, Any], player_id: str):
    """Process memory match game move"""
    # Implementation for memory game logic
    return game_state, "active", None

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
