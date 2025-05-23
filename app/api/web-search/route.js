import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Tavily API key not configured. Please set TAVILY_API_KEY in your .env file.' }, { status: 500 });
    }

    // Tavily API request with direct answer
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `Find the latest movie or drama information, reviews, and news about: ${query}`,
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
        max_results: 5,
        time_range: 'week',
        topic: 'general',
      }),
    });

    if (!tavilyRes.ok) {
      const err = await tavilyRes.text();
      return NextResponse.json({ error: 'Failed to fetch from Tavily', details: err }, { status: 500 });
    }
    const data = await tavilyRes.json();

    // Format results
    let results = [];
    if (Array.isArray(data.results)) {
      results = data.results.slice(0, 5).map(r => ({
        title: r.title || r.url,
        snippet: r.snippet || '',
        url: r.url,
      }));
    }

    // Return answer (if present), results, and images
    return NextResponse.json({ answer: data.answer || '', results });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 