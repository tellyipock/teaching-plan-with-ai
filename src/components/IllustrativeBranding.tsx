import React from 'react';
import { cn } from '@/lib/utils';
export const SketchyUnderline = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 10"
    preserveAspectRatio="none"
    className={cn("h-2 w-full fill-none stroke-primary/30 stroke-[2px]", className)}
  >
    <path d="M2 5 L 198 5" strokeLinecap="round" />
  </svg>
);
export const SketchyCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "relative bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-primary/10 rounded-2xl transition-all duration-300",
    className
  )}>
    {children}
  </div>
);
export const Handwriting = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("text-ink text-lg tracking-tight font-medium", className)}>
    {children}
  </span>
);