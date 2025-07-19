import BirthdayHero from "@/components/BirthdayHero";
import PhotoGallery from "@/components/PhotoGallery";
import BirthdayWishes from "@/components/BirthdayWishes";
import FloatingHearts from "@/components/FloatingHearts";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <FloatingHearts />
      
      <BirthdayHero />
      
      <div id="gallery" className="py-20">
        <PhotoGallery />
      </div>
      
      <BirthdayWishes />
      
      <footer className="py-8 text-center bg-card/50 backdrop-blur-sm">
        <p className="text-muted-foreground font-script text-lg">
          Made with ❤️ for the most amazing wife in the world
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {new Date().getFullYear()} • A gift of love across the distance
        </p>
      </footer>
    </div>
  );
};

export default Index;
