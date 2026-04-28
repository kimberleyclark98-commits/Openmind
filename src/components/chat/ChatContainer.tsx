"use client";

import { useState, useRef, useEffect } from "react";
import { Message, Model, Conversation } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { PromptRefinementTool } from "../tools/PromptRefinementTool";
import { A2UIRenderer } from "../a2ui/A2UIRenderer";
import { A2UIMessage } from "@/lib/a2ui/types";
import { a2uiDetector, a2uiParser } from "@/lib/a2ui/parser";
import { skillRouter, SkillContext } from "@/ai/skills/skill-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Send,
  Sparkles,
  Trash2,
  MoreVertical,
  ChevronDown,
  LayoutGrid,
  History,
  Code
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MOCK_MODELS: Model[] = [
  { id: '1', name: 'Llama 3.1', version: '8B', size: '4.7GB', description: 'Meta high performance model', isInstalled: true },
  { id: '2', name: 'Mistral', version: '7B', size: '4.1GB', description: 'Fast and efficient', isInstalled: true },
  { id: '3', name: 'Phi-3', version: 'Mini', size: '2.3GB', description: 'Microsoft small model', isInstalled: true },
];

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeModel, setActiveModel] = useState<Model>(MOCK_MODELS[0]);
  const [isRefinerOpen, setIsRefinerOpen] = useState(false);
  const [a2uiStream, setA2uiStream] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");

    // Use OpenMind skill router for intelligent response generation
    setTimeout(async () => {
      try {
        const skillContext: SkillContext = {
          userInput,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          availableSkills: Object.keys(require('@/ai/skills/skill-router').OPENMIND_SKILLS),
          currentModel: activeModel.name
        };

        const skillResponse = await skillRouter.route(skillContext);

        let aiContent = '';
        let newA2uiMessages: A2UIMessage[] = [];

        // Process response based on format
        if (skillResponse.format === 'a2ui' && Array.isArray(skillResponse.content)) {
          // Convert A2UI messages to JSON strings for the new renderer
          const streamLines = skillResponse.content.map(msg => JSON.stringify(msg));
          setA2uiStream(streamLines);
          aiContent = `🧠 OpenMind neural interface activated. Cyberpunk UI generated using ${skillResponse.skill} protocol.`;
        } else if (skillResponse.format === 'mixed') {
          // For mixed responses, assume the content is a string that may contain A2UI
          aiContent = skillResponse.content as string;
          // If it contains A2UI markers, we could extract them here
        } else {
          aiContent = skillResponse.content as string;
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiContent,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMsg]);

      } catch (error) {
        console.error('Skill routing failed:', error);

        // Fallback response
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '🧠 Neural pathways disrupted... System recovering. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    }, 800);
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-3 hover:bg-accent gap-2 border border-transparent hover:border-border transition-all">
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Active Model</span>
                  <span className="text-sm font-medium">{activeModel.name} <span className="text-muted-foreground font-normal">{activeModel.version}</span></span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card border-border shadow-xl">
              {MOCK_MODELS.map(model => (
                <DropdownMenuItem 
                  key={model.id} 
                  onClick={() => setActiveModel(model)}
                  className={cn("flex flex-col items-start p-3 cursor-pointer", activeModel.id === model.id && "bg-accent")}
                >
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={clearChat} title="Clear history">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 border border-cyan-500/30">
              <Sparkles className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              How can I help you?
            </h2>
            <p className="text-muted-foreground">
              Select a local model and start a conversation. I can create dynamic cyberpunk UI interfaces.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4 w-full">
              {[
                "Create a cyberpunk dashboard",
                "Build a task management UI",
                "Design a data visualization interface",
                "Make a settings panel"
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="p-3 text-xs text-left border border-cyan-500/30 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {messages.map(msg => (
              <div key={msg.id}>
                <MessageBubble message={msg} />
                {/* Render A2UI interface if this message triggered UI creation */}
                {msg.role === 'assistant' && a2uiStream.length > 0 && (
                  <div className="mt-4 ml-16">
                    <A2UIRenderer
                      stream={a2uiStream}
                      surfaceId={`surface_${msg.id}`}
                      onInteraction={(componentId, action, data) => {
                        console.log('A2UI Interaction recorded:', componentId, action, data);
                        // Could add more sophisticated interaction handling here
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsRefinerOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                title="Optimize prompt with AI"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Message ${activeModel.name}...`}
              className="pl-12 pr-12 py-6 bg-card border-border hover:border-primary/30 focus-visible:ring-primary/20 rounded-2xl shadow-sm transition-all text-base"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button 
                onClick={handleSend} 
                size="icon" 
                disabled={!input.trim()}
                className="rounded-xl h-8 w-8 shadow-md"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-center mt-3 text-muted-foreground">
            OpenMind runs locally. Responses may vary based on your system performance.
          </p>
        </div>
      </div>

      {/* Prompt Refiner Tool Overlay */}
      <PromptRefinementTool 
        isOpen={isRefinerOpen} 
        onClose={() => setIsRefinerOpen(false)}
        initialPrompt={input}
        onApply={(refined) => {
          setInput(refined);
          setIsRefinerOpen(false);
        }}
      />
    </div>
  );
}
