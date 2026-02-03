/**
 * Leaderboard Confetti Effect Component
 * Animated confetti particles for celebration
 * Features:
 * - Random colors from predefined palette
 * - Random horizontal position and rotation
 * - Falling animation with fade out
 * - Staggered delays for natural effect
 */

import { motion } from 'framer-motion';

interface Props {
  delay: number;
}

export default function LeaderboardConfettiParticle({ delay }: Props) {
  const colors = ['#00575A', '#FFBF00', '#FF6B6B', '#4ECDC4', '#95E1D3'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;

  return (
    <motion.div
      initial={{ y: -20, x: `${randomX}vw`, opacity: 1, rotate: 0 }}
      animate={{
        y: '100vh',
        rotate: randomRotation,
        opacity: 0,
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: delay,
        ease: 'easeIn',
      }}
      className="absolute w-3 h-3 pointer-events-none"
      style={{
        backgroundColor: randomColor,
        borderRadius: Math.random() > 0.5 ? '50%' : '0%',
      }}
    />
  );
}
