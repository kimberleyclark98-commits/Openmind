import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_SERVER_ERROR = 500;
const MAX_OUTPUT_TOKENS = 2048;
const GEMINI_TEMPERATURE = 0.7;

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiChunk {
  candidates?: GeminiCandidate[];
}

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: HTTP_BAD_REQUEST });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY chưa được cấu hình' },
        { status: HTTP_SERVER_ERROR }
      );
    }

    // Build contents for Gemini API
    const contents = [
      ...history.map((msg: ChatMessage) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    // Call Gemini REST API directly
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: `Bạn là OpenMind AI - trợ lý AI thông minh, thân thiện và hữu ích.
Trả lời bằng ngôn ngữ người dùng đang dùng (tiếng Việt hoặc tiếng Anh).
Giúp đỡ về lập trình, phân tích, sáng tạo, và nhiều lĩnh vực khác.
Trả lời ngắn gọn, rõ ràng và chính xác.`
            }]
          },
          contents,
          generationConfig: {
            temperature: GEMINI_TEMPERATURE,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: 'Lỗi kết nối Gemini API' }, { status: HTTP_SERVER_ERROR });
    }

    // Stream the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed: GeminiChunk = JSON.parse(data);
                  const candidates = parsed?.candidates;
                  const parts = candidates?.[0]?.content?.parts;
                  const text = parts?.[0]?.text;
                  if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                } catch {
                  // Skip malformed chunks
                }
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
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

  } catch (err) {
    const error = err instanceof Error ? err.message : 'Lỗi server';
    console.error('Chat API error:', err);
    return NextResponse.json({ error }, { status: HTTP_SERVER_ERROR });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: HTTP_OK,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
