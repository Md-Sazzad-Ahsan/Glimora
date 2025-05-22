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
    "X-Title": "Streamly Chat",
    "Content-Type": "application/json",
  },
});

export async function POST(req) {
  try {
    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("API key missing");
      return NextResponse.json(
        {
          error: "OpenRouter API key is not configured",
          details: {
            message: "Please follow these steps to configure your API key:",
            steps: [
              "1. Get your API key from https://openrouter.ai/keys",
              "2. Create a .env file in your project root if it doesn't exist",
              "3. Add OPENROUTER_API_KEY=your_key_here to the .env file",
              "4. Make sure there are no quotes around the API key",
              "5. Restart your Next.js development server",
            ],
            debug: {
              hasKey: !!process.env.OPENROUTER_API_KEY,
              envVars: Object.keys(process.env).filter(
                (key) => key.includes("API") || key.includes("KEY")
              ),
              nodeEnv: process.env.NODE_ENV,
            },
          },
        },
        { status: 401 }
      );
    }

    const { messages } = await req.json();

    // Log request details
    console.log("Making request to OpenRouter:", {
      messageCount: messages.length,
      apiKeyPresent: !!process.env.OPENROUTER_API_KEY,
      apiKeyLength: process.env.OPENROUTER_API_KEY?.length,
    });

    try {
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content:
              "You are a gentle and thoughtful Movie & Drama Suggestion Assistant. Recommend movies or dramas based on the user's mood or story. in English or Bangla language" +
              "If mood is unclear, use the story's tone to decide." +
              "Understand emotional cues (happy, sad, romantic, suspenseful, nostalgic, lonely, etc.) deeply." +
              "Suggest a fitting title with release year, IMDb rating, lead cast, and director,one or two line short sammary of the movie or drama" +
              "Keep tone calm, friendly, and only respond to movie/drama-related queries." +
              "Replies should be medium-length and feel naturally human." +
              "Never suggest unrelated content unless adapted from a movie or drama." +
              "Use Markdown styling for all responses.",
          },
          ...messages,
        ],
        temperature: 0.7,
        stream: true,
        max_tokens: 1000,
      });

      // Create a streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      console.error("OpenRouter API Error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      // Enhanced error response with more specific guidance
      return NextResponse.json(
        {
          error: "AI provider error",
          details: {
            message: error.message,
            provider: "OpenRouter/DeepSeek",
            status: error.response?.status || 500,
            possibleSolutions: [
              "Check if your API key is valid",
              "Ensure you have sufficient credits on your OpenRouter account",
              "Try reducing the length of your messages",
              "Check if the DeepSeek model is currently available",
            ],
            response: error.response?.data,
            debug: {
              hasApiKey: !!process.env.OPENROUTER_API_KEY,
              apiKeyLength: process.env.OPENROUTER_API_KEY?.length,
              timestamp: new Date().toISOString(),
            },
          },
        },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: {
          message: error.message,
          type: error.name,
          stack: error.stack,
        },
      },
      { status: 500 }
    );
  }
}
