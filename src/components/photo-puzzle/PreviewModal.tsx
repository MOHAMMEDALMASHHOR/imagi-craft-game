import { X } from "lucide-react";
import { Button } from "../ui/button";

interface PreviewModalProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PreviewModal = ({ image, isOpen, onClose }: PreviewModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl p-4">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
        >
          <X className="h-6 w-6" />
        </Button>
        <img
          src={image}
          alt="Puzzle preview"
          className="w-full h-auto rounded-lg shadow-2xl"
        />
        <p className="text-center text-muted-foreground mt-4">Original Photo</p>
      </div>
    </div>
  );
};
