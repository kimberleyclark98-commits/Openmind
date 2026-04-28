import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkRateLimit, statusRateLimiter } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request, statusRateLimiter, 'status');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    // Load decentralized config if available
    let decentralizedStatus = null;
    const configPath = path.join(process.cwd(), 'decentralized-config.json');

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      decentralizedStatus = {
        nodeId: config.nodeId,
        networkId: config.networkId,
        version: config.version,
        skynetMode: true
      };
    }

    const status = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        chat: 'active',
        learning: 'active',
        models: 'active',
        api: 'active'
      },
      decentralized: decentralizedStatus,
      health: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    return NextResponse.json(status, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Status check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}