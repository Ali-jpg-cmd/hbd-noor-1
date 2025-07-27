import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Play, Pause, Trash2, Video, Heart, Clock, ThumbsUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  video_data: string; // base64 encoded
  thumbnail_data?: string;
  file_size: number;
  mime_type: string;
  duration?: number;
  uploaded_at: string;
  likes: string[];
  comments: Array<{
    id: string;
    user_id: string;
    comment: string;
    created_at: string;
  }>;
  views: number;
}

interface VideoGalleryProps {
  user: any;
}

const VideoGallery = ({ user }: VideoGalleryProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "https://03269e3d-a03d-4889-a721-b4462c0d6feb.preview.emergentagent.com";

  useEffect(() => {
    loadVideos();
    
    // Set up WebSocket connection for real-time updates
    if (user) {
      const ws = new WebSocket(`${backendUrl.replace('https://', 'wss://')}/ws/${user.id}`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'new_video') {
          loadVideos(); // Refresh videos when new one is added
          toast({
            title: "New Video Added! 🎥",
            description: "Someone just shared a special moment!",
          });
        }
      };

      return () => {
        ws.close();
      };
    }
  }, [user]);

  const loadVideos = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/videos?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      
      const videosData = await response.json();
      setVideos(videosData);
    } catch (error: any) {
      console.error('Error loading videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "You need to sign in to upload videos.",
        variant: "destructive",
      });
      return;
    }

    const files = event.target.files;
    if (!files || !files[0]) return;

    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 50MB for videos)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    if (!videoTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your video.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const base64Data = await convertFileToBase64(file);
      
      // Get video duration
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      const duration = await new Promise<number>((resolve) => {
        video.onloadedmetadata = () => {
          resolve(Math.floor(video.duration));
          URL.revokeObjectURL(video.src);
        };
      });

      const videoData = {
        title: videoTitle,
        description: videoDescription || null,
        video_data: base64Data,
        mime_type: file.type,
        file_size: file.size,
        duration: duration
      };

      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('video_data', JSON.stringify(videoData));

      const response = await fetch(`${backendUrl}/api/videos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload video');
      }

      toast({
        title: "Video Uploaded! 🎥",
        description: "Your video has been successfully uploaded.",
      });

      // Reset form
      setVideoTitle("");
      setVideoDescription("");
      (event.target as HTMLInputElement).value = "";
      
      // Reload videos
      loadVideos();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const likeVideo = async (video: Video) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to like videos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/videos/${video.id}/like?user_id=${user.id}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to like video');
      
      const result = await response.json();
      
      // Update the video in local state
      setVideos(prev => prev.map(v => 
        v.id === video.id 
          ? { ...v, likes: result.status === 'liked' 
              ? [...v.likes, user.id] 
              : v.likes.filter(id => id !== user.id) 
            }
          : v
      ));

      toast({
        title: result.status === 'liked' ? "Video Liked! ❤️" : "Like Removed",
        description: result.status === 'liked' ? "You loved this video!" : "Like removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like video",
        variant: "destructive",
      });
    }
  };

  const playVideo = async (video: Video) => {
    // Track view
    try {
      await fetch(`${backendUrl}/api/videos/${video.id}`, {
        method: 'GET',
      });
      
      // Update local state to increment view count
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, views: v.views + 1 } : v
      ));
    } catch (error) {
      console.error('Error tracking view:', error);
    }

    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-script font-bold text-gradient mb-4">
          Our Video Gallery 🎬
        </h2>
        <p className="text-muted-foreground">
          Share your special moments through videos
        </p>
      </div>

      {/* Video Upload Section */}
      <Card className="p-6 mb-8 bg-card/90 backdrop-blur-lg shadow-romantic">
        <h3 className="text-xl font-script font-bold text-gradient mb-4">
          Upload a Video
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="video-title">Video Title *</Label>
            <Input
              id="video-title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter a title for your video..."
              disabled={isUploading}
            />
          </div>
          <div>
            <Label htmlFor="video-description">Description (optional)</Label>
            <Input
              id="video-description"
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Add a description..."
              disabled={isUploading}
            />
          </div>
          <div className="flex gap-4">
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
              disabled={isUploading}
            />
            <Button
              variant="romantic"
              disabled={isUploading || !videoTitle.trim()}
              asChild={!isUploading}
            >
              <label htmlFor="video-upload">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? `Uploading... ${uploadProgress}%` : "Upload Video"}
              </label>
            </Button>
          </div>
          {isUploading && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Video Player */}
      {selectedVideo && (
        <Card className="p-6 mb-8 bg-gradient-video shadow-glow">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-accent-foreground">
                {selectedVideo.title}
              </h3>
              <div className="flex items-center gap-4 text-accent-foreground/80">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span className="text-sm">
                    {formatDuration(selectedVideo.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  <span className="text-sm">{selectedVideo.views} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={16} />
                  <span className="text-sm">{selectedVideo.likes.length} likes</span>
                </div>
              </div>
            </div>
            
            <div className="aspect-video bg-card/20 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={`data:${selectedVideo.mime_type};base64,${selectedVideo.video_data}`}
                className="w-full h-full object-cover"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>

            {selectedVideo.description && (
              <p className="text-accent-foreground/80">
                {selectedVideo.description}
              </p>
            )}

            <div className="flex justify-center gap-4">
              <Button
                variant="secondary"
                onClick={togglePlayPause}
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              
              <Button
                variant={selectedVideo.likes.includes(user?.id) ? "default" : "outline"}
                onClick={() => likeVideo(selectedVideo)}
                className="flex items-center gap-2"
              >
                <ThumbsUp size={16} />
                {selectedVideo.likes.includes(user?.id) ? "Liked" : "Like"} ({selectedVideo.likes.length})
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setSelectedVideo(null)}
                className="flex items-center gap-2"
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-script text-muted-foreground">
              No videos yet
            </h3>
            <p className="text-muted-foreground mt-2">
              Upload your first video to start your collection
            </p>
          </div>
        ) : (
          videos.map((video) => (
            <Card
              key={video.id}
              className="video-card cursor-pointer transition-bounce hover:scale-105 shadow-romantic"
              onClick={() => playVideo(video)}
            >
              <div className="aspect-video bg-gradient-romantic rounded-t-lg flex items-center justify-center relative overflow-hidden">
                {video.thumbnail_data ? (
                  <img
                    src={`data:image/jpeg;base64,${video.thumbnail_data}`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-primary-foreground">
                    <Video className="w-12 h-12 mb-2 pulse-red" />
                    <p className="text-sm">Click to play</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white" />
                </div>
                
                {/* Duration overlay */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h4 className="font-medium text-card-foreground mb-1 line-clamp-2">
                  {video.title}
                </h4>
                {video.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      <span>{video.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={12} />
                      <span>{video.likes.length}</span>
                    </div>
                  </div>
                  <span>
                    {new Date(video.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(video.file_size)}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoGallery;