import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

const TICK_INTERVAL_MS = 1000;

// Oyun boyunca bir kez (App kökünde) çalıştırılır; gerçek zamanı ölçüp
// store'un tick fonksiyonuna aktarır. Duraklatma (speed=0) store içinde ele alınır.
export function useGameClock() {
  const tick = useGameStore((s) => s.tick);
  const lastTsRef = useRef(Date.now());

  useEffect(() => {
    lastTsRef.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - lastTsRef.current) / 1000;
      lastTsRef.current = now;
      tick(elapsedSeconds);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tick]);
}
