"use client";

import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex w-full mb-6 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border",
        isUser 
          ? "bg-primary text-primary-foreground border-primary/20" 
          : "bg-card border-border shadow-sm"
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5 text-primary" />}
      </div>
      
      <div className={cn(
        "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-none" 
          : "bg-card border border-border text-foreground rounded-tl-none"
      )}>
        {message.content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
        ))}
        <div className={cn(
          "text-[10px] mt-2 opacity-50",
          isUser ? "text-right" : "text-left"
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
