import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json()
    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'Empty transcript' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

    const prompt = `You are a travel preference extractor. Analyse this voice input and extract travel preferences.
Voice: "${transcript}"

Map ONLY what is clearly expressed to these exact values:
- pace: "packed" (fast/see everything) | "leisure" (slow/relaxed) | null
- budget: "luxury" (high-end/splurge) | "budget" (cost-conscious) | null
- attractions: array subset of ["scenery","landmarks","hidden","food","history","culture"] or []
- activities: "active" (adventure/physical) | "relaxing" (calm/peaceful) | null
- food: "fuel" (food as necessity) | "destination" (loves food tourism) | null
- dietary: string with any dietary restrictions or preferences mentioned, or ""
- summary: one friendly sentence describing what you extracted (max 20 words)

Return ONLY valid JSON. Omit fields that are null or empty.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err: any) {
    return NextResponse.json(
      { summary: 'Your preferences have been noted.', error: err.message },
      { status: 500 }
    )
  }
}
