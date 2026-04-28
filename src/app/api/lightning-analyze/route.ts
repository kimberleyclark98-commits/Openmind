import { NextRequest, NextResponse } from 'next/server';
import { analyzeProject, type ProjectAnalysisInput } from '@/ai/flows/project-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ProjectAnalysisInput;

    // Validate required fields
    if (!body.projectPath) {
      return NextResponse.json(
        { error: 'Missing required field: projectPath' },
        { status: 400 }
      );
    }

    // Analyze project
    const result = await analyzeProject(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Project Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze project. Please try again.' },
      { status: 500 }
    );
  }
}