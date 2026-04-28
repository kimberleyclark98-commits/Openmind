import { NextRequest, NextResponse } from 'next/server';
import { generateCodeOptimized, recordPerformance, type CodeGenerationInput } from '@/ai/performance-optimizer';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let cacheHit = false;

  try {
    const body = await request.json() as CodeGenerationInput;

    // Validate required fields
    if (!body.prompt || !body.language) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and language' },
        { status: 400 }
      );
    }

    // Generate code using optimized Lightning Code Generator
    const result = await generateCodeOptimized(body);

    // Record performance (cache hit detection would need to be implemented in optimizer)
    recordPerformance(startTime, cacheHit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lightning Code Generation Error:', error);
    recordPerformance(startTime, false);
    return NextResponse.json(
      { error: 'Failed to generate code. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Lightning Code Generator',
    version: '1.0.0'
  });
}