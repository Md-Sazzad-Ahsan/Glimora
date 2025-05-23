import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const ProcessingMessage = () => (
  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
    <FaSpinner className="animate-spin h-4 w-4" />
    <span>Processing document...</span>
  </div>
);

export default ProcessingMessage; 