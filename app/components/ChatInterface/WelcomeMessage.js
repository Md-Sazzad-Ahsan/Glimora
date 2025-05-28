import React from 'react';

const WelcomeMessage = () => (
  <div className="text-center mt-[50%] md:mt-52 px-5 select-none">
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-700 dark:text-gray-300">
      Discover Your Next Favorite Movie with
       <span className=" animate-gradient bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 dark:from-orange-400 dark:via-orange-300 dark:to-orange-400 bg-[length:200%_auto] bg-clip-text text-transparent">  GLIMORA!</span>
    </h2>
    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
      Tired of endless searching? Share your mood, a movie you enjoyed, or a story feeling, and 
      <span className="font-bold"> GLIMORRA&apos;s </span>
      smart AI will recommend the perfect movie or TV show just for you!
    </p>
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