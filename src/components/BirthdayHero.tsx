import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Gift, Star, Video, Gamepad2, Tv, Settings, Play } from "lucide-react";

interface BirthdayHeroProps {
  userName: string;
  partnerName: string;
  userRole: "husband" | "wife";
  onPersonalize: () => void;
  user?: any;
}

const BirthdayHero = ({ userName, partnerName, userRole, onPersonalize }: BirthdayHeroProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <Star className="text-primary sparkle" size={Math.random() * 15 + 10} />
          </div>
        ))}
      </div>

      {/* Personalization Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onPersonalize}
        className="absolute top-6 right-6 z-20 bg-background/20 backdrop-blur-sm border-primary/30 text-foreground hover:bg-background/30"
      >
        <Settings className="w-4 h-4 mr-2" />
        Personalize
      </Button>

      <Card className="max-w-4xl mx-auto p-8 md:p-12 text-center bg-card/90 backdrop-blur-lg shadow-romantic border-0 relative z-10">
        <div className="space-y-6">
          <div className="flex justify-center space-x-4 mb-6">
            <Heart className="text-primary floating-heart" size={40} />
            <Gift className="text-accent floating-heart" size={40} style={{ animationDelay: "1s" }} />
            <Heart className="text-primary floating-heart" size={40} style={{ animationDelay: "2s" }} />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-script font-bold text-gradient leading-tight">
            Happy 20th Birthday
          </h1>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-script text-primary mb-6">
            My Beautiful {partnerName} ❤️
          </h2>

          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Even though we're miles apart, you're always in my heart. 
              Today we celebrate the most amazing woman in the world.
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground">
              This special website is just for you, filled with love, memories, 
              and all the reasons why you make every day brighter. ✨
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 justify-center items-center mt-8">
            <Button 
              variant="romantic" 
              size="lg"
              className="text-base px-4 py-3"
              onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Heart className="mr-2" size={16} />
              Photos
            </Button>
            
            <Button 
              variant="heart" 
              size="lg"
              className="text-base px-4 py-3"
              onClick={() => document.getElementById('videos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="mr-2" size={16} />
              Videos
            </Button>
            
            <Button 
              variant="secondary" 
              size="lg"
              className="text-base px-4 py-3"
              onClick={() => document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Video className="mr-2" size={16} />
              Call
            </Button>

            <Button 
              variant="romantic" 
              size="lg"
              className="text-base px-4 py-3"
              onClick={() => document.getElementById('watch')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Tv className="mr-2" size={16} />
              Watch
            </Button>
            
            <Button 
              variant="heart" 
              size="lg"
              className="text-base px-4 py-3"
              onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Gamepad2 className="mr-2" size={16} />
              Games
            </Button>
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            <p>With all my love, from your devoted {userRole} 💕</p>
            <p className="text-base font-medium text-primary mt-1">- {userName}</p>
            <p className="mt-2 italic">Distance means nothing when you mean everything</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BirthdayHero;