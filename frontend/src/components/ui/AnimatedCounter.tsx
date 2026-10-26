"use client";

import React, { useEffect, useState, useRef } from "react";

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatter?: (val: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1200,
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  formatter,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const startValueRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Easing function: Ease Out Expo for a snappy start and buttery smooth deceleration
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(value);
      startValueRef.current = value;
      return;
    }

    const startAnimation = () => {
      const fromValue = startValueRef.current;
      const toValue = value;
      const change = toValue - fromValue;

      if (change === 0) {
        setDisplayValue(toValue);
        return;
      }

      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);

        const current = fromValue + change * easedProgress;
        setDisplayValue(current);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(toValue);
          startValueRef.current = toValue;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      timeoutRef.current = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, duration, delay]);

  const formatNumber = (num: number): string => {
    if (formatter) {
      return formatter(num);
    }

    if (decimals > 0) {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    return Math.round(num).toLocaleString();
  };

  return (
    <span className={`tabular-nums inline-block font-inherit ${className}`}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
};
