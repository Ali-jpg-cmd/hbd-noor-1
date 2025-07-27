import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart, User } from "lucide-react";

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    userRole: "husband" | "wife";
    userName: string;
    partnerName: string;
  }) => void;
  currentData: {
    userRole: "husband" | "wife";
    userName: string;
    partnerName: string;
  };
}

const PersonalizationModal = ({ isOpen, onClose, onSave, currentData }: PersonalizationModalProps) => {
  const [userRole, setUserRole] = useState<"husband" | "wife">(currentData.userRole);
  const [userName, setUserName] = useState(currentData.userName);
  const [partnerName, setPartnerName] = useState(currentData.partnerName);

  const handleSave = () => {
    onSave({
      userRole,
      userName,
      partnerName,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-card to-card/90 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-script text-gradient">
            <Heart className="inline w-6 h-6 mr-2 text-primary" />
            Personalize Your Love Story
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4">
          <div className="space-y-3">
            <Label className="text-lg font-medium">You are the...</Label>
            <RadioGroup value={userRole} onValueChange={(value) => setUserRole(value as "husband" | "wife")}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors">
                <RadioGroupItem value="husband" id="husband" />
                <Label htmlFor="husband" className="flex-1 cursor-pointer">Loving Husband 💙</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors">
                <RadioGroupItem value="wife" id="wife" />
                <Label htmlFor="wife" className="flex-1 cursor-pointer">Beautiful Wife ❤️</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="userName" className="text-lg font-medium">Your Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="partnerName" className="text-lg font-medium">
              Your {userRole === "husband" ? "Wife's" : "Husband's"} Name
            </Label>
            <div className="relative">
              <Heart className="absolute left-3 top-3 w-4 h-4 text-primary" />
              <Input
                id="partnerName"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder={`Enter your ${userRole === "husband" ? "wife's" : "husband's"} name`}
                className="pl-10 bg-background/50 border-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="romantic"
              onClick={handleSave}
              className="flex-1"
              disabled={!userName.trim() || !partnerName.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalizationModal;