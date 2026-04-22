import React from 'react';
import { Github, Twitter, Heart, Sparkles, ShieldCheck } from 'lucide-react';
import { Handwriting } from '@/components/IllustrativeBranding';
export function Footer() {
  return (
    <footer className="w-full bg-white/50 border-t border-primary/10 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary w-5 h-5" />
              <span className="text-xl font-bold">RubricFlow</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Empowering educators with AI-driven productivity tools to spend more time on what matters: student growth.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Teaching Standards</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Feedback Best Practices</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="space-y-4 md:text-right">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Connect</h4>
            <div className="flex md:justify-end gap-4">
              <a href="#" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                <Github className="w-4 h-4" />
              </a>
            </div>
            <Handwriting className="text-sm block">Built by teachers, for teachers</Handwriting>
          </div>
        </div>
        <div className="pt-8 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <ShieldCheck className="w-3 h-3" />
            <p>Note: RubricFlow utilizes AI processing. There is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© 2024 RubricFlow. Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>in the classroom</span>
          </div>
        </div>
      </div>
    </footer>
  );
}