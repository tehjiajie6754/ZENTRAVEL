import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use gemini-2.5-flash only for itinerary planning.
type ModelSpec = { name: string; tools: any[] };
const MODEL_CHAIN: ModelSpec[] = [
  { name: 'gemini-2.5-flash', tools: [{ googleSearch: {} }] },
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const isQuotaError = (err: any): boolean => {
  const msg = String(err?.message ?? err ?? '');
  return /\b429\b/.test(msg) || /quota|rate.?limit|exceeded/i.test(msg);
};

const isTransient = (err: any): boolean => {
  const msg = String(err?.message ?? err ?? '');
  return /\b(503|500|502|504)\b/.test(msg)
      || /Service Unavailable|overload|high demand|temporarily/i.test(msg);
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(apiKey);

    // Extract system prompt (if any)
    const systemMessage = messages.find((m: any) => m.role === 'system')?.content || '';

    // Everything except the system prompt and the final user message becomes prior chat history
    const chatHistory = messages
      .filter((m: any) => m.role !== 'system' && m !== messages[messages.length - 1])
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMessage = messages[messages.length - 1]?.content || '';
    // Re-assert the system instruction on every turn so the model always honours it.
    const composedRequest = systemMessage
      ? `[SYSTEM INSTRUCTION — FOLLOW STRICTLY]\n${systemMessage}\n\n[USER REQUEST]\n${lastMessage}`
      : lastMessage;

    // Try each model with a couple of retries before falling through.
    let lastErr: any = null;
    for (const spec of MODEL_CHAIN) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const model = genAI.getGenerativeModel({
            model: spec.name,
            tools: spec.tools,
          } as any);

          const chat = model.startChat({
            history: chatHistory,
            generationConfig: { temperature: 0.7 },
          });

          const result = await chat.sendMessage(composedRequest);
          const generatedText = result.response.text();

          return NextResponse.json({
            choices: [{ message: { role: 'assistant', content: generatedText } }],
            modelUsed: spec.name,
          });
        } catch (err: any) {
          lastErr = err;
          if (isQuotaError(err)) {
            // Quota exhausted — retrying won't help; skip to the next model immediately.
            console.warn(`[itinerary] ${spec.name} quota exceeded, skipping model:`, err?.message);
            break;
          }
          if (!isTransient(err)) {
            // Permanent error — don't retry this model, but try the next one.
            console.warn(`[itinerary] ${spec.name} permanent error:`, err?.message);
            break;
          }
          const backoff = 500 * Math.pow(2, attempt); // 0.5s, 1s, 2s
          console.warn(`[itinerary] ${spec.name} transient error (attempt ${attempt + 1}/3), backing off ${backoff}ms:`, err?.message);
          await sleep(backoff);
        }
      }
    }

    // All models exhausted
    console.error("Gemini SDK error (all models exhausted):", lastErr);
    const friendly = isTransient(lastErr)
      ? "Our AI planner is experiencing very high demand right now. Please try again in a minute."
      : (lastErr?.message || 'Unknown error');
    return NextResponse.json({ error: friendly }, { status: 503 });

  } catch (error: any) {
    console.error("Gemini SDK error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



