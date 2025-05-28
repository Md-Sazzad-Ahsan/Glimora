'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Image from 'next/image';
import Carousel from '@/app/components/Carousel';

import axios from 'axios';

export default function Trending() {
  const [trending, setTrending] = useState({
    movies: [],
    tvShows: []
  });
  const [timePeriod, setTimePeriod] = useState('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleTimePeriod = () => {
    const newPeriod = timePeriod === 'day' ? 'week' : 'day';
    setTimePeriod(newPeriod);
  };

  // Initial data fetch
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!TMDB_API_KEY) {
          throw new Error('TMDB API key not found');
        }

        const baseUrl = 'https://api.themoviedb.org/3';
        
        // Configure axios instance
        const tmdbApi = axios.create({
          baseURL: baseUrl,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000, // 10 second timeout
          validateStatus: function (status) {
            return status >= 200 && status < 300; // default
          }
        });

        // Fetch movies with cast information
        const movieResponse = await tmdbApi.get(`/trending/movie/day`, {
          params: {
            api_key: TMDB_API_KEY
          }
        });
        const movies = await Promise.all(
          movieResponse.data.results.map(async (movie) => {
            // Fetch cast information
            const castResponse = await tmdbApi.get(`/movie/${movie.id}/credits`, {
              params: {
                api_key: TMDB_API_KEY
              }
            });
            const cast = castResponse.data.cast.slice(0, 3).map(castMember => castMember.name);
            return {
              ...movie,
              cast: cast
            };
          })
        );

        // Fetch TV shows with cast information
        const tvResponse = await tmdbApi.get(`/trending/tv/day`, {
          params: {
            api_key: TMDB_API_KEY
          }
        });
        const tvShows = await Promise.all(
          tvResponse.data.results.map(async (show) => {
            const castResponse = await tmdbApi.get(`/tv/${show.id}/credits`, {
              params: {
                api_key: TMDB_API_KEY
              }
            });
            const cast = castResponse.data.cast.slice(0, 3).map(castMember => castMember.name);
            return {
              ...show,
              cast: cast
            };
          })
        );

        setTrending({
          movies: movies || [],
          tvShows: tvShows || []
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching trending data:', error);
        setError(error.message || 'Failed to fetch trending content');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  // Handle time period changes
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (!TMDB_API_KEY) {
          throw new Error('TMDB API key not found');
        }

        const baseUrl = 'https://api.themoviedb.org/3';
        
        // Configure axios instance
        const tmdbApi = axios.create({
          baseURL: baseUrl,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000, // 10 second timeout
          validateStatus: function (status) {
            return status >= 200 && status < 300; // default
          }
        });

        // Fetch movies with cast information
        const movieResponse = await tmdbApi.get(`/trending/movie/${timePeriod}`, {
          params: {
            api_key: TMDB_API_KEY
          }
        });
        const movies = await Promise.all(
          movieResponse.data.results.map(async (movie) => {
            // Fetch cast information
            const castResponse = await tmdbApi.get(`/movie/${movie.id}/credits`, {
              params: {
                api_key: TMDB_API_KEY
              }
            });
            const cast = castResponse.data.cast.slice(0, 3).map(castMember => castMember.name);
            return {
              ...movie,
              cast: cast
            };
          })
        );

        // Fetch TV shows with cast information
        const tvResponse = await tmdbApi.get(`/trending/tv/${timePeriod}`, {
          params: {
            api_key: TMDB_API_KEY
          }
        });
        const tvShows = await Promise.all(
          tvResponse.data.results.map(async (show) => {
            const castResponse = await tmdbApi.get(`/tv/${show.id}/credits`, {
              params: {
                api_key: TMDB_API_KEY
              }
            });
            const cast = castResponse.data.cast.slice(0, 3).map(castMember => castMember.name);
            return {
              ...show,
              cast: cast
            };
          })
        );

        setTrending({
          movies: movies || [],
          tvShows: tvShows || []
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching trending data:', error);
        setError(error.message || 'Failed to fetch trending content');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [timePeriod]);

  const getImageUrl = (path) => {
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const formatRating = (rating) => {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
  };

  const getReleaseYear = (date) => {
    if (!date) return 'N/A';
    return new Date(date).getFullYear();
  };

  const formatCast = (cast) => {
    if (!cast || cast.length === 0) return 'Cast information not available';
    return cast.join(', ');
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-4xl font-bold mb-12 text-center">Trending</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 mb-8">
            {error}
          </div>
        ) : (
          <>
            <Carousel
              title="Trending Movies"
              items={trending.movies}
              getImageUrl={getImageUrl}
              formatRating={formatRating}
              getReleaseYear={getReleaseYear}
              formatCast={formatCast}
              timePeriod={timePeriod}
              onTimePeriodChange={toggleTimePeriod}
            />

            <Carousel
              title="Trending TV Shows"
              items={trending.tvShows}
              getImageUrl={getImageUrl}
              formatRating={formatRating}
              getReleaseYear={getReleaseYear}
              formatCast={formatCast}
              timePeriod={timePeriod}
              onTimePeriodChange={toggleTimePeriod}
            />
          </>
        )}
      </div>
    </main>
  );
}
