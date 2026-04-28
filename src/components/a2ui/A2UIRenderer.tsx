'use client';

import React, { useEffect, useState } from 'react';
import { a2uiMemory } from '@/lib/a2ui/memory';

interface A2UIMessage {
  createSurface?: any;
  updateComponents?: any;
  updateDataModel?: any;
  deleteSurface?: any;
}

interface A2UIRendererProps {
  stream: string[]; // Mảng các dòng JSON từ stream
  surfaceId?: string; // Optional surface ID for memory tracking
  onInteraction?: (componentId: string, action: string, data?: any) => void;
}

export default function A2UIRenderer({ stream, surfaceId, onInteraction }: A2UIRendererProps) {
  const [messages, setMessages] = useState<A2UIMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parsed: A2UIMessage[] = [];

    for (const line of stream) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line.trim());
        parsed.push(msg);
      } catch (e) {
        console.warn('Invalid JSON line:', line);
      }
    }

    setMessages(parsed);

    // Store surface in memory if surfaceId is provided
    if (surfaceId && parsed.length > 0) {
      const createSurfaceMsg = parsed.find(msg => msg.createSurface);
      if (createSurfaceMsg) {
        a2uiMemory.storeSurface(surfaceId, {
          title: createSurfaceMsg.createSurface.title || 'A2UI Surface',
          description: createSurfaceMsg.createSurface.description,
          category: 'generated'
        });
      }
    }
  }, [stream, surfaceId]);

  // Record user interactions
  const recordInteraction = (componentId: string, action: string, data?: any) => {
    if (surfaceId) {
      a2uiMemory.recordInteraction(surfaceId, {
        componentId,
        action,
        data,
        context: 'user_interaction'
      });
    }

    // Call external interaction handler if provided
    if (onInteraction) {
      onInteraction(componentId, action, data);
    }
  };

  if (error) {
    return <div className="text-red-500 p-4">A2UI Error: {error}</div>;
  }

  return (
    <div className="a2ui-container min-h-[600px] bg-black border border-cyan-500/30 rounded-xl overflow-hidden relative">
      {/* Matrix rain background nhẹ */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,255,200,0.03)_50%)] bg-[length:100%_4px]" />

      <div className="relative z-10 p-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            OpenMind đang suy nghĩ...<br />
            <span className="text-xs">Waiting for A2UI stream...</span>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className="mb-6">
            {msg.createSurface && (
              <div className="text-cyan-400 text-sm mb-2">→ Creating Surface: {msg.createSurface.surfaceId}</div>
            )}
            {msg.updateComponents && (
              <div className="border-l-2 border-purple-500 pl-4">
                <div className="text-purple-400 text-sm">Updating UI Components</div>
                <pre className="text-xs text-gray-400 mt-2 overflow-auto max-h-96">
                  {JSON.stringify(msg.updateComponents, null, 2)}
                </pre>
              </div>
            )}
            {msg.updateDataModel && (
              <div className="text-lime-400 text-sm">
                → Updating Data Model at path: {msg.updateDataModel.path}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}