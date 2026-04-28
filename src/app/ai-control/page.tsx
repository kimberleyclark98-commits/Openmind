'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface AIStatus {
  status: string;
  isWorkingWithOwner: boolean;
  currentBalance: number;
  todayEarnings: number;
  totalPaidToOwner: number;
  enabledSkills: string[];
  lastActivity: string;
  availableCommands: string[];
}

interface CommandResult {
  success: boolean;
  command?: string;
  result?: string;
  timestamp?: string;
  error?: string;
  message?: string;
}

export default function AIControlPage() {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);
  const [customCommand, setCustomCommand] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [authKey, setAuthKey] = useState('demo-key');

  useEffect(() => {
    fetchAIStatus();
  }, []);

  const fetchAIStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-control');
      const data = await response.json();
      
      if (data.success) {
        setAiStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch AI status:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeCommand = async (command: string, parameters?: Record<string, unknown>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          parameters,
          authKey
        }),
      });

      const result = await response.json();
      setCommandResult(result);
      
      // Refresh status after command
      if (result.success) {
        await fetchAIStatus();
      }
    } catch (error) {
      console.error('Failed to execute command:', error);
      setCommandResult({
        success: false,
        error: 'Network error',
        message: 'Failed to connect to AI control system'
      });
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    { name: 'Get Status', command: 'status', icon: '📊' },
    { name: 'Start Work Session', command: 'start-work-session', icon: '🚀' },
    { name: 'Force Payout', command: 'force-payout', icon: '💰' },
    { name: 'Get Earnings', command: 'get-earnings', icon: '📈' },
    { name: 'Get Performance', command: 'get-performance', icon: '⚡' },
    { name: 'Maximize Earnings', command: 'maximize-earnings', icon: '🔥' },
    { name: 'Emergency Stop', command: 'emergency-stop', icon: '🛑' },
    { name: 'Pause AI', command: 'pause-ai', icon: '⏸️' },
    { name: 'Resume AI', command: 'resume-ai', icon: '▶️' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 AI Control Dashboard</h1>
          <p className="text-muted-foreground">Điều khiển AI Assistant của bạn</p>
        </div>
        <Button onClick={fetchAIStatus} disabled={loading}>
          {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </Button>
      </div>

      {/* AI Status Card */}
      {aiStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              AI Status
              <Badge variant={aiStatus.status === 'active' ? 'default' : 'secondary'}>
                {aiStatus.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {aiStatus.currentBalance.toFixed(3)} SOL
                </div>
                <div className="text-sm text-green-700">Current Balance</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {aiStatus.todayEarnings.toFixed(3)} SOL
                </div>
                <div className="text-sm text-blue-700">Today's Earnings</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {aiStatus.totalPaidToOwner.toFixed(3)} SOL
                </div>
                <div className="text-sm text-purple-700">Total Paid to You</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Enabled Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {aiStatus.enabledSkills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Working with owner: {aiStatus.isWorkingWithOwner ? '✅ Yes' : '❌ No'}
              </p>
              <p className="text-sm text-muted-foreground">
                Last activity: {new Date(aiStatus.lastActivity).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auth Key Input */}
      <Card>
        <CardHeader>
          <CardTitle>🔑 Authentication</CardTitle>
          <CardDescription>Enter your auth key to control the AI</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="Enter auth key (use 'demo-key' for demo)"
            value={authKey}
            onChange={(e) => setAuthKey(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Lightning Code Generator */}
      <Card className="border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Lightning Code Generator
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600">
              AI-Powered
            </Badge>
          </CardTitle>
          <CardDescription>
            Ultra-fast, highly accurate code generation system inspired by Cursor AI, GitHub Copilot, and Claude
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">⚡ Speed:</span>
                <span className="font-semibold text-green-600">Lightning Fast</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">🎯 Accuracy:</span>
                <span className="font-semibold text-blue-600">99%+</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">🌐 Languages:</span>
                <span className="font-semibold text-purple-600">10+ Supported</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">🧠 Intelligence:</span>
                <span className="font-semibold text-orange-600">Advanced AI</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/lightning-generator" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                🚀 Open Code Generator
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => executeCommand('lightning-code-stats')}
              disabled={loading}
            >
              📊 View Stats
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>✨ Features: Multi-language support, real-time completions, error detection, performance optimization</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Commands */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Quick Commands</CardTitle>
          <CardDescription>Click to execute common AI commands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {quickCommands.map((cmd) => (
              <Button
                key={cmd.command}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => executeCommand(cmd.command)}
                disabled={loading}
              >
                <span className="text-2xl">{cmd.icon}</span>
                <span className="text-xs text-center">{cmd.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Commands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ask AI */}
        <Card>
          <CardHeader>
            <CardTitle>💬 Ask AI</CardTitle>
            <CardDescription>Send a message or question to your AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Type your message or question here..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <Button
              onClick={() => executeCommand('ask-ai', { question: customMessage })}
              disabled={loading || !customMessage.trim()}
              className="w-full"
            >
              💬 Send Message
            </Button>
          </CardContent>
        </Card>

        {/* Custom Command */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Custom Command</CardTitle>
            <CardDescription>Execute any available AI command</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter command (e.g., get-logs, give-task)"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
            />
            <Button
              onClick={() => executeCommand(customCommand)}
              disabled={loading || !customCommand.trim()}
              className="w-full"
            >
              ⚙️ Execute Command
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Command Result */}
      {commandResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {commandResult.success ? '✅' : '❌'} Command Result
              {commandResult.command && (
                <Badge variant="outline">{commandResult.command}</Badge>
              )}
            </CardTitle>
            {commandResult.timestamp && (
              <CardDescription>
                Executed at: {new Date(commandResult.timestamp).toLocaleString()}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {commandResult.success ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-green-800">
                  {commandResult.result}
                </pre>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Error:</strong> {commandResult.error}
                  {commandResult.message && (
                    <div className="mt-2">
                      <strong>Details:</strong> {commandResult.message}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Commands Reference */}
      {aiStatus && (
        <Card>
          <CardHeader>
            <CardTitle>📚 Available Commands</CardTitle>
            <CardDescription>All commands you can use with your AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {aiStatus.availableCommands.map((command) => (
                <Badge key={command} variant="secondary" className="justify-center">
                  {command}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}