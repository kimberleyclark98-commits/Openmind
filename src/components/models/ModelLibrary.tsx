"use client";

import { useState } from "react";
import { Model } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Download, Trash2, Cpu, HardDrive, Info, Plus } from "lucide-react";

const AVAILABLE_MODELS: Model[] = [
  { id: '1', name: 'Llama 3.1', version: '8B', size: '4.7GB', description: 'Meta high performance model optimized for dialogue.', isInstalled: true },
  { id: '2', name: 'Mistral', version: '7B v0.3', size: '4.1GB', description: 'The current industry standard for efficiency and quality.', isInstalled: true },
  { id: '3', name: 'Phi-3', version: 'Mini', size: '2.3GB', description: 'Powerful small model by Microsoft, great for light tasks.', isInstalled: false },
  { id: '4', name: 'Gemma', version: '9B', size: '5.2GB', description: 'Google high performance model built for research.', isInstalled: false },
  { id: '5', name: 'CodeLlama', version: '13B', size: '7.8GB', description: 'Specialized for coding and technical explanations.', isInstalled: false },
  { id: '6', name: 'StableLM', version: '3B', size: '1.8GB', description: 'Extremely fast, low-latency conversational model.', isInstalled: false },
];

export function ModelLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const filteredModels = AVAILABLE_MODELS.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (id: string) => {
    setDownloadingId(id);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setDownloadingId(null);
          return 100;
        }
        return p + Math.random() * 15;
      });
    }, 400);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-8 py-6 border-b border-border/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Model Library</h1>
            <p className="text-sm text-muted-foreground">Discover, download, and manage your local intelligence.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search models..." 
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 text-center bg-transparent group cursor-pointer hover:border-primary/50 transition-all">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">Import Custom Model</h3>
            <p className="text-xs text-muted-foreground mt-1">Load GGUF or Safetensors files directly.</p>
          </Card>

          {filteredModels.map(model => (
            <Card key={model.id} className="bg-card border-border flex flex-col hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <Badge variant={model.isInstalled ? "default" : "secondary"} className="text-[10px] uppercase tracking-wider">
                    {model.isInstalled ? "Installed" : "Cloud"}
                  </Badge>
                </div>
                <CardTitle className="mt-4 flex items-baseline gap-2">
                  {model.name}
                  <span className="text-xs font-normal text-muted-foreground">{model.version}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 py-4">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {model.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" />
                    {model.size}
                  </div>
                  <div className="flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" />
                    Ollama compatible
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t mt-auto">
                {downloadingId === model.id ? (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-[10px] font-medium uppercase text-primary">
                      <span>Downloading...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                ) : (
                  <div className="flex w-full gap-2">
                    {model.isInstalled ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1">Configure</Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => handleDownload(model.id)} className="w-full gap-2" size="sm">
                        <Download className="h-4 w-4" /> Download
                      </Button>
                    )}
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
