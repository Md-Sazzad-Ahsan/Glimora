'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

const LOCAL_STORAGE_KEY = 'streamly_chats';

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now();
}

function getChatTitle(messages) {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (firstUserMsg && firstUserMsg.content) {
    return firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
  }
  return 'New Chat';
}

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]); // [{id, title, messages}]
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load chats from localStorage on mount, but always start with a new chat
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    let loadedChats = [];
    if (stored) {
      try {
        loadedChats = JSON.parse(stored);
      } catch {}
    }
    // Always create a new chat on mount
    const newId = generateId();
    const newChat = { id: newId, title: 'New Chat...', messages: [] };
    setChats([newChat, ...loadedChats]);
    setActiveChatId(newId);
    setMessages([]);
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    // Only save chats that have at least one message
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

  // Create a new chat
  const handleNewChat = useCallback(() => {
    const newId = generateId();
    const newChat = { id: newId, title: 'New Chat...', messages: [] };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    setMessages([]);
  }, []);

  // Select a chat
  const handleSelectChat = useCallback((id) => {
    setActiveChatId(id);
  }, []);

  // When messages change, update the current chat in chats
  const handleMessagesChange = useCallback((newMessages) => {
    setMessages(newMessages);
    setChats(prev => {
      // Only create a new chat if there is no activeChatId and no chats exist
      if (activeChatId && prev.some(chat => chat.id === activeChatId)) {
        return prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: newMessages, title: getChatTitle(newMessages) }
            : chat
        );
      } else if (!activeChatId && prev.length === 0) {
        // First ever user message: create a new chat
        const newId = generateId();
        setActiveChatId(newId);
        return [
          { id: newId, messages: newMessages, title: getChatTitle(newMessages) },
        ];
      } else {
        // Should not create a new chat for every message
        return prev;
      }
    });
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
    </main>
  );
}
