'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { BsFillArrowUpCircleFill } from "react-icons/bs";
import { GrStatusPlaceholder } from "react-icons/gr";
import { IoGlobeOutline } from "react-icons/io5";
import { MdOutlineAttachFile } from "react-icons/md";
import { RiImageAddFill } from "react-icons/ri";

// Helper function to check if a URL is an image
const isImageUrl = (url) => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('data:image/');
};

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

const ThinkingMessage = ({ streamedText, error, details }) => {
  if (error) {
    return <ErrorMessage error={error} details={details} />;
  }

  // If we haven't received any text yet
  if (!streamedText) {
    return (
      <div className="space-y-2 font-mono text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <span>Thinking</span>
          <span className="inline-flex space-x-1">
            <span className="animate-bounce delay-0">.</span>
            <span className="animate-bounce delay-100">.</span>
            <span className="animate-bounce delay-200">.</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 font-mono text-sm text-gray-600 dark:text-gray-300">
      <div className="whitespace-pre-wrap">
        {streamedText}
      </div>
    </div>
  );
};

const ChatInterface = ({ isSidebarOpen }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageError = (src) => {
    setImageErrors(prev => ({ ...prev, [src]: true }));
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    if (isLoading) {
      stopGenerating();
      return;
    }

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI', {
          cause: errorData.details
        });
      }

      const assistantMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        accumulatedContent += text;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: accumulatedContent
          };
          return newMessages;
        });
      }
    } catch (error) {
      // Only show error if it's not an abort error
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
        setError(error.message);
        setErrorDetails(error.cause);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out w-full pt-20 ${
        isSidebarOpen ? 'lg:ml-64' : ''
      }`}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className="space-y-4">
              <div className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-lg px-4 py-2 shadow-sm' 
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {message.role === 'user' ? (
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeHighlight]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline ? (
                              <div className="relative group">
                                <pre className={`${className} bg-gray-800 dark:bg-gray-900 rounded-md p-4 overflow-x-auto`}>
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                                <button 
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 dark:bg-gray-800 text-gray-300 hover:text-white rounded px-2 py-1 text-xs"
                                  onClick={() => navigator.clipboard.writeText(children)}
                                >
                                  Copy
                                </button>
                              </div>
                            ) : (
                              <code className="bg-gray-200 dark:bg-gray-800 rounded px-1 py-0.5" {...props}>
                                {children}
                              </code>
                            );
                          },
                          p({children}) {
                            return <p className="mb-4 last:mb-0">{children}</p>;
                          },
                          ul({children}) {
                            return <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>;
                          },
                          ol({children}) {
                            return <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>;
                          },
                          li({children}) {
                            return <li className="ml-4">{children}</li>;
                          },
                          a({href, children}) {
                            return <a href={href} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer">{children}</a>;
                          },
                          blockquote({children}) {
                            return <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic">{children}</blockquote>;
                          },
                          table({children}) {
                            return <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">{children}</table></div>;
                          },
                          th({children}) {
                            return <th className="px-4 py-2 bg-gray-200 dark:bg-gray-800">{children}</th>;
                          },
                          td({children}) {
                            return <td className="px-4 py-2 border-t border-gray-300 dark:border-gray-600">{children}</td>;
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="space-y-4">
              <div className="pl-0">
                {error ? (
                  <ErrorMessage error={error} details={errorDetails} />
                ) : (
                  <div className="font-mono text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <span>Thinking</span>
                      <span className="inline-flex space-x-1">
                        <span className="animate-bounce delay-0">.</span>
                        <span className="animate-bounce delay-100">.</span>
                        <span className="animate-bounce delay-200">.</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="relative max-w-5xl mx-auto">
          <div className="relative">
            <form onSubmit={handleSubmit} className="p-4">
              <div className="relative rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                <textarea
                  className="w-full p-3 pr-14 bg-transparent text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
                  rows="1"
                  placeholder="Type your message here..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={false}
                ></textarea>
                <button 
                  type="submit"
                  className="absolute right-2 top-2.5 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                  disabled={!inputMessage.trim() && !isLoading}
                >
                  {isLoading ? (
                    <GrStatusPlaceholder className="h-5 w-5" />
                  ) : (
                    <BsFillArrowUpCircleFill className="h-5 w-5" />
                  )}
                </button>
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-1">
                    {/* File upload button */}
                    <div className="relative group">
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => {/* TODO: Implement file upload */}}
                      >
                        <MdOutlineAttachFile className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Upload file
                      </div>
                    </div>

                    {/* Image upload button */}
                    <div className="relative group">
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => {/* TODO: Implement image upload */}}
                      >
                        <RiImageAddFill className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Upload image
                      </div>
                    </div>

                    {/* Web search button */}
                    <div className="relative group">
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => {/* TODO: Implement web search */}}
                      >
                        <IoGlobeOutline className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Search the web
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 