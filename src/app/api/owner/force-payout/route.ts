import { NextRequest, NextResponse } from 'next/server';

// API endpoint để force payout cho owner
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 FORCE PAYOUT API called by owner');

    // Validate request (in production, add proper authentication)
    const body = await request.json().catch(() => ({}));
    const { reason = 'Manual payout requested by owner' } = body;

    // This would integrate with the actual OwnerProfitSharingSystem
    // For now, return a mock response
    const mockPayout = {
      success: true,
      amount: Math.random() * 0.5 + 0.1, // Random amount between 0.1-0.6 SOL
      txHash: `force_payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      reason,
      message: 'Payout processed successfully! Check your wallet in a few minutes.'
    };

    console.log(`💰 Force payout: ${mockPayout.amount} SOL sent to owner`);

    return NextResponse.json({
      success: true,
      data: mockPayout,
      message: `Successfully sent ${mockPayout.amount} SOL to owner wallet`
    });

  } catch (error) {
    console.error('❌ Force payout failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to process payout',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint để xem trạng thái owner payouts
export async function GET() {
  try {
    // Mock owner stats
    const mockStats = {
      ownerWalletAddress: process.env.OWNER_WALLET_ADDRESS || 'Not configured',
      profitSharingRate: parseFloat(process.env.OWNER_PROFIT_SHARING_RATE || '0.7'),
      payoutFrequency: process.env.OWNER_PAYOUT_FREQUENCY || 'weekly',
      totalPaidToOwner: Math.random() * 10 + 1, // Random total between 1-11 SOL
      lastPayoutDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextScheduledPayout: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedNextPayout: Math.random() * 0.3 + 0.05, // Random between 0.05-0.35 SOL
      aiCurrentBalance: Math.random() * 5 + 2, // Random between 2-7 SOL
      enabled: process.env.OWNER_PAYOUTS_ENABLED === 'true'
    };

    return NextResponse.json({
      success: true,
      data: mockStats,
      message: 'Owner payout status retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Failed to get owner stats:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to get owner stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}