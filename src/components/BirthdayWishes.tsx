import { Card } from "@/components/ui/card";
import { Heart, Sparkles, Star, Gift } from "lucide-react";

const wishes = [
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

const BirthdayWishes = () => {
  return (
    <div id="wishes" className="py-20 px-6 bg-gradient-soft">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-script font-bold text-gradient mb-6">
            My Birthday Wishes for You 🎂
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Words from my heart to yours on your special day
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {wishes.map((wish, index) => (
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

        <Card className="mt-16 p-8 md:p-12 text-center bg-gradient-romantic shadow-glow border-0">
          <h3 className="text-2xl md:text-3xl font-script font-bold text-primary-foreground mb-4">
            Special Birthday Message 💌
          </h3>
          <p className="text-lg text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto">
            My dearest love, on this special day, I want you to know that you are the most incredible woman I've ever known. 
            Your strength, beauty, and endless love inspire me every single day. Even though we're apart right now, 
            my heart is with you today and always. I can't wait until we can celebrate together again. 
            Until then, know that you are loved beyond measure. Happy Birthday, my beautiful wife! 🎉✨
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