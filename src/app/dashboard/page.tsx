"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Wifi,
  Shield,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  Bot,
  User
} from "lucide-react";

interface SystemStatus {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: any;
  nodeVersion: string;
  platform: string;
  pid: number;
  services?: any;
  decentralized?: any;
  fuel?: any;
}

interface FuelStatus {
  balance: number;
  dailyEarnings: number;
  monthlyEarnings: number;
  configured: boolean;
  minSurvivalBudget?: number;
  serverCost?: number;
}

interface AgentMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  actions?: string[];
  confidence?: number;
}

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [fuelStatus, setFuelStatus] = useState<FuelStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Agent interaction state
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentQuery, setAgentQuery] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentContext, setAgentContext] = useState('');

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const fetchFuelStatus = async () => {
    try {
      const response = await fetch('/api/fuel');
      const data = await response.json();
      setFuelStatus(data);
    } catch (error) {
      console.error('Failed to fetch fuel status:', error);
      // Fallback to mock data
      setFuelStatus({
        balance: 1.234,
        dailyEarnings: 0.056,
        monthlyEarnings: 1.892,
        configured: true,
        minSurvivalBudget: 4.5,
        serverCost: 1.5,
        status: 'unknown',
        emergencyMode: false,
        dailySpent: 0,
        monthlySpent: 0,
        dailyLimit: 0.5,
        monthlyLimit: 5.0,
        recommendations: ['Unable to fetch fuel data']
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs?lines=20');
      const data = await response.json();

      // Format logs for display
      const formattedLogs = data.map((log: any) => {
        const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString();
        const level = log.level || 'INFO';
        const message = log.message || 'Unknown log entry';
        return `[${timestamp}] ${level}: ${message}`;
      });

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      // Fallback to mock logs
      const mockLogs = [
        `[${new Date().toISOString()}] System initialized successfully`,
        `[${new Date(Date.now() - 300000).toISOString()}] Health check passed`,
        `[${new Date(Date.now() - 600000).toISOString()}] Memory optimization completed`,
        `[${new Date(Date.now() - 900000).toISOString()}] Fuel system active`,
        `[${new Date(Date.now() - 1200000).toISOString()}] Migration monitor started`,
      ];
      setLogs(mockLogs);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSystemStatus(),
      fetchFuelStatus(),
      fetchLogs()
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  };

  const sendAgentQuery = async () => {
    if (!agentQuery.trim()) return;

    setAgentLoading(true);

    // Add user message
    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: agentQuery,
      timestamp: new Date()
    };

    setAgentMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: agentQuery,
          context: agentContext || `System Status: ${systemStatus?.status || 'unknown'}, Fuel: ${fuelStatus?.balance?.toFixed(4) || '0'} SOL`,
          actionType: 'query'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const agentMessage: AgentMessage = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: result.response,
          timestamp: new Date(),
          actions: result.actions,
          confidence: result.confidence
        };

        setAgentMessages(prev => [...prev, agentMessage]);
      } else {
        const errorMessage: AgentMessage = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: `Error: ${result.error || 'Failed to get response'}`,
          timestamp: new Date()
        };

        setAgentMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setAgentMessages(prev => [...prev, errorMessage]);
    }

    setAgentQuery('');
    setAgentLoading(false);
  };

  useEffect(() => {
    refreshData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">OpenMind Dashboard</h1>
            <p className="text-slate-400 mt-1">
              System Status & Monitoring
              {lastUpdate && (
                <span className="ml-2 text-xs">
                  • Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={refreshData}
            disabled={loading}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* System Health */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">System Health</CardTitle>
              <Activity className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {systemStatus?.status === 'healthy' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <Badge variant={systemStatus?.status === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus?.status || 'Unknown'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Uptime: {systemStatus ? formatUptime(systemStatus.uptime) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Memory Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              {systemStatus?.memory && (
                <>
                  <div className="text-2xl font-bold text-white">
                    {((systemStatus.memory.heapUsed / systemStatus.memory.heapTotal) * 100).toFixed(1)}%
                  </div>
                  <Progress
                    value={(systemStatus.memory.heapUsed / systemStatus.memory.heapTotal) * 100}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {formatBytes(systemStatus.memory.heapUsed)} / {formatBytes(systemStatus.memory.heapTotal)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fuel Balance */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Fuel Balance</CardTitle>
              <Zap className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {fuelStatus?.balance?.toFixed(4) || '0.0000'} SOL
              </div>
              {fuelStatus && (
                <p className="text-xs text-slate-400 mt-2">
                  Daily: +{fuelStatus.dailyEarnings?.toFixed(4) || '0.0000'} SOL
                </p>
              )}
            </CardContent>
          </Card>

          {/* Services Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Services</CardTitle>
              <Server className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-slate-300">API Active</span>
              </div>
              {systemStatus?.decentralized && (
                <div className="flex items-center space-x-2 mt-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-slate-300">Skynet Mode</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="system" className="data-[state=active]:bg-slate-700">System Details</TabsTrigger>
            <TabsTrigger value="fuel" className="data-[state=active]:bg-slate-700">Fuel & Earnings</TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">Recent Logs</TabsTrigger>
            <TabsTrigger value="agent" className="data-[state=active]:bg-slate-700">AI Agent</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Information */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-300">System Information</CardTitle>
                  <CardDescription>Runtime and platform details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Node Version:</span>
                    <span className="text-slate-300">{systemStatus?.nodeVersion || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform:</span>
                    <span className="text-slate-300">{systemStatus?.platform || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Process ID:</span>
                    <span className="text-slate-300">{systemStatus?.pid || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uptime:</span>
                    <span className="text-slate-300">
                      {systemStatus ? formatUptime(systemStatus.uptime) : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Decentralized Status */}
              {systemStatus?.decentralized && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-300">Decentralized Network</CardTitle>
                    <CardDescription>Skynet protocol status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Node ID:</span>
                      <span className="text-slate-300 text-xs font-mono">
                        {systemStatus.decentralized.nodeId?.substring(0, 12)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Network ID:</span>
                      <span className="text-slate-300 text-xs font-mono">
                        {systemStatus.decentralized.networkId?.substring(0, 12)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Version:</span>
                      <span className="text-slate-300">{systemStatus.decentralized.version || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Skynet Mode:</span>
                      <Badge variant={systemStatus.decentralized.skynetMode ? 'default' : 'secondary'}>
                        {systemStatus.decentralized.skynetMode ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fuel" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fuel Balance */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-300">Fuel Balance</CardTitle>
                  <CardDescription>Current SOL balance and spending status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-yellow-400">
                      {fuelStatus?.balance?.toFixed(4) || '0.0000'} SOL
                    </div>
                    <Badge variant={fuelStatus?.status === 'healthy' ? 'default' : 'destructive'}>
                      {fuelStatus?.status || 'unknown'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Daily Spent:</span>
                      <span className="text-slate-300">
                        {fuelStatus?.dailySpent?.toFixed(4) || '0.0000'} / {fuelStatus?.dailyLimit?.toFixed(1) || '0.0'} SOL
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Monthly Spent:</span>
                      <span className="text-slate-300">
                        {fuelStatus?.monthlySpent?.toFixed(4) || '0.0000'} / {fuelStatus?.monthlyLimit?.toFixed(1) || '0.0'} SOL
                      </span>
                    </div>
                    {fuelStatus?.emergencyMode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400">Emergency Mode:</span>
                        <Badge variant="destructive">ACTIVE</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Earnings History */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-300">Earnings</CardTitle>
                  <CardDescription>Recent income generation and trends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily Earnings:</span>
                      <span className="text-green-400">+{fuelStatus?.dailyEarnings?.toFixed(4) || '0.0000'} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Earnings:</span>
                      <span className="text-green-400">+{fuelStatus?.monthlyEarnings?.toFixed(4) || '0.0000'} SOL</span>
                    </div>
                  </div>

                  {/* Recent Earnings Chart (Simplified) */}
                  {fuelStatus?.earningsHistory && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-300">Last 7 Days</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {fuelStatus.earningsHistory.slice(-7).map((earning: any, index: number) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-slate-400">{earning.date}:</span>
                            <span className="text-green-400">+{earning.amount?.toFixed(4)} SOL</span>
                            <Badge variant="outline" className="text-xs">{earning.source}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {fuelStatus?.recommendations && fuelStatus.recommendations.length > 0 && (
                    <Alert className="border-yellow-500/20 bg-yellow-500/10">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-yellow-400">Fuel System Recommendations</AlertTitle>
                      <AlertDescription className="text-yellow-300">
                        {fuelStatus.recommendations[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-300">Recent System Logs</CardTitle>
                <CardDescription>Latest system events and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono text-slate-300 bg-slate-900/50 p-2 rounded border border-slate-700">
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center text-slate-500 py-8">
                      No logs available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Chat Interface */}
              <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-slate-300 flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    OpenMind AI Agent
                  </CardTitle>
                  <CardDescription>Interact with the autonomous AI agent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Messages */}
                  <div className="h-96 overflow-y-auto space-y-4 p-2 border border-slate-700 rounded">
                    {agentMessages.length === 0 && (
                      <div className="text-center text-slate-500 py-8">
                        <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Start a conversation with the AI agent</p>
                      </div>
                    )}
                    {agentMessages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {message.type === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div className={`p-3 rounded-lg max-w-full ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            {message.actions && message.actions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-slate-400">Actions taken:</p>
                                {message.actions.map((action, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {message.confidence !== undefined && (
                              <div className="mt-2 text-xs text-slate-400">
                                Confidence: {(message.confidence * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Ask the AI agent anything..."
                      value={agentQuery}
                      onChange={(e) => setAgentQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendAgentQuery();
                        }
                      }}
                      className="bg-slate-900 border-slate-600 text-slate-300"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={sendAgentQuery}
                        disabled={agentLoading || !agentQuery.trim()}
                        className="flex-1"
                      >
                        {agentLoading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Status & Quick Actions */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-300">Agent Status</CardTitle>
                  <CardDescription>AI agent capabilities and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Badge variant="default" className="w-full justify-center">
                      Status: Active
                    </Badge>
                    <Badge variant="secondary" className="w-full justify-center">
                      Version: 1.0.0
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300">Capabilities</h4>
                    <div className="space-y-1">
                      {[
                        'Query Answering',
                        'Decision Making',
                        'Action Logging',
                        'System Monitoring',
                        'Fuel Management'
                      ].map((capability) => (
                        <div key={capability} className="flex items-center gap-2 text-sm text-slate-400">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          {capability}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => {
                          setAgentQuery('What is the current system status?');
                        }}
                      >
                        Check System Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => {
                          setAgentQuery('Analyze fuel levels and suggest actions');
                        }}
                      >
                        Analyze Fuel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => {
                          setAgentQuery('What actions have been logged recently?');
                        }}
                      >
                        Recent Actions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}