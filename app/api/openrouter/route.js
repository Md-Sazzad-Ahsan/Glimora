import OpenAI from "openai";
import { NextResponse } from "next/server";

// Add debugging for environment variables
console.log("Environment check:", {
  hasApiKey: !!process.env.OPENROUTER_API_KEY,
  keyLength: process.env.OPENROUTER_API_KEY?.length,
  nodeEnv: process.env.NODE_ENV,
});

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Glimora Chat",
    "Content-Type": "application/json",
  },
});

export async function POST(req) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 401 }
      );
    }

    const { messages } = await req.json();
    
    const modifiedMessages = [
      {
        role: "system",
        content: "ONLY respond with the names of movies, TV shows, actors or directors from the user's query. " +
                "Format as: movie_name, show_name, actor_name, director_name. No other text or commentary."
      },
      ...messages
    ];

    const completion = await openai.chat.completions.create({
      messages: modifiedMessages,
      model: "deepseek/deepseek-chat-v3-0324:free",
      stream: false,
      max_tokens: 100
    });

    // Clean and split names
    const names = completion.choices[0]?.message?.content
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    return NextResponse.json({ names });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to extract names" },
      { status: 500 }
    );
  }
}