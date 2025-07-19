import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VideoCall = () => {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const { toast } = useToast();

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    toast({
      title: isVideoOn ? "Camera turned off" : "Camera turned on",
      description: "Video call functionality requires Supabase integration for real-time features",
    });
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    toast({
      title: isAudioOn ? "Microphone muted" : "Microphone unmuted",
      description: "Voice call functionality requires Supabase integration for real-time features",
    });
  };

  const toggleCall = () => {
    setIsInCall(!isInCall);
    toast({
      title: isInCall ? "Call ended" : "Call started",
      description: isInCall 
        ? "Hope you had a wonderful conversation! ❤️" 
        : "Connecting to your beautiful wife... 💕",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-script font-bold text-gradient mb-4">
          Video & Voice Call 📞
        </h2>
        <p className="text-muted-foreground">
          Connect face-to-face across the distance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Your Video */}
        <Card className="video-card p-6 shadow-romantic">
          <div className="aspect-video bg-gradient-romantic rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
            {isVideoOn ? (
              <div className="text-center text-primary-foreground">
                <Camera className="w-16 h-16 mb-2 pulse-red" />
                <p className="text-lg font-medium">Your Video</p>
                <p className="text-sm opacity-80">Camera is active</p>
              </div>
            ) : (
              <div className="text-center text-primary-foreground/60">
                <VideoOff className="w-16 h-16 mb-2" />
                <p className="text-lg">Camera Off</p>
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="font-medium text-card-foreground">You</p>
            <p className="text-sm text-muted-foreground">Ready to connect</p>
          </div>
        </Card>

        {/* Her Video */}
        <Card className="video-card p-6 shadow-blue-glow">
          <div className="aspect-video bg-gradient-video rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
            {isInCall ? (
              <div className="text-center text-accent-foreground">
                <Users className="w-16 h-16 mb-2 pulse-blue" />
                <p className="text-lg font-medium">Your Beautiful Wife</p>
                <p className="text-sm opacity-80">Connected with love</p>
              </div>
            ) : (
              <div className="text-center text-accent-foreground/60">
                <Video className="w-16 h-16 mb-2" />
                <p className="text-lg">Waiting to connect...</p>
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="font-medium text-card-foreground">Your Wife ❤️</p>
            <p className="text-sm text-muted-foreground">
              {isInCall ? "In call" : "Not connected"}
            </p>
          </div>
        </Card>
      </div>

      {/* Call Controls */}
      <Card className="p-6 bg-card/90 backdrop-blur-lg shadow-romantic">
        <div className="flex justify-center items-center space-x-4">
          <Button
            variant={isVideoOn ? "romantic" : "secondary"}
            size="lg"
            onClick={toggleVideo}
            className="w-16 h-16 rounded-full"
          >
            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </Button>

          <Button
            variant={isAudioOn ? "romantic" : "secondary"}
            size="lg"
            onClick={toggleAudio}
            className="w-16 h-16 rounded-full"
          >
            {isAudioOn ? <Mic size={24} /> : <MicOff size={24} />}
          </Button>

          <Button
            variant={isInCall ? "destructive" : "romantic"}
            size="lg"
            onClick={toggleCall}
            className="w-20 h-20 rounded-full text-lg font-bold"
          >
            {isInCall ? <PhoneOff size={28} /> : <Phone size={28} />}
          </Button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Call status: {isInCall ? "Connected ❤️" : "Ready to call"}
          </p>
          {!isInCall && (
            <p className="text-xs text-muted-foreground mt-2">
              Real-time video/voice calling requires Supabase integration
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VideoCall;