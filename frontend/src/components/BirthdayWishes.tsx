import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Sparkles, Star, Gift, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  sender_name: string;
  message: string;
  created_at: string;
  is_approved: boolean;
}

interface BirthdayWishesProps {
  user: User | null;
}

const BirthdayWishes = ({ user }: BirthdayWishesProps) => {
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);
  const [newWishName, setNewWishName] = useState("");
  const [newWishMessage, setNewWishMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWishes();
    
    // Subscribe to realtime updates for approved wishes
    const channel = supabase
      .channel('birthday-wishes-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'birthday_wishes' },
        (payload) => {
          const newWish = payload.new as BirthdayWish;
          if (newWish.is_approved) {
            setWishes(prev => [newWish, ...prev]);
            toast({
              title: "New Birthday Wish! 🎉",
              description: `${newWish.sender_name} sent a beautiful message!`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWishes = async () => {
    const { data, error } = await supabase
      .from('birthday_wishes')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishes:', error);
    } else if (data) {
      setWishes(data);
    }
  };

  const submitWish = async () => {
    if (!newWishName.trim() || !newWishMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both your name and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('birthday_wishes')
        .insert({
          user_id: user?.id || 'anonymous',
          sender_name: newWishName.trim(),
          message: newWishMessage.trim(),
          is_approved: true, // Auto-approve for now
        });

      if (error) {
        throw error;
      }

      setNewWishName("");
      setNewWishMessage("");
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
            <div>
              <Input
                value={newWishName}
                onChange={(e) => setNewWishName(e.target.value)}
                placeholder="Your name..."
                className="bg-background/50 border-primary/20"
              />
            </div>
            <div>
              <Textarea
                value={newWishMessage}
                onChange={(e) => setNewWishMessage(e.target.value)}
                placeholder="Write your birthday message for Noor..."
                rows={3}
                className="bg-background/50 border-primary/20"
              />
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
                    <span className="font-semibold text-primary">{wish.sender_name}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {wish.message}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {new Date(wish.created_at).toLocaleDateString()}
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