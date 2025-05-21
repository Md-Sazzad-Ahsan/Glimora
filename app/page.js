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

  // Load chats from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setChats(parsed);
        if (parsed.length > 0) {
          setActiveChatId(parsed[0].id);
          setMessages(parsed[0].messages || []);
        }
      } catch {}
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chats));
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
    const newChat = { id: newId, title: 'My Queries from here...', messages: [] };
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
      const chatExists = prev.some(chat => chat.id === activeChatId);
      if (chatExists) {
        return prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: newMessages, title: getChatTitle(newMessages) }
            : chat
        );
      } else {
        // Add the new chat if it doesn't exist
        return [
          { id: activeChatId, messages: newMessages, title: getChatTitle(newMessages) },
          ...prev
        ];
      }
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
        />
        <ChatInterface
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={toggleSidebar}
          messages={messages}
          setMessages={handleMessagesChange}
          key={activeChatId}
        />
      </div>
    </main>
  );
}
