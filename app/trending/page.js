'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/Card';

import axios from 'axios';

export default function Trending() {
  const [trending, setTrending] = useState({
    movies: [],
    tvShows: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const movieResponse = await tmdbApi.get(`/trending/movie/week`, {
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
        const tvResponse = await tmdbApi.get(`/trending/tv/week`, {
          params: {
            api_key: TMDB_API_KEY
          }
        });
        const tvShows = await Promise.all(
          tvResponse.data.results.map(async (show) => {
            // Fetch cast information
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
    <main>
      <Header />
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 mt-20 mx-auto max-w-6xl">Trending This Week</h1>

      {error && (
        <div className="col-span-full text-center text-red-500 mb-8">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 mx-auto max-w-6xl">
        <h2 className="col-span-full text-xl font-semibold mb-4 uppercase text-center">Movies</h2>
        {loading ? (
          <div className="col-span-full text-center">Loading...</div>
        ) : trending.movies && trending.movies.length > 0 ? (
          trending.movies.map((movie) => (
            <Card key={movie.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  {movie.backdrop_path ? (
                    <Image
                      src={getImageUrl(movie.backdrop_path)}
                      alt={movie.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-start">
                  <CardTitle className="text-2xl font-bold mr-2">{movie.title}</CardTitle>
                  <div className="text-base font-medium text-gray-500 dark:text-gray-300">({getReleaseYear(movie.release_date)})</div>
                </div>
                <div className="flex items-center text-base text-gray-700 dark:text-white mb-3">
                  <span className="text-orange-500">⭐</span>
                  <span className="ml-1 font-semibold">TMDB:</span>
                  <span className="ml-1 font-semibold">{formatRating(movie.vote_average)}/10</span>
                </div>
                {movie.cast && movie.cast.length > 0 && (
                  <div className="text-base text-gray-600 dark:text-gray-300 mb-3">
                    <span className="font-semibold text-gray-700 dark:text-white">Cast:</span> {formatCast(movie.cast)}
                  </div>
                )}
                {movie.overview ? (
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">{movie.overview.slice(0, 100)}...</p>
                ) : (
                  <p className="text-base text-gray-600 dark:text-gray-400">No description available</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No movies found
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto mt-32 max-w-6xl">
        <h2 className="col-span-full text-xl font-semibold mb-4 uppercase text-center">TV Shows</h2>
        {loading ? (
          <div className="col-span-full text-center">Loading...</div>
        ) : (
          trending.tvShows.map((show) => (
            <Card key={show.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={getImageUrl(show.backdrop_path)}
                    alt={show.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-start">
                  <CardTitle className="text-2xl font-bold mr-2">{show.name}</CardTitle>
                  <div className="text-base font-medium text-gray-500 dark:text-gray-300">({getReleaseYear(show.first_air_date)})</div>
                </div>
                <div className="flex items-center text-base text-gray-700 dark:text-white mb-3">
                  <span className="text-orange-500">⭐</span>
                  <span className="ml-1 font-semibold">TMDB:</span>
                  <span className="ml-1 font-semibold">{formatRating(show.vote_average)}/10</span>
                </div>
                {show.cast && show.cast.length > 0 && (
                  <div className="text-base text-gray-600 dark:text-gray-300 mb-3">
                    <span className="font-semibold text-gray-700 dark:text-white">Cast:</span> {formatCast(show.cast)}
                  </div>
                )}
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">{show.overview.slice(0, 100)}...</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
    </main>
  );
}
