import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Same fallback chain as /api/itinerary — try lighter models if quota is hit.
const MODEL_CHAIN = [
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
]

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const isQuotaError = (err: any) => {
  const msg = String(err?.message ?? '')
  return /\b429\b/.test(msg) || /quota|rate.?limit|exceeded/i.test(msg)
}

const isTransient = (err: any) => {
  const msg = String(err?.message ?? '')
  return /\b(500|502|503|504)\b/.test(msg) || /overload|unavailable|temporarily/i.test(msg)
}

export async function POST(req: Request) {
  try {
    const { preferences, activities, foodCount, destCount } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY || ''
    const genAI = new GoogleGenerativeAI(apiKey)

    // Keep the activity list compact to save tokens.
    const activityList = (activities as any[])
      .map((a) => `${a.id}|${a.title}|${a.category}`)
      .join('\n')

    const prefLines = [
      preferences.pace && `Pace: ${preferences.pace === 'packed' ? 'packed' : 'leisure'}`,
      preferences.budget && `Budget: ${preferences.budget}`,
      preferences.attractions?.length && `Interests: ${preferences.attractions.join(',')}`,
      preferences.activities && `Activity: ${preferences.activities}`,
      preferences.food && `Food: ${preferences.food}`,
      preferences.dietary && `Dietary: ${preferences.dietary}`,
    ].filter(Boolean).join(' | ')

    const prompt = `Penang travel curator. Pick activities for this traveller.
Profile: ${prefLines || 'general traveller'}
Rules: pick exactly ${foodCount} "Great Food" ids and exactly ${destCount} non-food ids. Avoid dietary conflicts. Vary categories. Return ONLY JSON.
Activities (id|title|category):
${activityList}
JSON format: {"foodIds":["..."],"destinationIds":["..."],"reasoning":"one sentence"}`

    let lastErr: any = null
    for (const modelName of MODEL_CHAIN) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName })
          const result = await model.generateContent(prompt)
          const text = result.response.text().trim()
          const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
          const parsed = JSON.parse(clean)
          return NextResponse.json({
            foodIds: parsed.foodIds ?? [],
            destinationIds: parsed.destinationIds ?? [],
            reasoning: parsed.reasoning ?? '',
            modelUsed: modelName,
          })
        } catch (err: any) {
          lastErr = err
          if (isQuotaError(err)) {
            console.warn(`[recommendations] ${modelName} quota hit, trying next model`)
            break
          }
          if (!isTransient(err)) {
            console.warn(`[recommendations] ${modelName} error:`, err?.message)
            break
          }
          await sleep(400 * Math.pow(2, attempt))
        }
      }
    }

    console.error('[recommendations] all models exhausted:', lastErr?.message)
    return NextResponse.json(
      { error: 'AI recommendations are temporarily unavailable — please try again in a moment.' },
      { status: 503 }
    )
  } catch (err: any) {
    console.error('[recommendations]', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
