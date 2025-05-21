import { TbLayoutSidebarLeftCollapse } from "react-icons/tb";
import { PiDotsThreeVerticalBold } from "react-icons/pi";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useState, useEffect, useRef } from 'react';

const Sidebar = ({ isOpen, toggleSidebar, chats, onSelectChat, onNewChat, activeChatId, onEditChatTitle, onDeleteChat }) => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownButtonRefs = useRef({});
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Only close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownOpen && !event.target.closest('.sidebar-dropdown-menu') && !event.target.closest('.dropdown-trigger')) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleDotsClick = (chatId) => (e) => {
    e.stopPropagation();
    setDropdownOpen(dropdownOpen === chatId ? null : chatId);
  };

  return (
    <>
      {/* Backdrop for mobile - clickable to close sidebar */}
      <div 
        onClick={toggleSidebar}
        className={`fixed inset-0 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'z-40 pointer-events-none' : 'opacity-0 pointer-events-auto'
        }`}
      />
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-gray-50 dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Close Button */}
          <div className="h-16 flex items-center px-4">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label="Close Sidebar"
            >
              <TbLayoutSidebarLeftCollapse className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4">
            <button
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center"
              onClick={onNewChat}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {chats && chats.length > 0 ? (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-md cursor-pointer truncate flex flex-col ${
                      chat.id === activeChatId
                        ? 'bg-gray-100 dark:bg-gray-800' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => onSelectChat(chat.id)}
                      >
                        {editingChatId === chat.id && editingTitle !== '' ? (
                          <input
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={editingTitle}
                            autoFocus
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => {
                              if (editingTitle.trim()) {
                                onEditChatTitle(chat.id, editingTitle.trim());
                              }
                              setEditingChatId(null);
                              setEditingTitle('');
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                if (editingTitle.trim()) {
                                  onEditChatTitle(chat.id, editingTitle.trim());
                                }
                                setEditingChatId(null);
                                setEditingTitle('');
                              }
                              if (e.key === 'Escape') {
                                setEditingChatId(null);
                                setEditingTitle('');
                              }
                            }}
                          />
                        ) : (
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{chat.title || 'Untitled Chat'}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        ref={el => (dropdownButtonRefs.current[chat.id] = el)}
                        className="dropdown-trigger p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ml-2"
                        onClick={handleDotsClick(chat.id)}
                      >
                        <PiDotsThreeVerticalBold className="h-5 w-5" />
                      </button>
                    </div>
                    {/* Only show icon row if dropdownOpen is not null and matches chat.id */}
                    {dropdownOpen !== null && dropdownOpen === chat.id && (
                      <div className="sidebar-dropdown-menu flex flex-row items-end justify-end gap-2 mt-2 px-2 pt-1 border-t border-gray-50 dark:border-gray-700 z-50 sm:flex" onClick={e => e.stopPropagation()}>
                        <button
                          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit Title"
                          onClick={() => {
                            setEditingChatId(chat.id);
                            setEditingTitle(chat?.title || '');
                            setDropdownOpen(null);
                          }}
                        >
                          <FiEdit2 className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                        </button>
                        <button
                          className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900"
                          title="Delete Chat"
                          onClick={() => {
                            setDropdownOpen(null);
                            onDeleteChat(chat.id);
                          }}
                        >
                          <FiTrash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400">No chats yet.</div>
              )}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Profile</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 