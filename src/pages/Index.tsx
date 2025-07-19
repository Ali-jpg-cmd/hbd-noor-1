import BirthdayHero from "@/components/BirthdayHero";
import PhotoGallery from "@/components/PhotoGallery";
import BirthdayWishes from "@/components/BirthdayWishes";
import FloatingHearts from "@/components/FloatingHearts";
import VideoCall from "@/components/VideoCall";
import WatchTogether from "@/components/WatchTogether";
import MultiplayerGames from "@/components/MultiplayerGames";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <FloatingHearts />
      
      <BirthdayHero />
      
      <div id="gallery" className="py-20">
        <PhotoGallery />
      </div>
      
      <div id="video" className="py-20 bg-gradient-soft">
        <VideoCall />
      </div>
      
      <div id="watch" className="py-20">
        <WatchTogether />
      </div>
      
      <div id="games" className="py-20 bg-gradient-soft">
        <MultiplayerGames />
      </div>
      
      <BirthdayWishes />
      
      <footer className="py-8 text-center bg-card/90 backdrop-blur-sm">
        <p className="text-muted-foreground font-script text-lg">
          Made with ❤️ for the most amazing wife in the world
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {new Date().getFullYear()} • A gift of love across the distance
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time features available with Supabase integration
        </p>
      </footer>
    </div>
  );
};

export default Index;
