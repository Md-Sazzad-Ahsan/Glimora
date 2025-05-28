import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      console.error('TMDB_API_KEY:', TMDB_API_KEY);
      return NextResponse.json(
        { error: 'TMDB API key not found' },
        { status: 500 }
      );
    }

    const baseUrl = 'https://api.themoviedb.org/3';
    
    // Configure axios instance
    const tmdbApi = axios.create({
      baseURL: baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://api.themoviedb.org',
        'Referer': 'https://api.themoviedb.org'
      },
      timeout: 10000, // 10 second timeout
      validateStatus: function (status) {
        return status >= 200 && status < 300; // default
      }
    });

    // Get trending movies
    console.log('Fetching movies...');
    const movieResponse = await tmdbApi.get(`/trending/movie/week`, {
      params: {
        api_key: TMDB_API_KEY
      }
    });
    console.log('Movie response status:', movieResponse.status);
    
    if (movieResponse.status !== 200) {
      console.error('Movie API Error:', movieResponse.data);
      return NextResponse.json(
        { error: `Movie API Error: ${movieResponse.data.status_message || 'Unknown error'}` },
        { status: movieResponse.status }
      );
    }
    
    const movies = movieResponse.data;
    console.log('Movies data:', movies);

    // Get trending TV shows
    console.log('Fetching TV shows...');
    const tvResponse = await tmdbApi.get(`/trending/tv/week`, {
      params: {
        api_key: TMDB_API_KEY
      }
    });
    console.log('TV response status:', tvResponse.status);
    
    if (tvResponse.status !== 200) {
      console.error('TV API Error:', tvResponse.data);
      return NextResponse.json(
        { error: `TV API Error: ${tvResponse.data.status_message || 'Unknown error'}` },
        { status: tvResponse.status }
      );
    }
    
    const tvShows = tvResponse.data;
    console.log('TV Shows data:', tvShows);

    return NextResponse.json({
      movies: movies.results || [],
      tvShows: tvShows.results || []
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error fetching TMDB data:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch trending content',
        details: error.stack 
      },
      { status: 500 }
    );
  }
}
