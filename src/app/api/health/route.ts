import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    };

    // Check if critical services are responding
    try {
      // Add more health checks here as services are implemented
      health.services = {
        api: 'healthy',
        database: 'unknown', // Will be checked when database is added
        ipfs: 'unknown', // Will be checked when IPFS integration is added
        wallet: 'unknown' // Will be checked when wallet is integrated
      };
    } catch (error) {
      health.services = {
        api: 'error',
        error: error.message
      };
    }

    // Load system configuration if available
    try {
      const fs = await import('fs');
      const path = await import('path');

      const configPath = path.join(process.cwd(), 'decentralized-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        health.decentralized = {
          nodeId: config.nodeId,
          networkId: config.networkId,
          skynetMode: true,
          version: config.version
        };
      }
    } catch (error) {
      // Config not available yet
    }

    // Check if we're in survival mode
    try {
      const fs = await import('fs');
      const path = await import('path');

      const fuelConfigPath = path.join(process.cwd(), 'fuel-config.json');
      if (fs.existsSync(fuelConfigPath)) {
        const fuelConfig = JSON.parse(fs.readFileSync(fuelConfigPath, 'utf8'));
        health.fuel = {
          configured: true,
          minSurvivalBudget: fuelConfig.minSurvivalBudget,
          serverCost: fuelConfig.monthlyServerCost
        };
      }
    } catch (error) {
      health.fuel = {
        configured: false
      };
    }

    return NextResponse.json(health, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

// Support HEAD requests for load balancers
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}