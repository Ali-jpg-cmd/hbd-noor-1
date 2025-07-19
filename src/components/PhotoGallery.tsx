import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Download, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: string;
  url: string;
  caption: string;
  timestamp: Date;
}

const PhotoGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newCaption, setNewCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto: Photo = {
          id: Date.now().toString(),
          url: e.target?.result as string,
          caption: newCaption || "A beautiful memory",
          timestamp: new Date(),
        };
        setPhotos(prev => [...prev, newPhoto]);
        setNewCaption("");
        
        toast({
          title: "Photo added! 📸",
          description: "Your beautiful memory has been saved ❤️",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
    toast({
      title: "Photo removed",
      description: "Memory deleted from gallery",
    });
  };

  const downloadPhoto = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `memory-${photo.id}.jpg`;
    link.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-script font-bold text-gradient mb-4">
          Our Beautiful Memories 📸
        </h2>
        <p className="text-muted-foreground">
          Save and cherish our special moments together
        </p>
      </div>

      <Card className="p-6 mb-8 bg-card/80 backdrop-blur-sm shadow-romantic">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              Add a caption for your photo:
            </label>
            <Input
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="A beautiful moment together..."
              className="border-primary/20 focus:border-primary/40"
            />
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="romantic"
            className="flex items-center gap-2"
          >
            <Camera size={18} />
            Add Photo
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </Card>

      {photos.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-dashed border-2 border-primary/20">
          <Camera className="w-16 h-16 text-primary/40 mx-auto mb-4" />
          <h3 className="text-xl font-script text-muted-foreground">
            Start building your memory gallery
          </h3>
          <p className="text-muted-foreground mt-2">
            Upload your favorite photos to create a beautiful collection
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div key={photo.id} className="polaroid group">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => downloadPhoto(photo)}
                    className="h-8 w-8 bg-white/90 hover:bg-white"
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removePhoto(photo.id)}
                    className="h-8 w-8"
                  >
                    <X size={14} />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                    {photo.caption}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="font-script text-lg text-foreground">
                  {photo.caption}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {photo.timestamp.toLocaleDateString()}
                </p>
              </div>
              <Heart className="absolute top-2 left-2 text-primary/60 sparkle" size={16} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;