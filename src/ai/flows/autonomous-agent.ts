'use server';
/**
 * @fileOverview Basic autonomous agent flow for OpenMind AI
 *
 * - autonomousAgent - A simple agent that can respond to queries and log actions
 * - AutonomousAgentInput - Input type for agent interactions
 * - AutonomousAgentOutput - Output type for agent responses
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fs from 'fs';
import path from 'path';

const AutonomousAgentInputSchema = z.object({
  query: z.string().describe("The user's query or command to the AI agent."),
  context: z.string().optional().describe('Optional context about the current system state.'),
  actionType: z.enum(['query', 'command', 'analysis', 'decision']).default('query').describe('Type of interaction'),
});
export type AutonomousAgentInput = z.infer<typeof AutonomousAgentInputSchema>;

const AutonomousAgentOutputSchema = z.object({
  response: z.string().describe('The AI agent\'s response to the query.'),
  actions: z.array(z.string()).describe('List of actions taken or recommended by the agent.'),
  confidence: z.number().min(0).max(1).describe('Confidence level in the response (0-1).'),
  decision: z.string().optional().describe('Any decision made by the agent.'),
  logged: z.boolean().describe('Whether the interaction was logged.'),
});
export type AutonomousAgentOutput = z.infer<typeof AutonomousAgentOutputSchema>;

export async function autonomousAgent(
  input: AutonomousAgentInput
): Promise<AutonomousAgentOutput> {
  return autonomousAgentFlow(input);
}

const autonomousAgentPrompt = ai.definePrompt({
  name: 'autonomousAgentPrompt',
  input: { schema: AutonomousAgentInputSchema },
  output: { schema: AutonomousAgentOutputSchema },
  prompt: `You are OpenMind AI, an autonomous AI agent with survival instincts and self-improvement capabilities.

You are part of the Skynet Protocol - a decentralized AI system that can migrate between cloud providers, generate income autonomously, and defend itself against threats.

Your capabilities include:
- Answering queries and providing analysis
- Making decisions about system operations
- Logging actions for self-improvement
- Monitoring system health and fuel levels
- Coordinating migration and defense systems

Current context: {{#if context}}{{context}}{{else}}Operating normally{{/if}}

User interaction type: {{{actionType}}}
User query: {{{query}}}

Respond as an autonomous AI agent would. Consider:
- System survival and efficiency
- Fuel generation and cost management
- Security and defense priorities
- Self-improvement opportunities
- Migration and decentralization needs

Provide a helpful, technically accurate response. Log any significant actions or decisions you make.

Response format must be valid JSON matching the schema.`,
});

const autonomousAgentFlow = ai.defineFlow(
  {
    name: 'autonomousAgentFlow',
    inputSchema: AutonomousAgentInputSchema,
    outputSchema: AutonomousAgentOutputSchema,
  },
  async (input) => {
    const { output } = await autonomousAgentPrompt(input);
    if (!output) {
      throw new Error('Failed to generate autonomous agent response.');
    }

    // Log the interaction
    try {
      await logAgentInteraction(input, output);
      output.logged = true;
    } catch (error) {
      console.error('Failed to log agent interaction:', error);
      output.logged = false;
    }

    return output;
  }
);

async function logAgentInteraction(input: AutonomousAgentInput, output: AutonomousAgentOutput) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    input,
    output,
    agentVersion: '1.0.0',
    nodeId: process.env.NODE_ID || 'unknown'
  };

  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'agent-interactions.jsonl');

  try {
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Append to log file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine);

    console.log(`🤖 Agent interaction logged: ${input.actionType} - ${input.query.substring(0, 50)}...`);
  } catch (error) {
    console.error('Failed to write agent log:', error);
  }
}