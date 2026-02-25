/**
 * Wallet Animated Counter Component
 * Smooth counting animation for balance displays
 * Features:
 * - Framer motion value animation
 * - Configurable decimal places
 * - Easing animation (1.5s duration)
 */

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface Props {
  value: number;
  decimals?: number;
}

export default function WalletAnimatedCounter({
  value,
  decimals = 0,
}: Props) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return latest.toFixed(decimals);
  });

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
}
