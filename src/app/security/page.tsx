import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Lock,
  Eye,
  Settings,
  TrendingUp,
  Server,
  Network,
  Code,
  Database
} from 'lucide-react';

export default function SecurityPage() {
  // Mock security data - in real implementation, this would come from the security orchestrator
  const securityStatus = {
    overall: {
      status: 'hardened', // 'vulnerable', 'moderate', 'hardened', 'maximum'
      score: 87,
      lastAudit: new Date('2024-01-15T10:30:00'),
      nextAudit: new Date('2024-01-16T10:30:00')
    },
    categories: {
      system: { status: 'compliant', score: 92, violations: 0 },
      network: { status: 'compliant', score: 85, violations: 1 },
      application: { status: 'compliant', score: 88, violations: 0 },
      monitoring: { status: 'compliant', score: 90, violations: 0 }
    },
    recentEvents: [
      { id: 1, type: 'audit', message: 'Security audit completed successfully', severity: 'info', time: '2 hours ago' },
      { id: 2, type: 'hardening', message: 'Network hardening applied', severity: 'success', time: '1 day ago' },
      { id: 3, type: 'violation', message: 'SSH brute force attempt blocked', severity: 'warning', time: '2 days ago' },
      { id: 4, type: 'update', message: 'Security patches applied', severity: 'info', time: '3 days ago' },
      { id: 5, type: 'alert', message: 'Unauthorized access attempt detected', severity: 'error', time: '1 week ago' }
    ],
    activeThreats: [
      { id: 1, type: 'port_scan', source: '192.168.1.100', severity: 'low', status: 'blocked', detected: '5 min ago' },
      { id: 2, type: 'auth_failure', source: 'unknown', severity: 'medium', status: 'monitored', detected: '1 hour ago' }
    ],
    hardeningStatus: {
      systemHardening: true,
      networkHardening: true,
      applicationHardening: true,
      monitoringHardening: true,
      lastHardening: new Date('2024-01-14T15:20:00')
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'hardened':
      case 'maximum':
        return 'text-green-400';
      case 'moderate':
        return 'text-yellow-400';
      case 'vulnerable':
      case 'non-compliant':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
      case 'critical':
        return 'text-red-400';
      case 'warning':
      case 'high':
        return 'text-yellow-400';
      case 'medium':
        return 'text-orange-400';
      case 'low':
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'hardened':
      case 'maximum':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'vulnerable':
      case 'non-compliant':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          Security Dashboard
        </h1>
        <p className="text-gray-400">OpenMind AI Security Monitoring & Hardening</p>
      </div>

      {/* Overall Security Status */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{securityStatus.overall.score}/100</div>
            <Progress value={securityStatus.overall.score} className="mt-2" />
            <p className="text-xs text-gray-400 mt-1 capitalize">
              {securityStatus.overall.status}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{securityStatus.activeThreats.length}</div>
            <p className="text-xs text-gray-400">
              {securityStatus.activeThreats.filter(t => t.severity === 'high').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Last Audit</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {securityStatus.overall.lastAudit.toLocaleDateString()}
            </div>
            <p className="text-xs text-gray-400">
              {securityStatus.overall.lastAudit.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Next Audit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {securityStatus.overall.nextAudit.toLocaleDateString()}
            </div>
            <p className="text-xs text-gray-400">
              {Math.ceil((securityStatus.overall.nextAudit.getTime() - Date.now()) / (1000 * 60 * 60))}h remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Categories */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security Categories
          </CardTitle>
          <CardDescription className="text-gray-400">
            Compliance status across different security domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(securityStatus.categories).map(([category, status]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <p className="text-white font-medium capitalize">{category}</p>
                    <p className="text-sm text-gray-400">{status.score}/100</p>
                  </div>
                </div>
                <Badge variant={status.status === 'compliant' ? 'default' : 'destructive'}>
                  {status.violations > 0 ? `${status.violations} issues` : 'Clean'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hardening Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Hardening Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            Last hardening: {securityStatus.hardeningStatus.lastHardening.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(securityStatus.hardeningStatus).map(([key, value]) => {
              if (key === 'lastHardening') return null;

              const isEnabled = value as boolean;
              const icons = {
                systemHardening: Server,
                networkHardening: Network,
                applicationHardening: Code,
                monitoringHardening: Eye
              };

              const Icon = icons[key as keyof typeof icons] || Settings;

              return (
                <div key={key} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                  <Icon className={`w-5 h-5 ${isEnabled ? 'text-green-400' : 'text-gray-500'}`} />
                  <div>
                    <p className="text-white font-medium">
                      {key.replace('Hardening', '').replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-gray-400">
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Threats */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active Threats
          </CardTitle>
          <CardDescription className="text-gray-400">
            Currently monitored security threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {securityStatus.activeThreats.length > 0 ? (
            <div className="space-y-3">
              {securityStatus.activeThreats.map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      threat.severity === 'high' ? 'text-red-400' :
                      threat.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                    }`} />
                    <div>
                      <p className="text-white font-medium capitalize">
                        {threat.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-400">
                        Source: {threat.source} • Detected: {threat.detected}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      threat.severity === 'high' ? 'destructive' :
                      threat.severity === 'medium' ? 'default' : 'secondary'
                    }>
                      {threat.severity}
                    </Badge>
                    <Badge variant="outline" className={
                      threat.status === 'blocked' ? 'border-green-400 text-green-400' :
                      threat.status === 'monitored' ? 'border-yellow-400 text-yellow-400' :
                      'border-gray-400 text-gray-400'
                    }>
                      {threat.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-lg font-medium">No Active Threats</p>
              <p className="text-sm">All security monitoring systems are clear</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription className="text-gray-400">
            Latest security events and system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityStatus.recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.severity === 'error' ? 'bg-red-400' :
                    event.severity === 'warning' ? 'bg-yellow-400' :
                    event.severity === 'success' ? 'bg-green-400' : 'bg-blue-400'
                  }`} />
                  <div>
                    <p className="text-white text-sm">{event.message}</p>
                    <p className="text-gray-400 text-xs">{event.time}</p>
                  </div>
                </div>
                <Badge variant={
                  event.severity === 'error' ? 'destructive' :
                  event.severity === 'warning' ? 'default' :
                  event.severity === 'success' ? 'secondary' : 'outline'
                }>
                  {event.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Security Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Manual security operations and controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Shield className="w-4 h-4 mr-2" />
              Run Audit
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Lock className="w-4 h-4 mr-2" />
              Full Harden
            </Button>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              <Eye className="w-4 h-4 mr-2" />
              View Reports
            </Button>
            <Button className="bg-red-600 hover:bg-red-700">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Lockdown
            </Button>
          </div>

          <div className="mt-4 p-4 bg-gray-900 rounded-lg">
            <h4 className="text-white font-medium mb-2">System Information</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p><strong>Security Level:</strong> High Compliance</p>
              <p><strong>Firewall:</strong> UFW + Fail2Ban Active</p>
              <p><strong>Monitoring:</strong> SIEM + Audit Logging</p>
              <p><strong>Encryption:</strong> AES-256 + TLS 1.3</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}