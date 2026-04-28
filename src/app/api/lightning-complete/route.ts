import { NextRequest, NextResponse } from 'next/server';
import { getCodeCompletionsOptimized, recordPerformance, type CodeCompletionInput } from '@/ai/performance-optimizer';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json() as CodeCompletionInput;

    // Validate required fields
    if (!body.prefix || !body.language) {
      return NextResponse.json(
        { error: 'Missing required fields: prefix and language' },
        { status: 400 }
      );
    }

    // Get optimized code completions
    const result = await getCodeCompletionsOptimized(body);

    // Record performance
    recordPerformance(startTime, false); // Cache hit detection not implemented yet

    return NextResponse.json(result);
  } catch (error) {
    console.error('Code Completion Error:', error);
    recordPerformance(startTime, false);
    return NextResponse.json(
      { error: 'Failed to get completions. Please try again.' },
      { status: 500 }
    );
  }
}