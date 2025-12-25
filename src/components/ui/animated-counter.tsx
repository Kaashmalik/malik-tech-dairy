'use client';

import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface AnimatedCounterProps {
    value: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    className?: string;
}

export function AnimatedCounter({
    value,
    suffix = '',
    prefix = '',
    duration = 2,
    className = ''
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-10px" });

    const spring = useSpring(0, {
        mass: 1,
        stiffness: 50,
        damping: 20,
        duration: duration * 1000
    });

    const displayValue = useTransform(spring, (current) => {
        // Determine if integer or float based on input value
        const isFloat = value % 1 !== 0;
        return isFloat ? current.toFixed(2) : Math.round(current).toLocaleString();
    });

    useEffect(() => {
        if (inView) {
            spring.set(value);
        }
    }, [spring, value, inView]);

    return (
        <span className={className} ref={ref}>
            {prefix}
            <motion.span>{displayValue}</motion.span>
            {suffix}
        </span>
    );
}
