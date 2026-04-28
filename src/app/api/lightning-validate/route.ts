import { NextRequest, NextResponse } from 'next/server';
import { validateCodeWithLanguageSupport, type CodeValidationInput } from '@/ai/flows/code-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CodeValidationInput;

    // Validate required fields
    if (!body.code || !body.language) {
      return NextResponse.json(
        { error: 'Missing required fields: code and language' },
        { status: 400 }
      );
    }

    // Validate and correct code
    const result = await validateCodeWithLanguageSupport(
      body.code,
      body.language,
      body.context,
      body.requirements
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Code Validation Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate code. Please try again.' },
      { status: 500 }
    );
  }
}