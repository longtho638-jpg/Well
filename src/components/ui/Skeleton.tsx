import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";
  
  const variantClasses = {
    text: "h-4 w-full",
    rectangular: "h-full w-full",
    circular: "rounded-full",
  };

  return (
    <div
      className={`\${baseClasses} \${variantClasses[variant]} \${className}`}
      style={{ width, height }}
    />
  );
}
