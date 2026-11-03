import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/15 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    gray: 'bg-gray-800 text-gray-400 border-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
