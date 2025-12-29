import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { isBirthdayToday } from '@/utils/birthdayToday';

export function useBirthdayEffect({ result, user, messageType }) {
  const [showBirthday, setShowBirthday] = useState(false);

  const audioRef = useRef(null);
  const stopTimerRef = useRef(null);
  const lastBirthdayUserRef = useRef(null);

  // INIT AUDIO
  useEffect(() => {
    const audio = new Audio('/audio/birthday.mp3');
    audio.preload = 'auto';

    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = 25;
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const playBirthday = (userId) => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 12

    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }

    lastBirthdayUserRef.current = userId;

    audioRef.current.play().catch(() => {});

    stopTimerRef.current = setTimeout(() => {
      audioRef.current.pause();
    }, 25000);
  };

  // MAIN EFFECT
  useEffect(() => {
    if (messageType !== 'success') {
      audioRef.current?.pause();
      setShowBirthday(false);
      return;
    }

    const userData = result?.data?.user || user;
    if (!userData) return;

    const { id, date_of_birth } = userData;

    if (
      isBirthdayToday(date_of_birth) &&
      lastBirthdayUserRef.current !== id
    ) {
      playBirthday(id);
      setShowBirthday(true);

      const duration = 25 * 1000;
      const animationEnd = Date.now() + duration;

      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 90,
        zIndex: 9999,
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          setShowBirthday(false);
          return;
        }

        const particleCount = Math.floor(50 * (timeLeft / duration));

        const randomInRange = (min, max) =>
          Math.random() * (max - min) + min;

        confetti({
          ...defaults,
          particleCount,
          origin: {
            x: randomInRange(0.1, 0.3),
            y: Math.random() - 0.2,
          },
        });

        confetti({
          ...defaults,
          particleCount,
          origin: {
            x: randomInRange(0.7, 0.9),
            y: Math.random() - 0.2,
          },
        });
      }, 250);

      return () => clearInterval(interval);
    } else {
      audioRef.current.pause();
      setShowBirthday(false);
    }
  }, [messageType, result, user]);

  return { showBirthday };
}
