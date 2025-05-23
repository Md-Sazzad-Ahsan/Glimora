import React from 'react';

const LoadingIndicator = () => (
  <div className="font-mono text-sm text-gray-500 dark:text-gray-200 shadow-sm py-2">
    <div className="flex items-center space-x-2">
      <span>Thinking</span>
      <span className="inline-flex space-x-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: '100ms' }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: '200ms' }}>.</span>
      </span>
    </div>
  </div>
);

export default LoadingIndicator; 