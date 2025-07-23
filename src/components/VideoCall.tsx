import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Camera, CircleDot, Square } from "lucide-react";
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
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
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

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const toggleVideo = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use video calling",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!isVideoOn) {
        // Start video
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: isAudioOn 
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        // Stop video
        if (mediaStream) {
          mediaStream.getVideoTracks().forEach(track => track.stop());
          setMediaStream(null);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      }
      
      setIsVideoOn(!isVideoOn);
      
      // Update session if in call
      if (sessionId) {
        await supabase
          .from('video_sessions')
          .update({
            settings: { video_enabled: !isVideoOn, audio_enabled: isAudioOn }
          })
          .eq('id', sessionId);
      }

      toast({
        title: isVideoOn ? "Camera turned off" : "Camera turned on",
        description: isVideoOn ? "Your video is now disabled" : "Your video is now active",
      });
    } catch (error: any) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
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

      // Stop media streams
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }

      setIsInCall(false);
      setSessionId(null);
      setParticipants([]);
      setIsVideoOn(false);
      setIsAudioOn(false);
      
      toast({
        title: "Call Ended",
        description: "Hope you had a wonderful conversation! ❤️",
      });
    }
  };

  const startRecording = async () => {
    if (!mediaStream) {
      toast({
        title: "No Video Stream",
        description: "Please turn on your camera first",
        variant: "destructive",
      });
      return;
    }

    try {
      recordedChunks.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9' };
      mediaRecorder.current = new MediaRecorder(mediaStream, options);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        await uploadRecording(blob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started! 🎥",
        description: "Your video call is being recorded",
      });
    } catch (error: any) {
      toast({
        title: "Recording Failed",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Processing your video...",
      });
    }
  };

  const uploadRecording = async (blob: Blob) => {
    if (!user) return;

    try {
      const fileName = `${user.id}/call-${Date.now()}.webm`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Save to videos table
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: `Video Call Recording - ${new Date().toLocaleDateString()}`,
          description: 'Recorded during video call',
          video_url: publicUrl,
        });

      if (dbError) throw dbError;

      toast({
        title: "Recording Saved! 💕",
        description: "Your video call recording has been saved to your gallery",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: "Failed to save recording",
        variant: "destructive",
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
          <div className="aspect-video bg-gradient-romantic rounded-lg mb-4 relative overflow-hidden">
            {isVideoOn && mediaStream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideoOn ? (
                  <div className="text-center text-primary-foreground">
                    <Camera className="w-16 h-16 mb-2 pulse-red" />
                    <p className="text-lg font-medium">Starting Camera...</p>
                  </div>
                ) : (
                  <div className="text-center text-primary-foreground/60">
                    <VideoOff className="w-16 h-16 mb-2" />
                    <p className="text-lg">Camera Off</p>
                  </div>
                )}
              </div>
            )}
            {isRecording && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold pulse-red">
                REC
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="font-medium text-card-foreground">You</p>
            <p className="text-sm text-muted-foreground">
              {isVideoOn ? "Camera active" : "Ready to connect"}
            </p>
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
        <div className="flex justify-center items-center space-x-4 mb-4">
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

        {/* Recording Controls */}
        {isVideoOn && (
          <div className="flex justify-center items-center space-x-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2"
            >
              {isRecording ? <Square size={16} /> : <CircleDot size={16} />}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
          </div>
        )}

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