import { NextRequest, NextResponse } from 'next/server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { conversationMemory } from '@/lib/conversation-memory';

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env' },
        { status: 500 }
      );
    }

    // Build messages array with history
    const messages = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      })),
      {
        role: 'user' as const,
        content: [{ text: message }],
      },
    ];

    // Stream response from Gemini
    const { stream, response } = await ai.generateStream({
      model: 'googleai/gemini-2.0-flash',
      system: `Bạn là OpenMind AI - một trợ lý AI thông minh, thân thiện và hữu ích.
Bạn trả lời bằng ngôn ngữ mà người dùng đang dùng (tiếng Việt hoặc tiếng Anh).
Bạn có thể giúp đỡ về lập trình, phân tích, sáng tạo, và nhiều lĩnh vực khác.
Hãy trả lời ngắn gọn, rõ ràng và chính xác.`,
      messages,
    });

    let fullResponse = '';
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          // Store conversation after streaming completes
          try {
            await conversationMemory.storeConversation({
              userId: request.headers.get('x-user-id') || 'anonymous',
              userMessage: message,
              aiResponse: fullResponse,
              metadata: {
                language: message.match(/[^\x00-\x7F]/) ? 'vi' : 'en', // Simple language detection
              }
            });
          } catch (storeError) {
            console.error('Failed to store conversation:', storeError);
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi server' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
