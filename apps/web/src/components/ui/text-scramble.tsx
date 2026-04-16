'use client';

import { type JSX, useEffect, useState, useRef } from 'react';
import { motion, type MotionProps, useInView } from 'motion/react';

type TextScrambleProps = {
  children: string;
  duration?: number;
  speed?: number;
  characterSet?: string;
  as?: React.ElementType;
  className?: string;
  scrambleClassName?: string;
  trigger?: boolean;
  onScrambleComplete?: () => void;
} & MotionProps;

const defaultChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = defaultChars,
  className,
  scrambleClassName,
  as: Component = 'p',
  trigger,
  onScrambleComplete,
  ...props
}: TextScrambleProps) {
  const containerRef = useRef<HTMLElement>(null);
  
  // If trigger is not provided, we can use useInView as a default trigger
  const inView = useInView(containerRef, { once: true });
  const shouldTrigger = trigger ?? inView;

  const [displayChars, setDisplayChars] = useState<{ char: string; isScrambled: boolean }[]>(
    children.split('').map(char => ({ char, isScrambled: false }))
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const text = children;

  useEffect(() => {
    if (!shouldTrigger || isAnimating) return;

    let isCancelled = false;
    setIsAnimating(true);

    const steps = duration / speed;
    let step = 0;

    const interval = setInterval(() => {
      if (isCancelled) return;

      const newDisplayChars: { char: string; isScrambled: boolean }[] = [];
      const progress = step / steps;

      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          newDisplayChars.push({ char: ' ', isScrambled: false });
          continue;
        }

        if (progress * text.length > i) {
          newDisplayChars.push({ char: text[i], isScrambled: false });
        } else {
          newDisplayChars.push({
            char: characterSet[Math.floor(Math.random() * characterSet.length)],
            isScrambled: true,
          });
        }
      }

      setDisplayChars(newDisplayChars);
      step++;

      if (step > steps) {
        clearInterval(interval);
        setDisplayChars(text.split('').map(char => ({ char, isScrambled: false })));
        setIsAnimating(false);
        onScrambleComplete?.();
      }
    }, speed * 1000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [shouldTrigger, text, duration, speed, characterSet]);

  // Using motion[Component] for standard HTML tags or motion.create for others
  const MotionComponent = typeof Component === 'string' 
    ? (motion as any)[Component] 
    : motion.create(Component as any);

  return (
    <MotionComponent 
      ref={containerRef}
      className={className} 
      {...props}
    >
      {displayChars.map((item, index) => (
        <span 
          key={index} 
          className={item.isScrambled ? scrambleClassName : undefined}
        >
          {item.char}
        </span>
      ))}
    </MotionComponent>
  );
}
