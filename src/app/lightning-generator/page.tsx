'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Code, Zap, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface GeneratedCode {
  code: string;
  explanation: string;
  imports?: string[];
  dependencies?: string[];
  suggestions?: string[];
  confidence: number;
}

export default function LightningCodeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [context, setContext] = useState('');
  const [requirements, setRequirements] = useState('');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const languages = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'rust', label: 'Rust' },
    { value: 'go', label: 'Go' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/lightning-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          language,
          context: context || undefined,
          requirements: requirements.split('\n').filter(r => r.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const result = await response.json();
      setGeneratedCode(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lightning Code Generator
            </h1>
            <p className="text-muted-foreground">
              Ultra-fast, highly accurate code generation powered by advanced AI
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Code Generation Request
            </CardTitle>
            <CardDescription>
              Describe what you want to build in natural language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Prompt</label>
              <Textarea
                placeholder="Describe the code you want to generate... e.g., 'Create a React component for user authentication'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Requirements</label>
                <Textarea
                  placeholder="Optional requirements (one per line)"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="min-h-16"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Context (Optional)</label>
              <Textarea
                placeholder="Provide existing code context or project details..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-20"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Code
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
            <CardDescription>
              AI-generated code with explanations and suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedCode ? (
              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getConfidenceColor(generatedCode.confidence)}>
                        {Math.round(generatedCode.confidence * 100)}% confidence
                      </Badge>
                      <Badge variant="outline">{language}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedCode.code)}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{generatedCode.code}</code>
                  </pre>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Explanation</h4>
                    <p className="text-sm text-muted-foreground">{generatedCode.explanation}</p>
                  </div>

                  {generatedCode.imports && generatedCode.imports.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Imports</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedCode.imports.map((imp, idx) => (
                          <Badge key={idx} variant="secondary">{imp}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedCode.dependencies && generatedCode.dependencies.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Dependencies</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedCode.dependencies.map((dep, idx) => (
                          <Badge key={idx} variant="outline">{dep}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4">
                  {generatedCode.suggestions && generatedCode.suggestions.length > 0 ? (
                    <div className="space-y-2">
                      {generatedCode.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No suggestions available</p>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Code className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Code Generated Yet</h3>
                <p className="text-muted-foreground">
                  Fill in the form on the left and click "Generate Code" to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}