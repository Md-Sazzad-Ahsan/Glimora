'use client';

import React from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { GoArrowUpRight } from "react-icons/go";

const WelcomeMessage = () => (
  <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
    <Header />
    <main className="flex-grow">
      <div className="text-center items-center mt-[50%] md:mt-52 lg:mt-60 px-5 select-none mx-auto max-w-6xl">
        <h2 className="text-5xl md:text-5xl lg:text-6xl font-bold mb-2 text-gray-700 dark:text-gray-300">
          Discover Your Next Favorite Movie with
           <span className=" animate-gradient bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 dark:from-orange-400 dark:via-orange-300 dark:to-orange-400 bg-[length:200%_auto] bg-clip-text text-transparent">  GLIMORA!</span>
        </h2>
        <p className="text-md md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl md:max-w-3xl mx-auto leading-relaxed">
          Tired of endless searching? Share your mood, a movie you enjoyed, or a story feeling, and 
          <span className="font-bold"> GLIMORA&apos;s </span>
          smart AI will recommend the perfect movie or TV show just for you!
        </p>
        <button
          onClick={() => window.location.href = '/home'}
          className="mt-8 px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg flex justify-center items-center gap-2 mx-auto"
        >
          Get Started for Free <GoArrowUpRight /> 
        </button>
      </div>
    </main>
    <Footer />
    <style jsx>{`
      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animate-gradient {
        animation: gradient 3s ease infinite;
      }
    `}</style>
  </div>
);

export default WelcomeMessage; 