"use client";

import { useState } from "react";
import { refinePrompt, AiPromptRefinementOutput } from "@/ai/flows/ai-prompt-refinement";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Sparkles, Copy, ArrowRight, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PromptRefinementToolProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (prompt: string) => void;
  initialPrompt: string;
}

export function PromptRefinementTool({ isOpen, onClose, onApply, initialPrompt }: PromptRefinementToolProps) {
  const [userPrompt, setUserPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiPromptRefinementOutput | null>(null);

  if (!isOpen) return null;

  const handleRefine = async () => {
    if (!userPrompt.trim()) return;
    setIsLoading(true);
    try {
      const output = await refinePrompt({ userPrompt });
      setResult(output);
    } catch (error) {
      toast({
        title: "Refinement failed",
        description: "Could not refine prompt at this time.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Prompt Optimizer
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Original Prompt</label>
            <Textarea 
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="What are you trying to ask?"
              className="min-h-[100px] resize-none bg-background/50"
            />
          </div>

          {!result && !isLoading && (
            <div className="p-8 border border-dashed rounded-xl text-center text-muted-foreground">
              Enter a prompt above and click refine to optimize it using OpenMind AI.
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm animate-pulse">Refining with Intelligence...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-primary">Optimized Prompt</label>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(result.refinedPrompt)} className="h-8 gap-1">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm italic">
                  "{result.refinedPrompt}"
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Key Improvements</label>
                  <ul className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-xs flex gap-2">
                        <span className="text-primary">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Examples</label>
                  <div className="space-y-2">
                    {result.examplePrompts.map((p, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleCopy(p)}
                        className="w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors border border-border"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            {!result ? (
              <Button onClick={handleRefine} disabled={!userPrompt.trim() || isLoading}>
                {isLoading ? "Thinking..." : "Optimize Prompt"}
              </Button>
            ) : (
              <Button onClick={() => onApply(result.refinedPrompt)} className="gap-2">
                Use this Prompt <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
