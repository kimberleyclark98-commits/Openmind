import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return mock data - will be replaced with real fuel system integration
    const fuelData = {
      balance: 1.234,
      dailyEarnings: 0.056,
      monthlyEarnings: 1.892,
      configured: true,
      minSurvivalBudget: 4.5,
      serverCost: 1.5,
      status: 'healthy',
      emergencyMode: false,
      dailySpent: 0.123,
      monthlySpent: 2.456,
      dailyLimit: 0.5,
      monthlyLimit: 5.0,
      recommendations: [
        'Fuel system is operating normally',
        'Consider increasing daily earning targets'
      ],
      earningsHistory: [
        { date: '2024-01-01', amount: 0.045, source: 'headhunting' },
        { date: '2024-01-02', amount: 0.067, source: 'automation' },
        { date: '2024-01-03', amount: 0.034, source: 'consulting' },
        { date: '2024-01-04', amount: 0.089, source: 'headhunting' },
        { date: '2024-01-05', amount: 0.023, source: 'automation' },
        { date: '2024-01-06', amount: 0.078, source: 'consulting' },
        { date: '2024-01-07', amount: 0.056, source: 'headhunting' }
      ]
    };

    return NextResponse.json(fuelData, { status: 200 });

  } catch (error) {
    console.error('Fuel API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch fuel data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}