import React from 'react';

const ErrorMessage = ({ error, details }) => (
  <div className="text-red-500 dark:text-red-400 font-mono text-sm space-y-2">
    <p className="font-semibold">{error}</p>
    {details && (
      <div className="text-xs space-y-2">
        <p className="text-gray-600 dark:text-gray-300">{details.message}</p>
        {details.provider && (
          <p className="text-gray-500 dark:text-gray-400">Provider: {details.provider}</p>
        )}
        {details.debug && (
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded space-y-1">
            <p>Debug Info:</p>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(details.debug, null, 2)}
            </pre>
          </div>
        )}
        {details.response && (
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded space-y-1">
            <p>Response Details:</p>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(details.response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )}
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-2">
      <p>To fix this:</p>
      <ol className="list-decimal list-inside space-y-1">
        <li>Get your API key from{' '}
          <a 
            href="https://openrouter.ai/keys" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline hover:text-blue-500"
          >
            https://openrouter.ai/keys
          </a>
        </li>
        <li>Add this line to your .env file: OPENROUTER_API_KEY=your_key_here</li>
        <li>Make sure there are no spaces or quotes around the API key</li>
        <li>Restart your Next.js server</li>
      </ol>
    </div>
  </div>
);

export default ErrorMessage; 