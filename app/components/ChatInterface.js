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
import { MdOutlineAttachFile, MdOutlineLightbulb } from "react-icons/md";
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

const ChatInterface = ({ isSidebarOpen, messages, setMessages, isLoading, setIsLoading }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [aiSummarizeMode, setAiSummarizeMode] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const fileInputRef = useRef(null);
  const sendingRef = useRef(false);
  const [openIframes, setOpenIframes] = useState({});

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

  // Ensure isLoading stays true for one render after sending
  useEffect(() => {
    if (sendingRef.current) {
      setIsLoading(true);
      sendingRef.current = false;
    }
  }, [messages]);

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

  // Helper to update the last assistant message only
  const updateLastAssistantMessage = (baseMessages, content) => {
    setMessages([...baseMessages, { role: 'assistant', content }]);
  };

  // Helper to stream text word by word into the last assistant message (single bubble)
  const streamAssistantMessage = async (baseMessages, text, delay = 30) => {
    let words = text.split(/(\s+)/);
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += words[i];
      updateLastAssistantMessage(baseMessages, accumulated);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, delay));
    }
  };

  // Modified handleSubmit to handle file processing and web search mode
  const handleSubmit = async (e, customMessage = null) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !customMessage && !selectedFile) || isLoading) return;

    // Always construct userMessage from input or customMessage
    const userMessage = customMessage || { role: 'user', content: inputMessage };
    const baseMessages = [...messages, userMessage];

    // Check if we have a file to process
    const fileToProcess = fileInputRef.current?.fileToProcess;
    if (fileToProcess) {
      setMessages(baseMessages);
      setInputMessage('');
      setIsLoading(true);
      setError(null);
      setErrorDetails(null);
      setIsProcessing(true);
      // Create the assistant message bubble
      updateLastAssistantMessage(baseMessages, 'Processing document...');
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
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          accumulatedContent += text;
          updateLastAssistantMessage(baseMessages, accumulatedContent);
        }
      } catch (error) {
        updateLastAssistantMessage(baseMessages, 'Failed to process file content');
        setError('Failed to process file content');
        setErrorDetails(error.cause);
      } finally {
        setIsProcessing(false);
        setIsLoading(false);
        fileInputRef.current.fileToProcess = null;
        setSelectedFile(null);
      }
    } else if (webSearchMode) {
      setMessages(baseMessages);
      setInputMessage('');
      setIsLoading(true);
      setError(null);
      setErrorDetails(null);
      // Create the assistant message bubble
      updateLastAssistantMessage(baseMessages, '');
      // Stream 'Searching...' in the same bubble
      await streamAssistantMessage(baseMessages, 'Searching...', 60);
      let webResults = null;
      try {
        const response = await fetch('/api/web-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userMessage.content }),
        });
        const data = await response.json();
        console.log('Web search API response:', data);
        if (data && !data.error) {
          if (aiSummarizeMode) {
            // AI summarize mode: send answer and top 3 snippets to AI for summary
            let context = '';
            if (data.answer && data.answer.trim()) {
              context += `Web Answer: ${data.answer.trim()}\n`;
            }
            if (data.results && data.results.length > 0) {
              const topSnippets = data.results.slice(0, 3).map((r, i) => `Source ${i+1}: ${r.snippet}\nURL: ${r.url}`).join('\n');
              context += `\n${topSnippets}`;
            }
            const aiPrompt = [
              ...baseMessages,
              { role: 'system', content: `Summarize the following web search results for the user in a concise, helpful, and readable way. If there is a direct answer, include it. Use the sources for context. Reply in markdown.` },
              { role: 'system', content: context }
            ];
            // Overwrite the last assistant message with 'Thinking...' streaming
            await streamAssistantMessage(baseMessages, 'Thinking...', 60);
            try {
              abortControllerRef.current = new AbortController();
              const response = await fetch('/api/openrouter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: aiPrompt }),
                signal: abortControllerRef.current.signal,
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response from AI', {
                  cause: errorData.details
                });
              }
              // Stream the AI response word by word in the same bubble
              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let accumulatedContent = '';
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value);
                accumulatedContent += text;
                updateLastAssistantMessage(baseMessages, accumulatedContent);
              }
            } catch (error) {
              updateLastAssistantMessage(baseMessages, 'AI summarization failed. Please try again.');
            } finally {
              setIsLoading(false);
              abortControllerRef.current = null;
            }
            return;
          } else {
            // Normal web search result (no AI summarize)
            let content = '';
            if (data.answer && data.answer.trim()) {
              content += `${data.answer.trim()}`;
            }
            if (data.results && data.results.length > 0) {
              const sources = data.results.slice(0, 3).map(r => `- [${r.title}](${r.url})`).join('\n');
              if (sources) {
                content += `\n\n**Sources:**\n${sources}`;
              }
            }
            if (!content) {
              content = 'No direct answer or sources found, but here is what we found from the web.';
            }
            await streamAssistantMessage(baseMessages, content, 30);
            setIsLoading(false);
            return;
          }
        }
        webResults = null;
      } catch (err) {
        webResults = null;
      }
      // Only fallback to AI if the fetch failed or data.error is set
      if (webResults === null) {
        await streamAssistantMessage(baseMessages, 'Thinking...', 60);
        try {
          abortControllerRef.current = new AbortController();
          const response = await fetch('/api/openrouter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: baseMessages }),
            signal: abortControllerRef.current.signal,
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get response from AI', {
              cause: errorData.details
            });
          }
          // Stream the AI response word by word in the same bubble
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedContent = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            accumulatedContent += text;
            updateLastAssistantMessage(baseMessages, accumulatedContent);
          }
        } catch (error) {
          updateLastAssistantMessage(baseMessages, 'AI response failed. Please try again.');
        } finally {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      }
    } else {
      // Normal AI mode
      sendingRef.current = true;
      setIsLoading(true);
      setMessages(baseMessages);
      setInputMessage('');
      setError(null);
      setErrorDetails(null);
      // Only create the assistant message once per turn
      updateLastAssistantMessage(baseMessages, '');
      await streamAssistantMessage(baseMessages, 'Thinking...', 60);
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
        // Stream the AI response word by word in the same bubble
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          accumulatedContent += text;
          updateLastAssistantMessage(baseMessages, accumulatedContent);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          updateLastAssistantMessage(baseMessages, error.message || 'AI response failed. Please try again.');
          setError(error.message);
          setErrorDetails(error.cause);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  // Web search handler with AI fallback
  const handleWebSearch = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userQuery = inputMessage.trim();
    const userMessage = { role: 'user', content: userQuery };
    const baseMessages = [...messages, userMessage];
    setMessages(baseMessages);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);

    // Add a temporary assistant message for loading
    setMessages([...baseMessages, { role: 'assistant', content: 'Searching the web...' }]);

    let webResults = null;
    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const content = data.results.map(r => `- [${r.title}](${r.url})\n  ${r.snippet}`).join('\n\n');
        setMessages([...baseMessages, { role: 'assistant', content }]);
        setIsLoading(false);
        return;
      }
      // If no results, fall through to AI fallback
      webResults = null;
    } catch (err) {
      // If web search fails, fall through to AI fallback
      webResults = null;
    }

    // Fallback to AI
    setMessages([...baseMessages, { role: 'assistant', content: 'No web results found. Asking AI...' }]);
    try {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: baseMessages }),
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
      setMessages([...baseMessages, { role: 'assistant', content: 'AI response failed. Please try again.' }]);
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
        <div className="max-w-5xl mx-auto px-5 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 dark:text-gray-300 mt-72 md:mt-60 mb-8 px-5   select-none">
              <h2 className="text-2xl md:text-3xl font-semibold mb-2">Welcome to Streamly!</h2>
              <p className="text-base">Start a conversation or ask for a Movie & Drama suggestion based on your mood or story.</p>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {[
                  { label: 'Happy', color: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-400 dark:text-yellow-900' },
                  { label: 'Sad', color: 'bg-blue-200 text-blue-800 dark:bg-blue-400 dark:text-blue-900' },
                  { label: 'Romantic', color: 'bg-pink-200 text-pink-800 dark:bg-pink-400 dark:text-pink-900' },
                  { label: 'Suspense', color: 'bg-purple-200 text-purple-800 dark:bg-purple-400 dark:text-purple-900' },
                  { label: 'Nostalgic', color: 'bg-orange-200 text-orange-800 dark:bg-orange-400 dark:text-orange-900' },
                  { label: 'Lonely', color: 'bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-gray-900' },
                  { label: 'Adventure', color: 'bg-green-200 text-green-800 dark:bg-green-400 dark:text-green-900' },
                  { label: 'Comedy', color: 'bg-lime-200 text-lime-800 dark:bg-lime-400 dark:text-lime-900' },
                  { label: 'Thriller', color: 'bg-red-200 text-red-800 dark:bg-red-400 dark:text-red-900' },
                  { label: 'Family', color: 'bg-teal-200 text-teal-800 dark:bg-teal-400 dark:text-teal-900' },
                ].map((kw) => (
                  <span key={kw.label} className={`${kw.color} px-3 py-1 rounded-full text-xs font-medium select-none`}>
                    {kw.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className="space-y-4 mt-4">
              <div className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] ${
                  message.role === 'user' 
                    ? 'bg-gray-600 text-white rounded-lg px-4 py-2 shadow-sm' 
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {message.role === 'user' ? (
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <>
                      {/* Render images if present in the assistant message */}
                      {Array.isArray(message.images) && message.images.length > 0 && (
                        <div className="mb-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {message.images.map((img, i) => (
                            <img
                              key={img.url || img.src || i}
                              src={img.url || img.src}
                              alt={img.alt || `Result image ${i+1}`}
                              className="rounded-lg object-cover max-h-48 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
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
                            a: ({href, children}) => {
                              if (message.role === 'assistant') {
                                const isOpen = openIframes[index] === href;
                                return (
                                  <>
                                    <button
                                      className={`text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline focus:outline-none`}
                                      style={{wordBreak: 'break-all'}}
                                      onClick={e => {
                                        e.preventDefault();
                                        setOpenIframes(prev => ({
                                          ...prev,
                                          [index]: isOpen ? null : href
                                        }));
                                      }}
                                    >
                                      {children}
                                    </button>
                                    {isOpen && (
                                      <div className="mt-3 mb-2 rounded border border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900">
                                        <iframe
                                          src={href}
                                          title="Web Preview"
                                          className="w-[90vw] lg:max-w-[80vw] max-w-3xl min-h-[700px] max-h-[1200px] lg:min-h-[600px] lg:max-h-[800px]"
                                          sandbox="allow-scripts allow-same-origin allow-popups"
                                          onError={e => {
                                            e.target.style.display = 'none';
                                            e.target.parentNode.append('Embedding not allowed by this site.');
                                          }}
                                        />
                                        <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1">If the site does not load, it may not allow embedding.</div>
                                      </div>
                                    )}
                                  </>
                                );
                              }
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
                    </>
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
                  // Only show the global loading indicator if the last message is not an assistant message with content
                  (!messages.length ||
                    messages[messages.length - 1].role !== 'assistant' ||
                    !messages[messages.length - 1].content) && (
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
                  )
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
              <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner bg-white dark:bg-gray-600">
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
                  className={`w-full px-3 ${selectedFile ? 'pt-2' : 'pt-5'} pb-3 pr-8 bg-transparent text-gray-800 dark:text-gray-200 resize-none focus:outline-none pl-5`}
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
                    <GrStatusPlaceholder className="h-7 w-7 text-gray-400 dark:text-gray-100 border border-gray-600 dark:border-gray-100 rounded-md bg-gray-300" />
                  ) : (
                    <BsFillArrowUpCircleFill className="h-8 w-8 text-gray-400 dark:text-gray-100" />
                  )}
                </button>
                <div className="px-3 py-2">
                  <div className="flex items-center space-x-1">
                    {/* File upload button with dropdown */}
                    <div className="relative group">
                      <button
                        type="button"
                        className="p-1 transition-colors rounded-md"
                        onClick={() => setShowFileDropdown(!showFileDropdown)}
                        disabled={isLoading}
                      >
                        <MdOutlineAttachFile className="h-7 w-7 text-gray-400 dark:text-gray-200" />
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
                        className="p-1 transition-colors rounded-md"
                        onClick={() => {/* TODO: Implement image upload */}}
                        disabled={isLoading}
                      >
                        <RiImageAddFill className="h-7 w-7 text-gray-400 dark:text-gray-200" />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Upload image
                      </div>
                    </div>

                    {/* Web search button */}
                    <div className="relative group">
                      <button
                        type="button"
                        className={`p-1 transition-colors rounded-md
                          ${webSearchMode ? '' : ''}
                          ${!isLoading ? 'hover:bg-gray-400' : ''}
                        `}
                        onClick={() => setWebSearchMode(v => !v)}
                        disabled={isLoading}
                        style={{
                          background: 'transparent',
                        }}
                      >
                        <IoGlobeOutline
                          className={`h-7 w-7
                            ${webSearchMode
                              ? 'text-gray-700 dark:text-white'
                              : 'text-gray-100 dark:text-gray-800'}
                          `}
                        />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Search the web
                      </div>
                    </div>

                    {/* AI Summarize button */}
                    <div className="relative group">
                      <button
                        type="button"
                        className={`p-1 transition-colors rounded-md
                          ${aiSummarizeMode ? '' : ''}
                          ${!isLoading ? 'hover:bg-yellow-300' : ''}
                        `}
                        onClick={() => setAiSummarizeMode(v => !v)}
                        disabled={isLoading}
                        style={{
                          background: 'transparent',
                        }}
                      >
                        <MdOutlineLightbulb
                          className={`h-7 w-7
                            ${aiSummarizeMode
                              ? 'text-yellow-500 dark:text-yellow-300'
                              : 'text-gray-200 dark:text-gray-700'}
                          `}
                        />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        AI Summarize
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
                onClick={() => {
                  setShowFileModal(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.fileToProcess = null;
                  }
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
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