import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

const MovieCard = ({ name, year, duration, rating, story, director, casts }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-xl mx-auto my-8 transition-transform hover:scale-105 hover:shadow-2xl">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2 sm:gap-0">
      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-1 sm:mb-0">{name}</h3>
      <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500 dark:text-gray-300">
        {year && <span>{year}</span>}
        {year && duration && <span className="hidden sm:inline">|</span>}
        {duration && <span>{duration}</span>}
        {(year || duration) && rating && <span className="hidden sm:inline">|</span>}
        {rating && (
          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{p: ({children}) => <span>{children}</span>}}
            >
              {rating}
            </ReactMarkdown>
          </span>
        )}
      </div>
    </div>
    <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
    <div className="text-gray-700 dark:text-gray-200 text-sm mb-4 prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
      >
        {story}
      </ReactMarkdown>
    </div>
    <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
      <span className="font-semibold">Director:</span> <span>{director || '-'}</span>
    </div>
    <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
      <span className="font-semibold">Cast:</span> <span>{casts && casts.length ? casts.join(', ') : '-'}</span>
    </div>
  </div>
);

export default MovieCard; 