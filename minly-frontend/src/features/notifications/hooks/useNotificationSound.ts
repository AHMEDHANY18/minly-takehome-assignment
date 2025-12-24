import { useCallback, useEffect, useRef, useState } from "react";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const audio = new Audio("/sounds/mixkit-correct-answer-tone-2870.wav");
    audio.preload = "auto";
    audio.volume = 0.7;
    audioRef.current = audio;
    return () => {
      audioRef.current = null;
    };
  }, []);

  const unlock = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      audio.muted = true;
      audio.currentTime = 0;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;

      setUnlocked(true);
      localStorage.setItem("soundEnabled", "1");
      console.log("[SOUND] unlocked");
      return true;
    } catch (e) {
      console.log("[SOUND] unlock failed", e);
      return false;
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !unlocked) {
      console.log("[SOUND] blocked (not unlocked yet)");
      return;
    }

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch (e) {
      console.log("[SOUND] play failed", e);
      setUnlocked(false);
      localStorage.removeItem("soundEnabled");
    }
  }, [unlocked]);

  useEffect(() => {
    if (localStorage.getItem("soundEnabled") === "1") {
      setUnlocked(true);
    }
  }, []);

  return { play, unlock, unlocked };
}
