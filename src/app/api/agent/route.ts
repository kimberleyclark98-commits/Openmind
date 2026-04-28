import { NextRequest, NextResponse } from 'next/server';
import { autonomousAgent, type AutonomousAgentInput } from '@/ai/flows/autonomous-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context, actionType } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const input: AutonomousAgentInput = {
      query,
      context: context || undefined,
      actionType: actionType || 'query'
    };

    const result = await autonomousAgent(input);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process agent request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return agent status
  return NextResponse.json({
    status: 'active',
    capabilities: [
      'query_answering',
      'decision_making',
      'action_logging',
      'system_monitoring',
      'fuel_management'
    ],
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}