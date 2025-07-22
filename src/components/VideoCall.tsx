import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoCallProps {
  user: any;
}

const VideoCall = ({ user }: VideoCallProps) => {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Subscribe to video session updates
    const channel = supabase
      .channel('video-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_sessions',
        },
        (payload: any) => {
          console.log('Video session update:', payload);
          if (payload.new && Array.isArray(payload.new.participants)) {
            setParticipants(payload.new.participants);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleVideo = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use video calling",
        variant: "destructive",
      });
      return;
    }

    setIsVideoOn(!isVideoOn);
    
    // Update session if in call
    if (sessionId) {
      await supabase
        .from('video_sessions')
        .update({
          settings: { video_enabled: !isVideoOn }
        })
        .eq('id', sessionId);
    }

    toast({
      title: isVideoOn ? "Camera turned off" : "Camera turned on",
      description: isVideoOn ? "Your video is now disabled" : "Your video is now active",
    });
  };

  const toggleAudio = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use audio calling",
        variant: "destructive",
      });
      return;
    }

    setIsAudioOn(!isAudioOn);
    
    // Update session if in call
    if (sessionId) {
      await supabase
        .from('video_sessions')
        .update({
          settings: { audio_enabled: !isAudioOn }
        })
        .eq('id', sessionId);
    }

    toast({
      title: isAudioOn ? "Microphone muted" : "Microphone unmuted",
      description: isAudioOn ? "Your microphone is now muted" : "Your microphone is now active",
    });
  };

  const toggleCall = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to start a video call",
        variant: "destructive",
      });
      return;
    }

    if (!isInCall) {
      // Start a new video session
      const { data, error } = await supabase
        .from('video_sessions')
        .insert({
          host_id: user.id,
          is_active: true,
          participants: [user.id],
          settings: {
            video_enabled: isVideoOn,
            audio_enabled: isAudioOn,
          }
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Call Failed",
          description: "Failed to start video call",
          variant: "destructive",
        });
        return;
      }

      setSessionId(data.id);
      setIsInCall(true);
      setParticipants([user.id]);
      
      toast({
        title: "Call Started! 💕",
        description: "Your video call session is now active",
      });
    } else {
      // End the call
      if (sessionId) {
        await supabase
          .from('video_sessions')
          .update({ is_active: false })
          .eq('id', sessionId);
      }

      setIsInCall(false);
      setSessionId(null);
      setParticipants([]);
      
      toast({
        title: "Call Ended",
        description: "Hope you had a wonderful conversation! ❤️",
      });
    }
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
            Call status: {isInCall ? `Connected ❤️ (${participants.length} participant${participants.length === 1 ? '' : 's'})` : "Ready to call"}
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground mt-2">
              Session ID: {sessionId.slice(0, 8)}... • Real-time sync enabled
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VideoCall;