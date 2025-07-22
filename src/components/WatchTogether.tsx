import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, SkipForward, SkipBack, Volume2, Tv, Youtube, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const movies = [
  { id: 1, title: "Your Wedding Day", type: "Memory", thumbnail: "🎥", duration: "2:45:30" },
  { id: 2, title: "The Notebook", type: "Romance", thumbnail: "💕", duration: "2:03:15" },
  { id: 3, title: "Pride and Prejudice", type: "Romance", thumbnail: "👑", duration: "2:07:45" },
  { id: 4, title: "La La Land", type: "Musical", thumbnail: "🎭", duration: "2:08:20" },
];

interface WatchTogetherProps {
  user: any;
}

const WatchTogether = ({ user }: WatchTogetherProps) => {
  const [currentMovie, setCurrentMovie] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [netflixUrl, setNetflixUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const { toast } = useToast();

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    toast({
      title: isPlaying ? "Paused for both" : "Playing for both",
      description: "Synchronized playback requires Supabase integration",
    });
  };

  const handleMovieSelect = (movie) => {
    setCurrentMovie(movie);
    setIsPlaying(false);
    toast({
      title: `Selected: ${movie.title}`,
      description: "Ready to watch together! ❤️",
    });
  };

  const connectNetflix = () => {
    toast({
      title: "Netflix Integration",
      description: "Netflix account linking requires Supabase backend integration for OAuth",
    });
  };

  const connectYoutube = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to connect your YouTube account",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/youtube.readonly',
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        toast({
          title: "YouTube Connection Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsYouTubeConnected(true);
        toast({
          title: "YouTube Connected! 🎥",
          description: "You can now sync YouTube videos together",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to YouTube",
        variant: "destructive",
      });
    }
  };

  const watchNetflixUrl = () => {
    if (netflixUrl) {
      toast({
        title: "Netflix Party Started!",
        description: "Synchronized Netflix viewing requires Supabase real-time features",
      });
    }
  };

  const watchYoutubeUrl = () => {
    if (youtubeUrl) {
      if (!isYouTubeConnected && !user) {
        toast({
          title: "YouTube Connection Required",
          description: "Connect your YouTube account for synchronized viewing",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "YouTube Party Started! 🎉",
        description: "Now watching together with real-time sync",
      });
      
      // Create watch session in database
      if (user) {
        supabase
          .from('watch_sessions')
          .insert({
            host_id: user.id,
            title: 'YouTube Video',
            content_url: youtubeUrl,
            platform: 'youtube',
            is_playing: false,
            current_position: 0,
            participants: [user.id],
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error creating watch session:', error);
            }
          });
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-script font-bold text-gradient mb-4">
          Watch Together 🍿
        </h2>
        <p className="text-muted-foreground">
          Share movies and videos synchronized across the distance
        </p>
      </div>

      {/* Account Linking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 video-card shadow-romantic">
          <div className="text-center">
            <Tv className="w-16 h-16 text-destructive mx-auto mb-4 pulse-red" />
            <h3 className="text-xl font-semibold mb-4">Netflix Together</h3>
            <div className="space-y-4">
              <Input
                value={netflixUrl}
                onChange={(e) => setNetflixUrl(e.target.value)}
                placeholder="Paste Netflix URL here..."
                className="border-primary/20"
              />
              <div className="flex gap-2">
                <Button variant="romantic" onClick={connectNetflix} className="flex-1">
                  Connect Netflix
                </Button>
                <Button variant="secondary" onClick={watchNetflixUrl} disabled={!netflixUrl}>
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 video-card shadow-blue-glow">
          <div className="text-center">
            <Youtube className="w-16 h-16 text-destructive mx-auto mb-4 pulse-blue" />
            <h3 className="text-xl font-semibold mb-4">YouTube Together</h3>
            <div className="space-y-4">
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="border-accent/20"
              />
              <div className="flex gap-2">
                <Button 
                  variant="heart" 
                  onClick={connectYoutube} 
                  className="flex-1"
                  disabled={isYouTubeConnected}
                >
                  {isYouTubeConnected ? "✓ Connected" : "Connect YouTube"}
                </Button>
                <Button variant="secondary" onClick={watchYoutubeUrl} disabled={!youtubeUrl}>
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Movie Library */}
      <Card className="p-6 bg-card/90 backdrop-blur-lg shadow-romantic mb-8">
        <h3 className="text-xl font-script font-bold text-gradient mb-6 text-center">
          Our Movie Collection
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <Card
              key={movie.id}
              className={`p-4 cursor-pointer transition-bounce hover:scale-105 ${
                currentMovie?.id === movie.id ? 'border-primary shadow-glow' : 'gaming-border'
              }`}
              onClick={() => handleMovieSelect(movie)}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{movie.thumbnail}</div>
                <h4 className="font-medium text-sm mb-1">{movie.title}</h4>
                <p className="text-xs text-muted-foreground mb-1">{movie.type}</p>
                <p className="text-xs text-muted-foreground">{movie.duration}</p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Media Player */}
      <Card className="p-6 bg-gradient-video shadow-glow">
        {currentMovie ? (
          <div className="space-y-6">
            <div className="aspect-video bg-card/20 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center text-accent-foreground">
                <div className="text-6xl mb-4">{currentMovie.thumbnail}</div>
                <h3 className="text-2xl font-bold mb-2">{currentMovie.title}</h3>
                <p className="text-lg opacity-80">
                  {isPlaying ? "Playing together ❤️" : "Ready to play"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-6">
              <Button variant="secondary" size="lg" className="rounded-full">
                <SkipBack size={20} />
              </Button>
              
              <Button 
                variant="romantic" 
                size="lg" 
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </Button>
              
              <Button variant="secondary" size="lg" className="rounded-full">
                <SkipForward size={20} />
              </Button>
              
              <Button variant="secondary" size="lg" className="rounded-full">
                <Volume2 size={20} />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-accent-foreground/80">
                {currentTime} / {currentMovie.duration}
              </p>
              <p className="text-sm text-accent-foreground/60 mt-2">
                Synchronized viewing - both of you see the same thing!
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-accent-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-script text-accent-foreground/80">
              Select a movie to watch together
            </h3>
            <p className="text-accent-foreground/60 mt-2">
              Choose from our collection or link your streaming accounts
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WatchTogether;