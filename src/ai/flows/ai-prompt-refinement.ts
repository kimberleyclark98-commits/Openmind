'use server';
/**
 * @fileOverview This file defines a Genkit flow for prompt refinement.
 *
 * - refinePrompt - A function that refines a user's prompt, provides suggestions, and generates example prompts.
 * - AiPromptRefinementInput - The input type for the refinePrompt function.
 * - AiPromptRefinementOutput - The return type for the refinePrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiPromptRefinementInputSchema = z.object({
  userPrompt: z.string().describe("The user's initial prompt to be refined."),
  context: z.string().optional().describe('Optional context or desired output from the prompt. This helps in tailoring the refinement.'),
  targetLLM: z.string().optional().describe('Optional name or type of the target LLM for which the prompt is being refined. This allows for LLM-specific refinements.'),
});
export type AiPromptRefinementInput = z.infer<typeof AiPromptRefinementInputSchema>;

const AiPromptRefinementOutputSchema = z.object({
  refinedPrompt: z.string().describe('The improved and refined version of the user prompt, optimized for clarity, conciseness, and effectiveness.'),
  suggestions: z.array(z.string()).describe('A list of specific and actionable suggestions (2-3) for further improving the prompt or adapting it to different scenarios.'),
  examplePrompts: z.array(z.string()).describe('A list of distinct example prompts (2-3) that demonstrate various ways to use the `refinedPrompt` effectively.'),
});
export type AiPromptRefinementOutput = z.infer<typeof AiPromptRefinementOutputSchema>;

export async function refinePrompt(
  input: AiPromptRefinementInput
): Promise<AiPromptRefinementOutput> {
  return aiPromptRefinementFlow(input);
}

const aiPromptRefinementPrompt = ai.definePrompt({
  name: 'aiPromptRefinementPrompt',
  input: { schema: AiPromptRefinementInputSchema },
  output: { schema: AiPromptRefinementOutputSchema },
  prompt: `You are an expert prompt engineer specializing in crafting effective prompts for Large Language Models (LLMs).
Your task is to take a user's initial prompt, refine it for clarity, conciseness, and effectiveness, and provide suggestions for further improvement.
Additionally, you should generate a few example prompts based on the refined prompt to demonstrate its usage.

When refining the prompt, consider the following:
- Make it clear, specific, and unambiguous.
- Ensure it asks for the desired output format or type.
- Incorporate any provided context or target LLM characteristics.
- Avoid leading questions unless explicitly intended.

Initial Prompt:
\`\`\`
{{{userPrompt}}}
\`\`\`

{{#if context}}Context/Desired Output:
\`\`\`
{{{context}}}
\`\`\`
{{/if}}

{{#if targetLLM}}Target LLM: {{{targetLLM}}}{{/if}}

Please provide your response in JSON format, strictly adhering to the following structure:
{{jsonSchema output.schema}}
`,
});

const aiPromptRefinementFlow = ai.defineFlow(
  {
    name: 'aiPromptRefinementFlow',
    inputSchema: AiPromptRefinementInputSchema,
    outputSchema: AiPromptRefinementOutputSchema,
  },
  async (input) => {
    const { output } = await aiPromptRefinementPrompt(input);
    if (!output) {
      throw new Error('Failed to generate prompt refinement output.');
    }
    return output;
  }
);
