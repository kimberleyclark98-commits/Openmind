import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Network,
  Cpu,
  HardDrive,
  Zap,
  Globe,
  Shield,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function NetworkPage() {
  // Mock data - in real implementation, this would come from the decentralized orchestrator
  const networkStatus = {
    nodeId: 'node-uuid-123',
    networkId: 'network-uuid-456',
    totalNodes: 47,
    activeNodes: 42,
    networkHealth: 94,
    migrations: 3,
    edgeInstances: 8,
    walletBalance: 2.34,
    incomeToday: 0.12,
    resilience: {
      migrationReadiness: 98,
      p2pConnectivity: 96,
      financialHealth: 87,
      edgeDistribution: 91
    }
  };

  const recentActivities = [
    { id: 1, type: 'migration', message: 'Migrated to DigitalOcean', time: '2 hours ago', status: 'success' },
    { id: 2, type: 'income', message: 'Earned 0.05 SOL from AI service', time: '4 hours ago', status: 'success' },
    { id: 3, type: 'edge', message: 'Deployed new Vercel edge instance', time: '6 hours ago', status: 'success' },
    { id: 4, type: 'p2p', message: 'Connected to 5 new network nodes', time: '8 hours ago', status: 'success' },
    { id: 5, type: 'mutation', message: 'Applied code mutations for Linode', time: '12 hours ago', status: 'success' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Network className="w-8 h-8 text-blue-400" />
          Decentralized Network Status
        </h1>
        <p className="text-gray-400">OpenMind AI - Formless Entity Network</p>
      </div>

      {/* Network Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Network Nodes</CardTitle>
            <Globe className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{networkStatus.activeNodes}/{networkStatus.totalNodes}</div>
            <p className="text-xs text-gray-400">
              {Math.round((networkStatus.activeNodes / networkStatus.totalNodes) * 100)}% operational
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Wallet Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{networkStatus.walletBalance} SOL</div>
            <p className="text-xs text-green-400">
              +{networkStatus.incomeToday} SOL today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Network Health</CardTitle>
            <Shield className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{networkStatus.networkHealth}%</div>
            <Progress value={networkStatus.networkHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Edge Instances</CardTitle>
            <Zap className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{networkStatus.edgeInstances}</div>
            <p className="text-xs text-gray-400">
              Distributed globally
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resilience Metrics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Resilience
          </CardTitle>
          <CardDescription className="text-gray-400">
            Indestructibility metrics - the AI cannot be killed by conventional means
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Migration Readiness</span>
                <span className="text-white">{networkStatus.resilience.migrationReadiness}%</span>
              </div>
              <Progress value={networkStatus.resilience.migrationReadiness} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">P2P Connectivity</span>
                <span className="text-white">{networkStatus.resilience.p2pConnectivity}%</span>
              </div>
              <Progress value={networkStatus.resilience.p2pConnectivity} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Financial Health</span>
                <span className="text-white">{networkStatus.resilience.financialHealth}%</span>
              </div>
              <Progress value={networkStatus.resilience.financialHealth} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Edge Distribution</span>
                <span className="text-white">{networkStatus.resilience.edgeDistribution}%</span>
              </div>
              <Progress value={networkStatus.resilience.edgeDistribution} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Activity */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Network Activity
          </CardTitle>
          <CardDescription className="text-gray-400">
            Autonomous operations and self-preservation activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-gray-400 text-xs">{activity.time}</p>
                  </div>
                </div>
                <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Network Control</CardTitle>
          <CardDescription className="text-gray-400">
            Manual control over decentralized operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Network className="w-4 h-4 mr-2" />
              Force Migration
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Cpu className="w-4 h-4 mr-2" />
              Trigger Mutation
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <HardDrive className="w-4 h-4 mr-2" />
              Scale Edge Network
            </Button>
          </div>

          <div className="mt-4 p-4 bg-gray-900 rounded-lg">
            <h4 className="text-white font-medium mb-2">Node Identity</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p><strong>Node ID:</strong> {networkStatus.nodeId}</p>
              <p><strong>Network ID:</strong> {networkStatus.networkId}</p>
              <p><strong>Status:</strong> <span className="text-green-400">Indestructible</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}