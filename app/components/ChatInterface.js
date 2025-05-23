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
import ChatMessage from './ChatInterface/ChatMessage';
import ChatInputArea from './ChatInterface/ChatInputArea';
import FileUploadModal from './ChatInterface/FileUploadModal';
import ErrorMessage from './ChatInterface/ErrorMessage';
import ProcessingMessage from './ChatInterface/ProcessingMessage';
import WelcomeMessage from './ChatInterface/WelcomeMessage';
import LoadingIndicator from './ChatInterface/LoadingIndicator';
import ChatMessagesList from './ChatInterface/ChatMessagesList';

// Helper function to check if a URL is an image
const isImageUrl = (url) => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('data:image/');
};

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
          {messages.length === 0 && !isLoading && <WelcomeMessage />}
          <ChatMessagesList messages={messages} openIframes={openIframes} setOpenIframes={setOpenIframes} />
          {isLoading && (
            <div className="space-y-4">
              <div className="pl-0">
                {error ? (
                  <ErrorMessage error={error} details={errorDetails} />
                ) : isProcessing ? (
                  <ProcessingMessage />
                ) : (
                  (!messages.length ||
                    messages[messages.length - 1].role !== 'assistant' ||
                    !messages[messages.length - 1].content) && (
                    <LoadingIndicator />
                  )
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
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