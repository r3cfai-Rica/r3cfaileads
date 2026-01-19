import React, { useState, forwardRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AssistantPanel } from './AssistantPanel';

export const FloatingAssistant = forwardRef<HTMLDivElement>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div ref={ref}>
      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-50 transition-all duration-300 transform',
          isOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <AssistantPanel onClose={() => setIsOpen(false)} />
      </div>

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg',
          'bg-primary hover:bg-primary/90 text-primary-foreground',
          'transition-all duration-300 hover:scale-110',
          isOpen && 'rotate-90'
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
});

FloatingAssistant.displayName = 'FloatingAssistant';
