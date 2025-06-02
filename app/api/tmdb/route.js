import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'multi';
    
    const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDB API key not found' },
        { status: 500 }
      );
    }

    const tmdbApi = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      },
      timeout: 10000
    });

    // Search TMDB
    const { data } = await tmdbApi.get(`/search/${type}`, {
      params: {
        query,
        include_adult: false
      }
    });

    // Format results for cards
    const results = data.results.map(item => ({
      id: item.id,
      title: item.title || item.name,
      type: item.media_type || type,
      overview: item.overview,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      release_date: item.release_date || item.first_air_date,
      vote_average: item.vote_average
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('TMDB API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from TMDB' },
      { status: 500 }
    );
  }
}
