import { useCallback, useEffect, useRef, useState } from "react";

export function useHorizontalDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const momentumRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;

    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);

    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;

      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 1.2;

      setVelocity(walk);
      scrollRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, scrollLeft, startX]
  );

  const startMomentumScroll = useCallback(() => {
    let currentVelocity = velocity;

    const step = () => {
      if (!scrollRef.current) return;

      scrollRef.current.scrollLeft -= currentVelocity;
      currentVelocity *= 0.95;

      if (Math.abs(currentVelocity) > 0.5) {
        momentumRef.current = requestAnimationFrame(step);
      }
    };

    momentumRef.current = requestAnimationFrame(step);
  }, [velocity]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    startMomentumScroll();
  }, [startMomentumScroll]);

  useEffect(() => {
    return () => {
      if (momentumRef.current) {
        cancelAnimationFrame(momentumRef.current);
      }
    };
  }, []);

  return {
    scrollRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
