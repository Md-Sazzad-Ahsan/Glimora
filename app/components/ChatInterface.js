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

// Local components
import ChatMessage from './ChatInterface/ChatMessage';
import ChatInputArea from './ChatInterface/ChatInputArea';
import FileUploadModal from './ChatInterface/FileUploadModal';
import ErrorMessage from './ChatInterface/ErrorMessage';
import ProcessingMessage from './ChatInterface/ProcessingMessage';
import LoadingIndicator from './ChatInterface/LoadingIndicator';
import ChatMessagesList from './ChatInterface/ChatMessagesList';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Trending from './Trending';

// Helper function to check if a URL is an image
const isImageUrl = (url) => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('data:image/');
};

const ChatInterface = ({ isSidebarOpen, messages, setMessages, isLoading, setIsLoading }) => {
  // State for TMDB integration
  const [tmdbResults, setTmdbResults] = useState([]);
  
  // Form and UI state
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  // File handling state
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  
  // Feature toggles
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [aiSummarizeMode, setAiSummarizeMode] = useState(true);
  
  // Refs
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const sendingRef = useRef(false);
  const shouldContinueRef = useRef(true);

  // New function to fetch TMDB data
  const fetchTmdbData = async (names) => {
    const results = [];
    for (const name of names) {
      try {
        // Try searching as a movie first
        const response = await fetch(`/api/tmdb?query=${encodeURIComponent(name)}&type=movie`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          results.push(...data.map(item => ({
            ...item,
            type: 'movie'
          })));
        } else {
          // If no movie found, try searching as a TV show
          const tvResponse = await fetch(`/api/tmdb?query=${encodeURIComponent(name)}&type=tv`);
          const tvData = await tvResponse.json();
          
          if (tvData && tvData.length > 0) {
            results.push(...tvData.map(item => ({
              ...item,
              type: 'tv'
            })));
          } else {
            // If still no results, try searching as a person
            const personResponse = await fetch(`/api/tmdb?query=${encodeURIComponent(name)}&type=person`);
            const personData = await personResponse.json();
            
            if (personData && personData.length > 0) {
              results.push(...personData.map(item => ({
                ...item,
                type: 'person'
              })));
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for ${name}:`, error);
      }
    }
    return results;
  };

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
    // Set the flag to stop streaming
    shouldContinueRef.current = false;
    
    // Abort any ongoing fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset all loading and processing states
    setIsLoading(false);
    setIsProcessing(false);
    setError(null);
    setErrorDetails(null);
    
    // Clear any file processing state
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.fileToProcess = null;
    }
    setSelectedFile(null);
    
    // Do NOT remove the last assistant message anymore
    // The content that was already streamed will be preserved
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
    shouldContinueRef.current = true;  // Reset the flag at the start of streaming
    
    for (let i = 0; i < words.length; i++) {
      if (!shouldContinueRef.current) {
        return false;  // Return false to indicate streaming was cancelled
      }
      accumulated += words[i];
      updateLastAssistantMessage(baseMessages, accumulated);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, delay));
    }
    return true;  // Return true to indicate streaming completed
  };

  // Modified handleSubmit to handle file processing and web search mode
  const handleSubmit = async (e, customMessage = null) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !customMessage && !selectedFile) || isLoading) return;

    shouldContinueRef.current = true;
    const userMessage = customMessage || { role: 'user', content: inputMessage };
    const baseMessages = [...messages, userMessage];
    setMessages(baseMessages);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setTmdbResults([]); // Clear previous results

    // Check if we have a file to process
    const fileToProcess = fileInputRef.current?.fileToProcess;
    
    try {
      if (fileToProcess) {
        // Handle file processing logic here
        // ...
      } else {
        // First, extract names using OpenRouter
        const namesResponse = await fetch('/api/openrouter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: userMessage.content }]
          })
        });

        if (!namesResponse.ok) throw new Error('Failed to extract names');
        
        const { names } = await namesResponse.json();
        
        if (names && names.length > 0) {
          // Fetch TMDB data for extracted names
          const results = await fetchTmdbData(names);
          setTmdbResults(results);
        } else {
          // Fallback to regular chat if no names found
          await handleRegularChat(baseMessages);
        }
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setError('Failed to process your request');
      setErrorDetails(error.message);
      // Fallback to regular chat on error if not file processing
      if (!fileToProcess) {
        await handleRegularChat(baseMessages);
      }
    } finally {
      setIsLoading(false);
      // Clear file input after processing
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.fileToProcess = null;
      }
    }
    if (webSearchMode) {
      try {
        // Create the assistant message bubble
        updateLastAssistantMessage(baseMessages, 'Searching...');
        
        abortControllerRef.current = new AbortController();
        const response = await fetch('/api/web-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userMessage.content }),
          signal: abortControllerRef.current.signal,
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
                if (!shouldContinueRef.current) break;
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value);
                accumulatedContent += text;
                if (shouldContinueRef.current) {
                  updateLastAssistantMessage(baseMessages, accumulatedContent);
                }
              }
            } catch (error) {
              if (error.name === 'AbortError') {
                // Do nothing for aborted requests
                return;
              }
              updateLastAssistantMessage(baseMessages, 'AI summarization failed. Please try again.');
            } finally {
              setIsLoading(false);
              abortControllerRef.current = null;
            }
            return;
          } else {
            // Normal web search result (no AI summarize) - REVERTED
            let content = '';
            if (data.answer && data.answer.trim()) {
              content += `${data.answer.trim()}`;
            }

            if (data.results && data.results.length > 0) {
              const sources = data.results.slice(0, 5).map(r => `- [${r.title}](${r.url})`).join('\n');
              if (sources) {
                // Ensure there's a separation if an answer already exists.
                if (content) {
                  content += '\n\n'; 
                }
                content += `**Sources:**\n${sources}`;
              }
            }

            if (!content.trim()) { 
              content = 'No direct answer or sources found, but here is what we found from the web.';
            }
            
            await streamAssistantMessage(baseMessages, content.trim(), 30);
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
            if (!shouldContinueRef.current) break;
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            accumulatedContent += text;
            if (shouldContinueRef.current) {
              updateLastAssistantMessage(baseMessages, accumulatedContent);
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            // Do nothing for aborted requests
            return;
          }
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
          if (!shouldContinueRef.current) break;
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          accumulatedContent += text;
          if (shouldContinueRef.current) {
            updateLastAssistantMessage(baseMessages, accumulatedContent);
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          // Do nothing for aborted requests
          return;
        }
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
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
        signal: abortControllerRef.current.signal,
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
        if (!shouldContinueRef.current) break;
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
      if (error.name === 'AbortError') {
        // Do nothing for aborted requests
        return;
      }
      setMessages([...baseMessages, { role: 'assistant', content: 'AI response failed. Please try again.' }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Helper for regular chat flow
  const handleRegularChat = async (baseMessages) => {
    try {
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...baseMessages]
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        updateLastAssistantMessage(baseMessages, content);
      }
    } catch (error) {
      console.error('Error in regular chat:', error);
      setError('Failed to process your message');
      setErrorDetails(error.message);
    }
  };

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out w-full pt-20 ${
        isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'
      }`}
    >
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading && <Trending />}
        <ChatMessagesList 
          messages={messages} 
          handleImageError={handleImageError} 
          imageErrors={imageErrors}
        />
        
        {/* Display TMDB Results */}
        {tmdbResults.length > 0 && (
          <div className="mt-4 space-y-6 max-w-5xl mx-auto">
            {tmdbResults.map((item, index) => (
              <Card key={`${item.id}-${index}`} className="mb-6">
                <CardHeader>
                  <div className="relative w-full h-64 bg-gray-200 dark:bg-gray-800">
                    {item.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-movie.jpg';
                        }}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">
                      {item.title || item.name}
                    </CardTitle>
                    {item.vote_average && (
                      <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-orange-900 dark:text-orange-300">
                        ⭐ {item.vote_average.toFixed(1)}/10
                      </span>
                    )}
                  </div>
                  {item.release_date || item.first_air_date ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                    </p>
                  ) : null}
                  <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                    {item.overview || 'No overview available.'}
                  </p>
                  {item.type === 'person' && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Known for:</span> {item.known_for_department}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Loading and error states */}
        {isLoading && tmdbResults.length === 0 && (
          <div className="flex justify-center p-4">
            <LoadingIndicator />
          </div>
        )}
        {error && <ErrorMessage error={error} details={errorDetails} />}
        <div ref={messagesEndRef} className="h-4" />
      </div>
      
      {/* Input area */}
      <ChatInputArea
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stopGenerating={stopGenerating}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        fileInputRef={fileInputRef}
        showFileDropdown={showFileDropdown}
        setShowFileDropdown={setShowFileDropdown}
        handleFileTypeSelect={handleFileTypeSelect}
        showFileModal={showFileModal}
        setShowFileModal={setShowFileModal}
        webSearchMode={webSearchMode}
        setWebSearchMode={setWebSearchMode}
        aiSummarizeMode={aiSummarizeMode}
        setAiSummarizeMode={setAiSummarizeMode}
      />
      
      {/* File upload modal */}
      <FileUploadModal
        show={showFileModal}
        onClose={() => {
          setShowFileModal(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.fileToProcess = null;
          }
        }}
        onFileSelect={handleFileSelect}
        fileInputRef={fileInputRef}
        selectedFile={selectedFile}
      />
    </div>
  );
};

export default ChatInterface; 