import { useCallback, useEffect, useRef } from "react";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/sounds/mixkit-correct-answer-tone-2870.wav");
    audio.preload = "auto";
    audio.volume = 0.7;
    audioRef.current = audio;

    const unlock = async () => {
      if (unlockedRef.current) return;

      try {
        audio.currentTime = 0;
        await audio.play();      // لازم داخل user gesture
        audio.pause();
        audio.currentTime = 0;
        unlockedRef.current = true;
        console.log("🔓 [SOUND] unlocked");
      } catch (e) {
        console.log("❌ [SOUND] unlock failed", e);
      }
    };

    const onFirstGesture = () => { void unlock(); };

    document.addEventListener("pointerdown", onFirstGesture, { once: true });
    document.addEventListener("keydown", onFirstGesture, { once: true });

    return () => {
      document.removeEventListener("pointerdown", onFirstGesture);
      document.removeEventListener("keydown", onFirstGesture);
      audioRef.current = null;
    };
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!unlockedRef.current) {
      console.log("🔇 [SOUND] blocked (not unlocked yet)");
      return;
    }

    try {
      audio.currentTime = 0;     // مهم جدًا لإعادة التشغيل
      await audio.play();
    } catch (e) {
      console.log("❌ [SOUND] play failed", e);
      // لو المتصفح قرر يمنع تاني، اسمح بإعادة unlock على gesture لاحقًا
      unlockedRef.current = false;
    }
  }, []);

  return { play };
}
