import { useState, useEffect } from "react";
import BirthdayHero from "@/components/BirthdayHero";
import PhotoGallery from "@/components/PhotoGallery";
import BirthdayWishes from "@/components/BirthdayWishes";
import FloatingHearts from "@/components/FloatingHearts";
import VideoCall from "@/components/VideoCall";
import WatchTogether from "@/components/WatchTogether";
import MultiplayerGames from "@/components/MultiplayerGames";
import PersonalizationModal from "@/components/PersonalizationModal";
import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { LogOut, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [personalization, setPersonalization] = useState({
    userRole: "husband" as "husband" | "wife",
    userName: "Your Loving Husband",
    partnerName: "Noor",
  });
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch user profile
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load personalization from localStorage as fallback
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("birthdayPersonalization");
      if (saved) {
        setPersonalization(JSON.parse(saved));
      }
    }
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setPersonalization({
        userRole: (data.role as "husband" | "wife") || "husband",
        userName: data.display_name || "Your Loving Husband",
        partnerName: data.partner_name || "Noor",
      });
    }
  };

  const handlePersonalizationSave = async (data: typeof personalization) => {
    setPersonalization(data);
    localStorage.setItem("birthdayPersonalization", JSON.stringify(data));
    
    // Update profile in database if user is signed in
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: data.userName,
          role: data.userRole,
          partner_name: data.partnerName,
        });

      if (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Goodbye! 👋",
        description: "You've been signed out successfully.",
      });
    }
  };

  const handleAuthSuccess = () => {
    toast({
      title: "Welcome to the Party! 🎉",
      description: "You're now part of Noor's birthday celebration!",
    });
  };
  return (
    <div className="min-h-screen relative">
      <FloatingHearts />
      
      {/* Auth Button */}
      <div className="fixed top-4 right-4 z-50">
        {user ? (
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="bg-card/80 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        ) : (
          <Button
            onClick={() => setIsAuthOpen(true)}
            variant="romantic"
            size="sm"
            className="bg-primary/90 backdrop-blur-sm"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Join Party
          </Button>
        )}
      </div>
      
      <BirthdayHero 
        userName={personalization.userName}
        partnerName={personalization.partnerName}
        userRole={personalization.userRole}
        onPersonalize={() => setIsPersonalizationOpen(true)}
        user={user}
      />
      
      <div id="gallery" className="py-20">
        <PhotoGallery user={user} />
      </div>
      
      <div id="video" className="py-20 bg-gradient-soft">
        <VideoCall user={user} />
      </div>
      
      <div id="watch" className="py-20">
        <WatchTogether user={user} />
      </div>
      
      <div id="games" className="py-20 bg-gradient-soft">
        <MultiplayerGames user={user} />
      </div>
      
      <BirthdayWishes user={user} />
      
      <footer className="py-8 text-center bg-card/90 backdrop-blur-sm">
        <p className="text-muted-foreground font-script text-lg">
          Made with ❤️ for the most amazing {personalization.partnerName} in the world
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {new Date().getFullYear()} • A gift of love across the distance
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {user ? "🟢 Real-time features active" : "Sign in to unlock real-time features"}
        </p>
      </footer>
      
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      
      <PersonalizationModal
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
        onSave={handlePersonalizationSave}
        currentData={personalization}
      />
    </div>
  );
};

export default Index;
