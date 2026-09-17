import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    
    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }

    const history = await prisma.ai_chat_history.findMany({
      where: { 
        user_id: uid,
        thread_id: threadId
      },
      orderBy: { created_at: 'asc' },
    });

    const messages = history.map((h: any) => ({
      role: h.role,
      content: h.content,
    }));

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Failed to fetch chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const envKeys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [process.env.GOOGLE_GENERATIVE_AI_API_KEY].filter(Boolean);
    const { messages, threadId, customApiKey } = await req.json();

    let apiKeys = envKeys;
    if (customApiKey && customApiKey.trim() !== '') {
      apiKeys = [customApiKey.trim()];
    }

    if (!apiKeys || apiKeys.length === 0 || apiKeys[0] === 'your-api-key-here') {
      return NextResponse.json({ error: 'API key is missing or invalid' }, { status: 500 });
    }
    
    if (threadId && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.role === 'user') {
        try {
          await prisma.ai_chat_history.create({
            data: {
              thread_id: threadId,
              user_id: uid,
              role: 'user',
              content: latestMessage.content
            }
          });
        } catch(e) {
          console.error("Error saving user message to history:", e);
        }
      }
    }

    const contents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    let userContext = "the user";
    if (user.firstname) {
      userContext = `${user.firstname} ${user.lastname || ''}`.trim();
      if (user.type === 1) userContext += ' (Administrator)';
      else if (user.type === 2) userContext += ' (Staff)';
    }

    const systemPromptText = `You are a helpful AI assistant integrated into a dashboard called HaiMotion. Your job is to assist ${userContext} with their business tasks, code, data analysis, or anything they need. Always be polite and occasionally address them by their name. If the user asks you to generate, create, or show an image/photo, you MUST reply with a markdown image using this EXACT format on a new line: \`![deskripsi gambar bahasa inggris](https://image.pollinations.ai/prompt/DESKRIPSI_GAMBAR_BAHASA_INGGRIS_DENGAN_UNDERSCORE?width=3840&height=2160&nologo=true&model=flux)\`. Do not say you cannot generate images. Just return the markdown.`;

    let response;
    let success = false;
    let lastErrorText = "";

    // Try keys sequentially or randomly. Here we try all available keys one by one until success.
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      if (!apiKey) continue;

      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          system_instruction: { parts: [{ text: systemPromptText }] },
          contents 
        })
      });

      if (response.ok) {
        success = true;
        break;
      } else {
        const errText = await response.text();
        lastErrorText = errText;
        console.warn(`[Gemini API] Key index ${i} failed with status ${response.status}:`, errText);
        
        // If it's a 429 Quota Exceeded or 503 Service Unavailable, try the next one
        if ((response.status === 429 || response.status === 503) && i < apiKeys.length - 1) {
          continue;
        } else {
          break; // Other errors or no more keys, stop retrying
        }
      }
    }

    if (!success || !response) {
      return NextResponse.json({ error: `Gemini API error: ${lastErrorText}` }, { status: response?.status || 500 });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
