import { useState, useEffect, useRef } from "react";

export function useTime(movement: 'tick' | 'sweep' = 'sweep') {
  const [time, setTime] = useState(new Date());
  const requestRef = useRef<number>();

  useEffect(() => {
    if (movement === 'sweep') {
      const animate = () => {
        setTime(new Date());
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
    } else {
      // Tick movement (1Hz)
      const updateTick = () => {
        const now = new Date();
        now.setMilliseconds(0);
        setTime(now);
      };
      updateTick(); // Initial setting
      const interval = setInterval(updateTick, 1000);
      return () => clearInterval(interval);
    }
  }, [movement]);

  return time;
}
