import React from 'react';
import { cn } from '@/lib/utils';
export const SketchyUnderline = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 20"
    preserveAspectRatio="none"
    className={cn("h-3 w-full fill-none stroke-primary/40 stroke-[3px]", className)}
  >
    <path d="M5 15 Q 50 5, 100 15 T 195 10" strokeLinecap="round" />
  </svg>
);
export const SketchyCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "relative bg-white p-6 shadow-sm border-2 border-primary/20 rounded-xl",
    className
  )}>
    {children}
  </div>
);
export const Handwriting = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("text-ink text-xl", className)}>
    {children}
  </span>
);