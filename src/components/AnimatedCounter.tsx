import React, { useEffect, useRef } from 'react';
import { animate } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration in seconds
  formatter?: (val: number) => string;
}

export default function AnimatedCounter({ 
  value, 
  duration = 0.8, 
  formatter = (val) => val.toLocaleString() 
}: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const previousValueRef = useRef<number>(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const start = previousValueRef.current;
    const end = value;

    const controls = animate(start, end, {
      duration: duration,
      ease: 'easeOut',
      onUpdate(val) {
        const isFloat = end % 1 !== 0;
        const roundedValue = isFloat ? Math.round(val * 10) / 10 : Math.round(val);
        node.textContent = formatter(roundedValue);
      },
      onComplete() {
        previousValueRef.current = end;
      }
    });

    return () => {
      controls.stop();
      previousValueRef.current = end;
    };
  }, [value, duration, formatter]);

  return <span ref={nodeRef}>{formatter(value)}</span>;
}
