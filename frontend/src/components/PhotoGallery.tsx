import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, Trash2, Camera, Heart, Users, MessageCircle, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface Photo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_data: string; // base64 encoded
  thumbnail_data?: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  likes: string[];
  comments: Array<{
    id: string;
    user_id: string;
    comment: string;
    created_at: string;
  }>;
  is_featured: boolean;
}

interface PhotoGalleryProps {
  user: User | null;
}

const PhotoGallery = ({ user }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newCaption, setNewCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const { toast } = useToast();

  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "https://03269e3d-a03d-4889-a721-b4462c0d6feb.preview.emergentagent.com";

  useEffect(() => {
    fetchPhotos();
    
    // Set up WebSocket connection for real-time updates
    if (user) {
      const ws = new WebSocket(`${backendUrl.replace('https://', 'wss://')}/ws/${user.id}`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'new_photo') {
          fetchPhotos(); // Refresh photos when new one is added
          toast({
            title: "New Photo Added! 📸",
            description: "Someone just shared a beautiful memory!",
          });
        }
      };

      return () => {
        ws.close();
      };
    }
  }, [user]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/photos?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch photos');
      
      const photosData = await response.json();
      setPhotos(photosData);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: "Error",
        description: "Failed to load photos",
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
        // Remove the data URL prefix to get just the base64 string
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to upload photos.",
        variant: "destructive",
      });
      return;
    }

    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      
      try {
        // Convert file to base64
        const base64Data = await convertFileToBase64(file);
        
        const photoData = {
          title: newCaption.trim() || "Beautiful memory ❤️",
          description: newCaption.trim() || null,
          image_data: base64Data,
          mime_type: file.type,
          file_size: file.size
        };

        const formData = new FormData();
        formData.append('user_id', user.id);
        formData.append('photo_data', JSON.stringify(photoData));

        const response = await fetch(`${backendUrl}/api/photos`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload photo');
        }

        setNewCaption("");
        await fetchPhotos(); // Refresh the photo list
        
        toast({
          title: "Photo Added! 📸",
          description: "Your beautiful memory has been shared with everyone!",
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload photo",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
    
    // Reset file input
    event.target.value = '';
  };

  const likePhoto = async (photo: Photo) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to like photos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/photos/${photo.id}/like?user_id=${user.id}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to like photo');
      
      const result = await response.json();
      
      // Update the photo in local state
      setPhotos(prev => prev.map(p => 
        p.id === photo.id 
          ? { ...p, likes: result.status === 'liked' 
              ? [...p.likes, user.id] 
              : p.likes.filter(id => id !== user.id) 
            }
          : p
      ));

      toast({
        title: result.status === 'liked' ? "Photo Liked! ❤️" : "Like Removed",
        description: result.status === 'liked' ? "You loved this memory!" : "Like removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like photo",
        variant: "destructive",
      });
    }
  };

  const addComment = async (photoId: string) => {
    if (!user || !newComment.trim()) return;

    setIsCommenting(true);
    try {
      const response = await fetch(`${backendUrl}/api/photos/${photoId}/comment?user_id=${user.id}&comment=${encodeURIComponent(newComment)}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to add comment');
      
      const result = await response.json();
      setNewComment("");
      await fetchPhotos(); // Refresh to get updated comments
      
      toast({
        title: "Comment Added! 💬",
        description: "Your comment has been shared!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const downloadPhoto = (photo: Photo) => {
    try {
      // Create download link from base64 data
      const link = document.createElement('a');
      link.href = `data:${photo.mime_type};base64,${photo.image_data}`;
      link.download = `noor-birthday-memory-${photo.id}.${photo.mime_type.split('/')[1]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Photo Downloaded",
        description: "Beautiful memory saved to your device!",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download photo",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <Card className="mb-8 bg-gradient-to-r from-card to-card/90 border-primary/20">
          <CardContent className="text-center py-12">
            <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">Sign in to view memories</h3>
            <p className="text-muted-foreground">Join us to share and see beautiful moments from Noor's birthday! 📸</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Card className="mb-8 bg-gradient-to-r from-card to-card/90 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-script text-gradient flex items-center justify-center gap-2">
            <Camera className="w-8 h-8 text-primary" />
            Our Beautiful Memories
          </CardTitle>
          <p className="text-muted-foreground text-lg flex items-center justify-center gap-1">
            <Users className="w-4 h-4" />
            Every picture tells our love story 💕
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Add a caption for your photo... ❤️"
                className="bg-background/50 border-primary/20"
              />
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="photo-upload"
                disabled={isUploading}
              />
              <Button 
                variant="romantic" 
                className="flex items-center gap-2"
                disabled={isUploading}
                asChild={!isUploading}
              >
                <label htmlFor="photo-upload">
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Add Photo"}
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">No memories yet</h3>
          <p className="text-muted-foreground">Start creating beautiful memories together! 📸</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden hover-scale bg-card/90 backdrop-blur-sm border-primary/10">
              <div className="aspect-square overflow-hidden cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                <img
                  src={`data:${photo.mime_type};base64,${photo.image_data}`}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {photo.title}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-primary" />
                    {photo.likes.length} likes
                  </span>
                  <span>{new Date(photo.uploaded_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <Button
                    size="sm"
                    variant={photo.likes.includes(user.id) ? "default" : "outline"}
                    onClick={() => likePhoto(photo)}
                    className="flex-1"
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {photo.likes.includes(user.id) ? "Liked" : "Like"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadPhoto(photo)}
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
                
                {/* Comments Section */}
                {photo.comments.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-2">
                    <MessageCircle className="w-3 h-3 inline mr-1" />
                    {photo.comments.length} comment{photo.comments.length > 1 ? 's' : ''}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 text-xs"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addComment(photo.id);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addComment(photo.id)}
                    disabled={isCommenting || !newComment.trim()}
                  >
                    💬
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-full bg-card rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <img
              src={`data:${selectedPhoto.mime_type};base64,${selectedPhoto.image_data}`}
              alt={selectedPhoto.title}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{selectedPhoto.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedPhoto.likes.length} likes • {selectedPhoto.comments.length} comments
                </span>
                <Button size="sm" onClick={() => setSelectedPhoto(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;