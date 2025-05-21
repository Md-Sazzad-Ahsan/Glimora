'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { AiFillFilePdf } from "react-icons/ai";
import { FaSpinner } from "react-icons/fa";

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

const ProcessingMessage = () => (
  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
    <FaSpinner className="animate-spin h-4 w-4" />
    <span>Processing document...</span>
  </div>
);

const ChatInterface = ({ isSidebarOpen, messages, setMessages }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const lastMessage = messagesEndRef.current.previousElementSibling;
      if (lastMessage) {
        lastMessage.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }
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
      setError(null);
      setErrorDetails(null);
    }
  };

  // Function to extract text from document
  const extractTextFromDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from document');
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw error;
    }
  };

  // Function to handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setShowFileModal(false);
    // Store the file for later use when the user clicks send
    fileInputRef.current.fileToProcess = file;
  };

  // Function to handle file type selection
  const handleFileTypeSelect = () => {
    setShowFileDropdown(false);
    setShowFileModal(true);
  };

  // Modified handleSubmit to handle file processing
  const handleSubmit = async (e, customMessage = null) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !customMessage && !selectedFile) || isLoading) return;

    const userMessage = customMessage || { role: 'user', content: inputMessage };
    
    // Check if we have a file to process
    const fileToProcess = fileInputRef.current?.fileToProcess;
    if (fileToProcess) {
      const baseMessages = [...messages, userMessage];
      setMessages(baseMessages);
      setInputMessage('');
      setIsLoading(true);
      setError(null);
      setErrorDetails(null);
      setIsProcessing(true);

      try {
        // Extract text from the document
        const text = await extractTextFromDocument(fileToProcess);

        // Send the extracted text to the API
        const response = await fetch('/api/openrouter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              ...baseMessages,
              {
                role: 'system',
                content: `Processing PDF file: ${fileToProcess.name}\n\n${text}`
              }
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process file', {
            cause: errorData.details
          });
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        const assistantMessage = { role: 'assistant', content: '' };
        const newMessages = [...baseMessages, assistantMessage];
        setMessages(newMessages);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          accumulatedContent += text;

          const newMessages = [...baseMessages, {
              role: 'assistant',
              content: accumulatedContent
          }];
          setMessages(newMessages);
        }

      } catch (error) {
        console.error('Error processing file:', error);
        setError('Failed to process file content');
        setErrorDetails(error.cause);
      } finally {
        setIsProcessing(false);
        setIsLoading(false);
        // Clear the stored file and selected file state
        fileInputRef.current.fileToProcess = null;
        setSelectedFile(null);
      }
    } else {
      // Regular message handling without file
      let baseMessages = [...messages, userMessage];
      if (!customMessage) {
        setMessages(baseMessages);
        setInputMessage('');
      }
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
        let streamingMessages = [...baseMessages, assistantMessage];
        setMessages(streamingMessages);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          accumulatedContent += text;

          streamingMessages = [...baseMessages, {
              role: 'assistant',
              content: accumulatedContent
          }];
          setMessages(streamingMessages);
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
            <div key={index} className="space-y-4 mt-4">
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
                            return inline ? (
                              <code className="bg-gray-200 dark:bg-gray-800 rounded px-1 py-0.5" {...props}>
                                {children}
                              </code>
                            ) : (
                              <div className="not-prose my-4">
                                <div className="relative group bg-gray-800 dark:bg-gray-900 rounded-md">
                                  <code className={`${className || ''} block p-4 overflow-x-auto`} {...props}>
                                    {children}
                                  </code>
                                  <button 
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 dark:bg-gray-800 text-gray-300 hover:text-white rounded px-2 py-1 text-xs"
                                    onClick={() => navigator.clipboard.writeText(String(children))}
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            );
                          },
                          p({children}) {
                            // If any child is a React element (block or inline), use a fragment
                            const hasElement = React.Children.toArray(children).some(
                              child => React.isValidElement(child)
                            );
                            if (hasElement) {
                              return <>{children}</>;
                            }
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
                ) : isProcessing ? (
                  <ProcessingMessage />
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
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
      
      {/* Input area */}
      <div className="">
        <div className="relative max-w-5xl mx-auto">
          <div className="relative">
            <form onSubmit={handleSubmit} className="px-4">
              <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner bg-white dark:bg-gray-600">
                {selectedFile && (
                  <div className="px-3 pt-2">
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-600">
                      <AiFillFilePdf className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.fileToProcess = null;
                          }
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
                <textarea
                  className={`w-full px-3 ${selectedFile ? 'pt-2' : 'pt-5'} pb-3 pr-14 bg-transparent text-gray-800 dark:text-gray-200 resize-none focus:outline-none pl-5`}
                  rows="1"
                  placeholder="Ask anything..."
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
                  type={isLoading ? "button" : "submit"}
                  className="absolute right-2 top-2.5 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-600 rounded touch-manipulation"
                  disabled={!inputMessage.trim() && !isLoading && !selectedFile}
                  onClick={isLoading ? (e) => { e.preventDefault(); stopGenerating(); } : undefined}
                >
                  {isLoading ? (
                    <GrStatusPlaceholder className="h-5 w-5" />
                  ) : (
                    <BsFillArrowUpCircleFill className="h-8 w-8 text-gray-100" />
                  )}
                </button>
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-1">
                    {/* File upload button with dropdown */}
                    <div className="relative group">
                      <button
                        type="button"
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => setShowFileDropdown(!showFileDropdown)}
                      >
                        <MdOutlineAttachFile className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Attach file
                      </div>
                      
                      {/* File type dropdown */}
                      {showFileDropdown && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[120px]">
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            onClick={() => handleFileTypeSelect()}
                          >
                            <AiFillFilePdf className="h-4 w-4" />
                            <span>PDF</span>
                          </button>
                        </div>
                      )}
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

      {/* File upload modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Select PDF File
            </h3>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowFileModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 