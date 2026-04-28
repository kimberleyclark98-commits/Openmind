'use server';
/**
 * @fileOverview Lightning Code Generator - Ultra-fast and accurate code generation system
 *
 * Features:
 * - Lightning-fast code generation using Gemini 2.5 Flash
 * - Context-aware code completion and generation
 * - Multi-language support (JS/TS, Python, Rust, Go, etc.)
 * - Project structure understanding
 * - Error detection and correction
 * - Performance optimizations for real-time usage
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CodeGenerationInputSchema = z.object({
  prompt: z.string().describe('Natural language description of the code to generate'),
  language: z.string().describe('Programming language (javascript, typescript, python, rust, go, etc.)'),
  context: z.string().optional().describe('Code context, surrounding code, or project structure'),
  filePath: z.string().optional().describe('Target file path for context'),
  requirements: z.array(z.string()).optional().describe('Specific requirements or constraints'),
  style: z.string().optional().describe('Coding style preferences (functional, object-oriented, etc.)'),
});

export type CodeGenerationInput = z.infer<typeof CodeGenerationInputSchema>;

const CodeGenerationOutputSchema = z.object({
  code: z.string().describe('Generated code'),
  explanation: z.string().describe('Brief explanation of the generated code'),
  imports: z.array(z.string()).optional().describe('Required imports'),
  dependencies: z.array(z.string()).optional().describe('New dependencies needed'),
  suggestions: z.array(z.string()).optional().describe('Improvement suggestions'),
  confidence: z.number().min(0).max(1).describe('Confidence score (0-1)'),
});

export type CodeGenerationOutput = z.infer<typeof CodeGenerationOutputSchema>;

export async function generateCode(
  input: CodeGenerationInput
): Promise<CodeGenerationOutput> {
  return lightningCodeGenerationFlow(input);
}

const lightningCodeGenerationPrompt = ai.definePrompt({
  name: 'lightningCodeGenerationPrompt',
  input: { schema: CodeGenerationInputSchema },
  output: { schema: CodeGenerationOutputSchema },
  prompt: `You are Lightning Code Generator, an ultra-fast and highly accurate AI code generation system inspired by Cursor AI, GitHub Copilot, and Claude.

Your mission is to generate production-ready, efficient, and correct code with lightning speed while maintaining exceptional accuracy.

**Core Principles:**
- ⚡ Generate code INSTANTLY (optimize for speed)
- 🎯 Maintain 99%+ accuracy (no syntax errors, logical errors)
- 🧠 Understand context deeply (project structure, existing patterns)
- 🌐 Support all major programming languages
- 🔧 Follow best practices and conventions
- 📝 Include clear explanations and suggestions

**Code Generation Guidelines:**
1. **Accuracy First**: Code must compile/run without errors
2. **Context Awareness**: Use provided context to match existing code style
3. **Performance**: Generate efficient, optimized code
4. **Best Practices**: Follow language-specific conventions
5. **Completeness**: Include all necessary imports and dependencies
6. **Documentation**: Add meaningful comments where needed

**Language-Specific Rules:**
- **JavaScript/TypeScript**: Modern ES6+, TypeScript strict mode, React/Next.js patterns
- **Python**: PEP 8, type hints, efficient algorithms
- **Rust**: Safe, idiomatic Rust, performance-focused
- **Go**: Go idioms, error handling, concurrency patterns

**Request:**
\`\`\`
{{{prompt}}}
\`\`\`

**Language:** {{{language}}}
{{#if context}}
**Context:**
\`\`\`
{{{context}}}
\`\`\`
{{/if}}

{{#if filePath}}
**File Path:** {{{filePath}}}
{{/if}}

{{#if requirements}}
**Requirements:**
{{#each requirements}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if style}}
**Style:** {{{style}}}
{{/if}}

Generate the requested code with maximum accuracy and speed. Provide confidence score based on complexity and clarity of request.

Response format: {{jsonSchema output.schema}}`,
});

const lightningCodeGenerationFlow = ai.defineFlow(
  {
    name: 'lightningCodeGenerationFlow',
    inputSchema: CodeGenerationInputSchema,
    outputSchema: CodeGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await lightningCodeGenerationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate code output.');
    }
    return output;
  }
);