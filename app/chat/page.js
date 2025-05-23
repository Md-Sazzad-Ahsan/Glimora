"use client";
import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import MovieCard from '../components/MovieCard';

const LOCAL_STORAGE_KEY = 'glimora_chats_chatpage';

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now();
}

// Simple parser to extract movie/drama info from AI response
function extractMovieInfo(text) {
  // This is a basic regex-based parser. Adjust as needed for your AI's format.
  const nameMatch = text.match(/(?:Movie|Drama) Name\s*[:\-]\s*(.+)/i);
  const yearMatch = text.match(/Release Year\s*[:\-]\s*(\d{4})/i);
  const durationMatch = text.match(/(?:Duration|Season|Episode)\s*[:\-]\s*([\w\s\/]+)/i);
  const ratingMatch = text.match(/(?:IMDb|Rating)\s*[:\-]\s*([\d\.\/]+|N\/A)/i);
  const storyMatch = text.match(/(?:Story|Plot|Synopsis)\s*[:\-]\s*([\s\S]*?)(?:\n|$)/i);
  const directorMatch = text.match(/Director\s*[:\-]\s*([\w\s,\.]+)/i);
  const castsMatch = text.match(/Cast[s]?\s*[:\-]\s*([\w\s,\.]+)/i);

  // Fallback: try to extract the first 2-3 lines as story if not found
  let story = storyMatch ? storyMatch[1].trim() : null;
  if (!story) {
    const lines = text.split('\n').filter(Boolean);
    story = lines.slice(0, 3).join(' ');
  }

  if (nameMatch || yearMatch || durationMatch || ratingMatch || story || directorMatch || castsMatch) {
    return {
      name: nameMatch ? nameMatch[1].trim() : '',
      year: yearMatch ? yearMatch[1].trim() : '',
      duration: durationMatch ? durationMatch[1].trim() : '',
      rating: ratingMatch ? ratingMatch[1].trim() : '',
      story,
      director: directorMatch ? directorMatch[1].trim() : '',
      casts: castsMatch ? castsMatch[1].split(',').map(s => s.trim()) : [],
    };
  }
  return null;
}

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [movieInfo, setMovieInfo] = useState(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    let loadedChats = [];
    if (stored) {
      try {
        loadedChats = JSON.parse(stored);
      } catch {}
    }
    const newId = generateId();
    const newChat = { id: newId, title: 'New Chat...', messages: [] };
    setChats([newChat, ...loadedChats]);
    setActiveChatId(newId);
    setMessages([]);
  }, []);

  // Save chats to localStorage whenever chats change (only non-empty)
  useEffect(() => {
    const nonEmptyChats = chats.filter(chat => chat.messages && chat.messages.length > 0);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nonEmptyChats));
  }, [chats]);

  // When activeChatId changes, update messages
  useEffect(() => {
    const chat = chats.find(c => c.id === activeChatId);
    setMessages(chat ? chat.messages : []);
  }, [activeChatId, chats]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewChat = useCallback(() => {
    const newId = generateId();
    const newChat = { id: newId, title: 'New Chat...', messages: [] };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    setMessages([]);
  }, []);

  const handleSelectChat = useCallback((id) => {
    setActiveChatId(id);
  }, []);

  const handleMessagesChange = useCallback(async (newMessages) => {
    setMessages(newMessages);
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChatId ? { ...chat, messages: newMessages } : chat
      )
    );
    setIsLoading(true);
    setMovieInfo(null);
    const lastMsg = newMessages[newMessages.length - 1];
    if (lastMsg && lastMsg.role === 'user') {
      try {
        const response = await fetch('/api/openrouter/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
        });
        const data = await response.json();
        if (data && !data.error && data.name) {
          setMovieInfo(data);
        } else {
          setMovieInfo(null);
        }
      } catch (e) {
        setMovieInfo(null);
      }
      setIsLoading(false);
    }
  }, [activeChatId]);

  const handleEditChatTitle = useCallback((chatId, newTitle) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
  }, []);

  const handleDeleteChat = useCallback((chatId) => {
    setChats(prev => {
      const updated = prev.filter(chat => chat.id !== chatId);
      if (activeChatId === chatId) {
        if (updated.length > 0) {
          setActiveChatId(updated[0].id);
          setMessages(updated[0].messages || []);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
      return updated;
    });
  }, [activeChatId]);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-800">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          chats={chats}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          activeChatId={activeChatId}
          onEditChatTitle={handleEditChatTitle}
          onDeleteChat={handleDeleteChat}
        />
        <div className="flex-1">
          {/* Show MovieCard if movieInfo is found */}
          {movieInfo && movieInfo.name && (
            <div className="flex justify-center px-2 md:px-8">
              <div className="w-full max-w-xl">
                <MovieCard {...movieInfo} />
              </div>
            </div>
          )}
          <ChatInterface
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={toggleSidebar}
            messages={messages}
            setMessages={handleMessagesChange}
            key={activeChatId}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>
      </div>
    </main>
  );
} 