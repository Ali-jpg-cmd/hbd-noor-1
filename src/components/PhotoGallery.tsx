import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, Trash2, Camera, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface Photo {
  id: string;
  url: string;
  caption: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface PhotoGalleryProps {
  user: User | null;
}

const PhotoGallery = ({ user }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newCaption, setNewCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotos();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('photos-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'photos' },
        (payload) => {
          const newPhoto = payload.new as Photo;
          setPhotos(prev => [newPhoto, ...prev]);
          toast({
            title: "New Photo Added! 📸",
            description: "Someone just shared a beautiful memory!",
          });
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'photos' },
        (payload) => {
          setPhotos(prev => prev.filter(photo => photo.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
    } else if (data) {
      // Fetch user names separately
      const photosWithUserNames = await Promise.all(
        data.map(async (photo) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', photo.user_id)
            .single();
          
          return {
            ...photo,
            user_name: profile?.display_name || 'Anonymous'
          };
        })
      );
      setPhotos(photosWithUserNames);
    }
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
      setIsUploading(true);
      
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            user_id: user.id,
            url: publicUrl,
            caption: newCaption.trim() || "Beautiful memory ❤️",
          });

        if (dbError) {
          throw dbError;
        }

        setNewCaption("");
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
  };

  const removePhoto = async (photo: Photo) => {
    if (!user || photo.user_id !== user.id) {
      toast({
        title: "Not Authorized",
        description: "You can only delete your own photos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete from storage
      const fileName = photo.url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('photos')
          .remove([`${user.id}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Photo Removed",
        description: "Photo has been removed from the gallery.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    }
  };

  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `noor-birthday-memory-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
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
              <div className="aspect-square overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {photo.caption}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-primary" />
                    {photo.user_name}
                  </span>
                  <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadPhoto(photo)}
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  {photo.user_id === user.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removePhoto(photo)}
                      className="flex-1 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;