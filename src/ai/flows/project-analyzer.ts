'use server';
/**
 * @fileOverview Project Context Analyzer for Lightning Code Generator
 *
 * Analyzes codebase structure, patterns, and conventions to provide
 * intelligent context for code generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProjectAnalysisInputSchema = z.object({
  projectPath: z.string().describe('Root path of the project to analyze'),
  targetLanguage: z.string().optional().describe('Primary programming language'),
  focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on (components, utils, api, etc.)'),
});

export type ProjectAnalysisInput = z.infer<typeof ProjectAnalysisInputSchema>;

const ProjectAnalysisOutputSchema = z.object({
  structure: z.object({
    framework: z.string().optional().describe('Main framework (Next.js, React, Express, etc.)'),
    architecture: z.string().optional().describe('Architecture pattern (MVC, component-based, etc.)'),
    languages: z.array(z.string()).describe('Programming languages used'),
    packageManager: z.string().optional().describe('Package manager (npm, yarn, pnpm)'),
  }).describe('Project structure analysis'),
  conventions: z.object({
    naming: z.string().optional().describe('Naming conventions (camelCase, PascalCase, etc.)'),
    fileStructure: z.string().optional().describe('File organization patterns'),
    imports: z.string().optional().describe('Import/export patterns'),
    styling: z.string().optional().describe('Styling approach (CSS modules, Tailwind, etc.)'),
  }).describe('Code conventions and patterns'),
  dependencies: z.array(z.string()).describe('Key dependencies and libraries'),
  patterns: z.array(z.string()).describe('Common patterns and practices observed'),
  recommendations: z.array(z.string()).describe('Recommendations for consistent code generation'),
});

export type ProjectAnalysisOutput = z.infer<typeof ProjectAnalysisOutputSchema>;

export async function analyzeProject(
  input: ProjectAnalysisInput
): Promise<ProjectAnalysisOutput> {
  return projectAnalysisFlow(input);
}

const projectAnalysisPrompt = ai.definePrompt({
  name: 'projectAnalysisPrompt',
  input: { schema: ProjectAnalysisInputSchema },
  output: { schema: ProjectAnalysisOutputSchema },
  prompt: `You are a Project Structure Analyst for the Lightning Code Generator.

Analyze the provided project structure and extract key information about:
- Framework and architecture
- Code conventions and patterns
- Dependencies and libraries
- File organization
- Naming conventions

Use this information to provide intelligent recommendations for code generation that matches the existing codebase perfectly.

**Project Path:** {{{projectPath}}}
{{#if targetLanguage}}
**Primary Language:** {{{targetLanguage}}}
{{/if}}
{{#if focusAreas}}
**Focus Areas:** {{#each focusAreas}}{{this}}, {{/each}}
{{/if}}

Analyze the project structure deeply and provide detailed insights for accurate code generation.

Response format: {{jsonSchema output.schema}}`,
});

const projectAnalysisFlow = ai.defineFlow(
  {
    name: 'projectAnalysisFlow',
    inputSchema: ProjectAnalysisInputSchema,
    outputSchema: ProjectAnalysisOutputSchema,
  },
  async (input) => {
    // In a real implementation, this would read actual project files
    // For now, we'll use AI analysis based on the project description
    const { output } = await projectAnalysisPrompt(input);
    if (!output) {
      throw new Error('Failed to analyze project structure.');
    }
    return output;
  }
);