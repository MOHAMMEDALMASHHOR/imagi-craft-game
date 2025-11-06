import { Button } from "./ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export const ShareButton = ({ title, text, url }: ShareButtonProps) => {
  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: url || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${text}\n${shareData.url}`);
        toast.success("Copied to clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error("Failed to share");
      }
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Share2 className="w-4 h-4" />
      Share
    </Button>
  );
};
