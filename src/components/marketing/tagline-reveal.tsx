"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function TaglineReveal({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [activeCount, setActiveCount] = useState(0);
  const words = useMemo(() => text.split(" "), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setActiveCount(words.length));
      return () => cancelAnimationFrame(raf);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            words.forEach((_, i) => {
              timers.push(
                setTimeout(() => setActiveCount((c) => Math.max(c, i + 1)), i * 90)
              );
            });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [text, words]);

  return (
    <p
      ref={ref}
      className={`text-pretty text-4xl font-semibold tracking-tight md:text-5xl ${className}`}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={`transition-colors duration-700 ease-fluid ${
            i < activeCount ? "text-foreground" : "text-foreground/30"
          }`}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
