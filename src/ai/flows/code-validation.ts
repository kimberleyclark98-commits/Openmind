'use server';
/**
 * @fileOverview Error Detection and Correction System
 *
 * Detects syntax errors, logical issues, and provides corrections
 * for generated code to ensure high accuracy.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getLanguageConfig } from '@/ai/language-config';

const CodeValidationInputSchema = z.object({
  code: z.string().describe('Code to validate'),
  language: z.string().describe('Programming language'),
  context: z.string().optional().describe('Code context for validation'),
  requirements: z.array(z.string()).optional().describe('Requirements to check against'),
});

export type CodeValidationInput = z.infer<typeof CodeValidationInputSchema>;

const CodeValidationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the code is syntactically and logically correct'),
  errors: z.array(z.object({
    type: z.enum(['syntax', 'logic', 'style', 'security', 'performance']).describe('Error type'),
    severity: z.enum(['error', 'warning', 'info']).describe('Error severity'),
    line: z.number().optional().describe('Line number where error occurs'),
    message: z.string().describe('Error description'),
    suggestion: z.string().describe('Suggested fix'),
  })).describe('List of detected issues'),
  correctedCode: z.string().optional().describe('Corrected version of the code'),
  confidence: z.number().min(0).max(1).describe('Confidence in the validation'),
});

export type CodeValidationOutput = z.infer<typeof CodeValidationOutputSchema>;

export async function validateAndCorrectCode(
  input: CodeValidationInput
): Promise<CodeValidationOutput> {
  return codeValidationFlow(input);
}

const codeValidationPrompt = ai.definePrompt({
  name: 'codeValidationPrompt',
  input: { schema: CodeValidationInputSchema },
  output: { schema: CodeValidationOutputSchema },
  prompt: `You are an expert Code Validator and Corrector for the Lightning Code Generator.

Your task is to thoroughly analyze code for:
- Syntax errors and compilation issues
- Logical errors and bugs
- Style and convention violations
- Security vulnerabilities
- Performance issues
- Best practice violations

**Code to Validate:**
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

**Language:** {{{language}}}
{{#if context}}
**Context:**
\`\`\`
{{{context}}}
\`\`\`
{{/if}}

{{#if requirements}}
**Requirements to Check:**
{{#each requirements}}
- {{{this}}}
{{/each}}
{{/if}}

**Validation Guidelines:**
1. **Syntax Check**: Ensure code compiles without syntax errors
2. **Logic Check**: Verify logical correctness and edge cases
3. **Style Check**: Follow language-specific conventions
4. **Security Check**: Identify potential security issues
5. **Performance Check**: Flag performance bottlenecks
6. **Requirements Check**: Ensure code meets specified requirements

**Error Classification:**
- **error**: Must be fixed (syntax errors, critical bugs)
- **warning**: Should be fixed (style issues, potential bugs)
- **info**: Optional improvements (optimizations, best practices)

For each error, provide:
- Clear description of the issue
- Specific line number if applicable
- Actionable suggestion for fixing
- Code example if helpful

If corrections are needed, provide a fully corrected version of the code.

Response format: {{jsonSchema output.schema}}`,
});

const codeValidationFlow = ai.defineFlow(
  {
    name: 'codeValidationFlow',
    inputSchema: CodeValidationInputSchema,
    outputSchema: CodeValidationOutputSchema,
  },
  async (input) => {
    const { output } = await codeValidationPrompt(input);
    if (!output) {
      throw new Error('Failed to validate code.');
    }
    return output;
  }
);

// Utility function to validate code with language-specific checks
export async function validateCodeWithLanguageSupport(
  code: string,
  language: string,
  context?: string,
  requirements?: string[]
): Promise<CodeValidationOutput> {
  const langConfig = getLanguageConfig(language);

  // Add language-specific validation requirements
  const enhancedRequirements = [
    ...(requirements || []),
    ...(langConfig?.bestPractices.map(practice => `Follow best practice: ${practice}`) || []),
    `Use ${langConfig?.conventions.naming.variables} for variables`,
    `Use ${langConfig?.conventions.naming.functions} for functions`,
    `Use ${langConfig?.conventions.naming.classes} for classes`,
  ];

  return validateAndCorrectCode({
    code,
    language,
    context,
    requirements: enhancedRequirements,
  });
}