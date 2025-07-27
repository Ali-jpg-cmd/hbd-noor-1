import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Play, Pause, Trash2, Video, Heart, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
  user_id: string;
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

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error('Error loading videos:', error);
    }
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

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video smaller than 100MB.",
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
      // Upload video to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Create video record in database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: videoTitle,
          description: videoDescription || null,
          video_url: publicUrl,
        });

      if (dbError) throw dbError;

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

  const deleteVideo = async (video: Video) => {
    if (!user || video.user_id !== user.id) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own videos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (dbError) throw dbError;

      // Delete from storage
      const fileName = video.video_url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('videos')
          .remove([`${user.id}/${fileName}`]);

        if (storageError) console.error('Storage deletion error:', storageError);
      }

      toast({
        title: "Video Deleted",
        description: "Your video has been removed.",
      });

      loadVideos();
      if (selectedVideo?.id === video.id) {
        setSelectedVideo(null);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const playVideo = (video: Video) => {
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
              <div className="flex items-center gap-2 text-accent-foreground/80">
                <Clock size={16} />
                <span className="text-sm">
                  {formatDuration(selectedVideo.duration)}
                </span>
              </div>
            </div>
            
            <div className="aspect-video bg-card/20 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={selectedVideo.video_url}
                className="w-full h-full object-cover"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                  const video = e.target as HTMLVideoElement;
                  if (video.duration && !selectedVideo.duration) {
                    // Update duration in database
                    supabase
                      .from('videos')
                      .update({ duration: Math.floor(video.duration) })
                      .eq('id', selectedVideo.id);
                  }
                }}
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
              
              {user && selectedVideo.user_id === user.id && (
                <Button
                  variant="destructive"
                  onClick={() => deleteVideo(selectedVideo)}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              )}
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
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
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
                  <span>
                    {new Date(video.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Heart size={12} />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
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