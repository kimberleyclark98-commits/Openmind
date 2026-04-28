'use server';
/**
 * @fileOverview Intelligent Code Completion System
 *
 * Provides real-time code completion suggestions with high accuracy
 * and context awareness for lightning-fast development.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CodeCompletionInputSchema = z.object({
  prefix: z.string().describe('Code before cursor position'),
  suffix: z.string().optional().describe('Code after cursor position'),
  language: z.string().describe('Programming language'),
  filePath: z.string().optional().describe('Current file path'),
  projectContext: z.string().optional().describe('Project context and patterns'),
  cursorPosition: z.object({
    line: z.number(),
    column: z.number(),
  }).optional().describe('Cursor position information'),
});

export type CodeCompletionInput = z.infer<typeof CodeCompletionInputSchema>;

const CodeCompletionOutputSchema = z.object({
  suggestions: z.array(z.object({
    code: z.string().describe('Suggested code completion'),
    confidence: z.number().min(0).max(1).describe('Confidence score'),
    type: z.enum(['completion', 'function', 'class', 'import', 'statement']).describe('Suggestion type'),
    description: z.string().optional().describe('Brief description of the suggestion'),
  })).describe('Array of completion suggestions'),
  bestMatch: z.string().optional().describe('Best suggestion for direct insertion'),
});

export type CodeCompletionOutput = z.infer<typeof CodeCompletionOutputSchema>;

export async function getCodeCompletions(
  input: CodeCompletionInput
): Promise<CodeCompletionOutput> {
  return intelligentCodeCompletionFlow(input);
}

const intelligentCodeCompletionPrompt = ai.definePrompt({
  name: 'intelligentCodeCompletionPrompt',
  input: { schema: CodeCompletionInputSchema },
  output: { schema: CodeCompletionOutputSchema },
  prompt: `You are an Intelligent Code Completion AI, providing ultra-fast and accurate code suggestions like GitHub Copilot but with enhanced context awareness.

Analyze the code context and provide the most relevant completions with high accuracy.

**Code Context:**
\`\`\`{{{language}}}
{{{prefix}}}{{cursor}} {{{suffix}}}
\`\`\`

**Language:** {{{language}}}
{{#if filePath}}
**File:** {{{filePath}}}
{{/if}}
{{#if projectContext}}
**Project Context:** {{{projectContext}}}
{{/if}}
{{#if cursorPosition}}
**Cursor Position:** Line {{{cursorPosition.line}}}, Column {{{cursorPosition.column}}}
{{/if}}

**Guidelines:**
- Provide 3-5 highly relevant suggestions
- Focus on syntactically correct and contextually appropriate completions
- Consider project patterns and conventions
- Include confidence scores based on context match
- Prioritize completions that continue the current logical flow
- For functions/classes, include proper signatures
- For imports, suggest commonly used modules

Generate completions that a developer would expect from an advanced AI coding assistant.

Response format: {{jsonSchema output.schema}}`,
});

const intelligentCodeCompletionFlow = ai.defineFlow(
  {
    name: 'intelligentCodeCompletionFlow',
    inputSchema: CodeCompletionInputSchema,
    outputSchema: CodeCompletionOutputSchema,
  },
  async (input) => {
    const { output } = await intelligentCodeCompletionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate code completion suggestions.');
    }
    return output;
  }
);