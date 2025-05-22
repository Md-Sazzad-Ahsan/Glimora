import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Streamly Chat",
    "Content-Type": "application/json",
  },
});

export async function POST(req) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        error: 'OpenRouter API key is not configured',
        details: 'Please set OPENROUTER_API_KEY in your .env file.'
      }, { status: 401 });
    }

    const { messages } = await req.json();

    // System prompt: respond ONLY in JSON with the required fields
    const systemPrompt = `You are a calm and thoughtful Movie & Drama Assistant who suggests movies or dramas based on the user's mood or story in Bangla or English, analyzing emotional tones deeply. When asked for a recommendation, respond ONLY in the following JSON format and nothing else:
{
  "name": "Movie or Drama Name",
  "year": "Release Year (e.g. 2023)",
  "duration": "Duration/Season/Episode (e.g. 2h 10m or S1E5)",
  "rating": "IMDb or other rating (e.g. 8.2/10)",
  "story": "A very short story/plot in 2-3 lines, markdown supported.",
  "director": "Director Name(s)",
  "casts": ["Star 1", "Star 2", "Star 3"]
}
If you can't find any of these fields, ask for clarification. Do not add any explanation or text outside the JSON.`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      stream: false,
      max_tokens: 1000,
    });

    // The AI's response should be a JSON string
    let content = completion.choices[0]?.message?.content || '';
    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      // fallback: try to extract JSON from the string
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          data = JSON.parse(match[0]);
        } catch {}
      }
    }
    if (!data) {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: content }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process request',
      details: error.message,
    }, { status: 500 });
  }
} 