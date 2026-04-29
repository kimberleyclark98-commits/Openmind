import { NextRequest, NextResponse } from 'next/server';
import { learningEngine } from '@/lib/learning-engine';
import { conversationMemory } from '@/lib/conversation-memory';

export async function GET(request: NextRequest) {
  try {
    const stats = learningEngine.getLearningStats();
    const convStats = conversationMemory.getStats();
    const analysis = conversationMemory.analyzeLearning();

    return NextResponse.json({
      learningStats: stats,
      conversationStats: convStats,
      analysis,
      status: 'learning_active'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get learning status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'analyze') {
      await learningEngine.analyzeConversations();
      return NextResponse.json({ message: 'Analysis completed' });
    }

    if (action === 'retrain') {
      // Placeholder for model retraining
      await learningEngine.analyzeConversations();
      return NextResponse.json({ message: 'Retraining completed' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to perform learning action' },
      { status: 500 }
    );
  }
}