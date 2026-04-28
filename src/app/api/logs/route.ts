import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lines = parseInt(searchParams.get('lines') || '50');
    const level = searchParams.get('level') || 'all'; // error, warn, info, debug, all

    // For now, return mock logs - will be enhanced to read from actual log files
    const mockLogs = [
      { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'INFO', message: 'System initialized successfully', pid: 1234 },
      { timestamp: new Date(Date.now() - 20000).toISOString(), level: 'INFO', message: 'Health check passed', pid: 1234 },
      { timestamp: new Date(Date.now() - 30000).toISOString(), level: 'INFO', message: 'Agent interaction logged', pid: 1234 },
      { timestamp: new Date(Date.now() - 40000).toISOString(), level: 'WARN', message: 'Memory usage approaching limit', pid: 1234 },
      { timestamp: new Date(Date.now() - 50000).toISOString(), level: 'INFO', message: 'Fuel transaction processed', pid: 1234 },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'DEBUG', message: 'Container health check completed', pid: 1234 },
      { timestamp: new Date(Date.now() - 70000).toISOString(), level: 'INFO', message: 'Migration monitor active', pid: 1234 },
      { timestamp: new Date(Date.now() - 80000).toISOString(), level: 'ERROR', message: 'Failed to connect to external service', pid: 1234 },
      { timestamp: new Date(Date.now() - 90000).toISOString(), level: 'INFO', message: 'Security scan completed', pid: 1234 },
      { timestamp: new Date(Date.now() - 100000).toISOString(), level: 'WARN', message: 'High CPU usage detected', pid: 1234 },
    ];

    // Filter by level if specified
    let filteredLogs = mockLogs;
    if (level !== 'all') {
      filteredLogs = mockLogs.filter(log => log.level.toLowerCase() === level.toLowerCase());
    }

    // Limit to requested number of lines
    const recentLogs = filteredLogs.slice(-lines);

    // Try to read from actual log files if they exist
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.log')).sort().reverse();

      if (logFiles.length > 0) {
        const latestLogFile = path.join(logsDir, logFiles[0]);
        const content = fs.readFileSync(latestLogFile, 'utf8');
        const logLines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

        const realLogs = logLines.slice(-lines).map(line => {
          try {
            return JSON.parse(line);
          } catch {
            // If not JSON, create a basic log entry
            return {
              timestamp: new Date().toISOString(),
              level: 'INFO',
              message: line,
              pid: process.pid,
              raw: true
            };
          }
        });

        // Combine real and mock logs, but prioritize real logs
        const combinedLogs = [...realLogs, ...recentLogs].slice(-lines);
        return NextResponse.json(combinedLogs, { status: 200 });
      }
    } catch (error) {
      // Ignore file read errors, use mock data
    }

    return NextResponse.json(recentLogs, { status: 200 });

  } catch (error) {
    console.error('Logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}