"use client";

import { useEffect, useRef, useState } from "react";

export const MarqueeText = ({ text, className }: { text: string; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap w-full ${isOverflowing ? 'mask-fade-edges' : 'pl-0.5'}`}>
      <div 
        ref={textRef} 
        className={`inline-block ${className} ${isOverflowing ? 'animate-scroll-marquee' : ''}`}
        style={isOverflowing ? { animationDuration: `${Math.max(text.length * 0.15, 3)}s` } : {}}
      >
        {text}
        {isOverflowing && <span className="ml-8">{text}</span>}
      </div>
    </div>
  );
};
