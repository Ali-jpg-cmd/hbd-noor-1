import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Sparkles, Star, Gift, Send, MessageCircle, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

const defaultWishes = [
  {
    icon: Heart,
    title: "Endless Love",
    message: "Every beat of my heart belongs to you. You are my everything, my reason to smile, and my greatest blessing.",
  },
  {
    icon: Star,
    title: "My Shining Star",
    message: "You light up my darkest days and make every moment magical. Your smile is my favorite sight in the whole world.",
  },
  {
    icon: Gift,
    title: "Perfect Gift",
    message: "Having you as my wife is the greatest gift life has ever given me. You make every day feel like a celebration.",
  },
  {
    icon: Sparkles,
    title: "Beautiful Soul",
    message: "Your kindness, grace, and beautiful spirit inspire me every single day. You make the world a better place just by being in it.",
  },
];

interface BirthdayWish {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  is_anonymous: boolean;
  created_at: string;
  likes: string[];
  is_approved: boolean;
}

interface BirthdayWishesProps {
  user: User | null;
}

const BirthdayWishes = ({ user }: BirthdayWishesProps) => {
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);
  const [newWishName, setNewWishName] = useState("");
  const [newWishMessage, setNewWishMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchWishes();
    
    // Set up WebSocket connection for real-time updates
    if (user) {
      const ws = new WebSocket(`${backendUrl.replace('https://', 'wss://')}/ws/${user.id}`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'new_wish') {
          fetchWishes(); // Refresh wishes when new one is added
          toast({
            title: "New Birthday Wish! 🎉",
            description: `${message.user_name} sent a beautiful message!`,
          });
        }
      };

      return () => {
        ws.close();
      };
    }
  }, [user]);

  const fetchWishes = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/wishes?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch wishes');
      
      const wishesData = await response.json();
      setWishes(wishesData);
    } catch (error) {
      console.error('Error fetching wishes:', error);
      toast({
        title: "Error",
        description: "Failed to load birthday wishes",
        variant: "destructive",
      });
    }
  };

  const submitWish = async () => {
    if (!newWishMessage.trim()) {
      toast({
        title: "Missing Message",
        description: "Please write a birthday message.",
        variant: "destructive",
      });
      return;
    }

    if (!isAnonymous && !newWishName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter your name or choose to send anonymously.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userId = user?.id || 'anonymous';
      const wishData = {
        message: newWishMessage.trim(),
        is_anonymous: isAnonymous
      };

      const response = await fetch(`${backendUrl}/api/wishes?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wishData),
      });

      if (!response.ok) {
        throw new Error('Failed to send wish');
      }

      setNewWishName("");
      setNewWishMessage("");
      setIsAnonymous(false);
      await fetchWishes(); // Refresh the wishes list
      
      toast({
        title: "Wish Sent! 💌",
        description: "Your beautiful birthday message has been shared!",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send birthday wish",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const likeWish = async (wish: BirthdayWish) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to like wishes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/wishes/${wish.id}/like?user_id=${user.id}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to like wish');
      
      const result = await response.json();
      
      // Update the wish in local state
      setWishes(prev => prev.map(w => 
        w.id === wish.id 
          ? { ...w, likes: result.status === 'liked' 
              ? [...w.likes, user.id] 
              : w.likes.filter(id => id !== user.id) 
            }
          : w
      ));

      toast({
        title: result.status === 'liked' ? "Wish Liked! ❤️" : "Like Removed",
        description: result.status === 'liked' ? "You loved this wish!" : "Like removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like wish",
        variant: "destructive",
      });
    }
  };

  return (
    <div id="wishes" className="py-20 px-6 bg-gradient-soft">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-script font-bold text-gradient mb-6">
            Birthday Wishes for Noor 🎂
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share your love and birthday wishes for the amazing Noor!
          </p>
        </div>

        {/* Send a wish form */}
        <Card className="p-6 mb-12 bg-card/90 backdrop-blur-sm shadow-romantic border-primary/20">
          <h3 className="text-xl font-script font-bold text-primary mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Send a Birthday Wish
          </h3>
          <div className="space-y-4">
            {!isAnonymous && (
              <div>
                <Input
                  value={newWishName}
                  onChange={(e) => setNewWishName(e.target.value)}
                  placeholder="Your name..."
                  className="bg-background/50 border-primary/20"
                />
              </div>
            )}
            <div>
              <Textarea
                value={newWishMessage}
                onChange={(e) => setNewWishMessage(e.target.value)}
                placeholder="Write your birthday message for Noor..."
                rows={3}
                className="bg-background/50 border-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-primary/20"
              />
              <label htmlFor="anonymous" className="text-sm text-muted-foreground">
                Send anonymously
              </label>
            </div>
            <Button
              onClick={submitWish}
              disabled={isSubmitting}
              variant="romantic"
              className="w-full sm:w-auto"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Sending..." : "Send Birthday Wish"}
            </Button>
          </div>
        </Card>

        {/* Default romantic messages */}
        <div className="mb-12">
          <h3 className="text-2xl font-script font-bold text-center text-primary mb-8">
            Special Messages from the Heart 💕
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {defaultWishes.map((wish, index) => (
              <Card 
                key={index} 
                className="p-8 bg-card/80 backdrop-blur-sm shadow-romantic hover:shadow-glow transition-romantic hover:scale-105 border-primary/10"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-romantic rounded-full flex items-center justify-center shadow-soft">
                      <wish.icon className="text-primary-foreground" size={24} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-script font-semibold text-primary mb-3">
                      {wish.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {wish.message}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Heart className="text-primary/40 sparkle" size={16} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* User submitted wishes */}
        {wishes.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-script font-bold text-center text-primary mb-8">
              Birthday Wishes from Everyone 🌟
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishes.map((wish) => (
                <Card 
                  key={wish.id}
                  className="p-6 bg-card/80 backdrop-blur-sm shadow-romantic border-primary/10"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">
                      {wish.is_anonymous ? "Anonymous" : wish.user_name}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {wish.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {new Date(wish.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={wish.likes.includes(user?.id || '') ? "default" : "ghost"}
                        onClick={() => likeWish(wish)}
                        className="text-xs"
                        disabled={!user}
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {wish.likes.length > 0 && wish.likes.length}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="mt-16 p-8 md:p-12 text-center bg-gradient-romantic shadow-glow border-0">
          <h3 className="text-2xl md:text-3xl font-script font-bold text-primary-foreground mb-4">
            Special Birthday Message 💌
          </h3>
          <p className="text-lg text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto">
            My dearest Noor, on this special day - your 20th birthday - I want you to know that you are the most incredible woman I've ever known. 
            Your strength, beauty, and endless love inspire me every single day. Even though we're apart right now, 
            my heart is with you today and always. I can't wait until we can celebrate together again. 
            Until then, know that you are loved beyond measure. Happy 20th Birthday, my beautiful love! 🎉✨
          </p>
          <div className="mt-6 text-primary-foreground/80 font-script text-lg">
            Forever yours, with infinite love 💕
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BirthdayWishes;