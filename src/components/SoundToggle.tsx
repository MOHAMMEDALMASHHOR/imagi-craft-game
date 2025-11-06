import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { soundManager } from "@/lib/sounds";

export const SoundToggle = () => {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundManager.setEnabled(newState);
    if (newState) {
      soundManager.click();
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleSound}
      className="fixed bottom-4 left-4 z-50 rounded-full shadow-lg"
      aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
    >
      {soundEnabled ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </Button>
  );
};
