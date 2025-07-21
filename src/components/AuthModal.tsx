import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"husband" | "wife">("husband");
  const [partnerName, setPartnerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!email || !password || !displayName || !partnerName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          display_name: displayName,
          role: role,
          partner_name: partnerName,
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          display_name: displayName,
          role: role,
          partner_name: partnerName,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      toast({
        title: "Welcome to Noor's Birthday! 🎉",
        description: "Account created successfully. Please check your email to confirm.",
      });
      onSuccess();
      onClose();
    }
    
    setIsLoading(false);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome Back! ❤️",
        description: "Successfully signed in.",
      });
      onSuccess();
      onClose();
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-card to-card/90 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-script text-gradient">
            <Heart className="inline w-6 h-6 mr-2 text-primary" />
            Join Noor's Birthday Celebration
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="signin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full"
              variant="romantic"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="display-name">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>You are the...</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole("husband")}
                  className={`flex-1 p-3 rounded-lg border transition-colors ${
                    role === "husband" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-primary/20 hover:bg-primary/5"
                  }`}
                >
                  Loving Husband 💙
                </button>
                <button
                  type="button"
                  onClick={() => setRole("wife")}
                  className={`flex-1 p-3 rounded-lg border transition-colors ${
                    role === "wife" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-primary/20 hover:bg-primary/5"
                  }`}
                >
                  Beautiful Wife ❤️
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="partner-name">
                Your {role === "husband" ? "Wife's" : "Husband's"} Name
              </Label>
              <div className="relative">
                <Heart className="absolute left-3 top-3 w-4 h-4 text-primary" />
                <Input
                  id="partner-name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={`Enter your ${role === "husband" ? "wife's" : "husband's"} name`}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full"
              variant="romantic"
            >
              {isLoading ? "Creating Account..." : "Join the Celebration"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;