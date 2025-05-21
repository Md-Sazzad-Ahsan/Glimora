import { TbLayoutSidebarLeftCollapse } from "react-icons/tb";
import { PiDotsThreeVerticalBold } from "react-icons/pi";
import { useState, useEffect, useRef } from 'react';

const Sidebar = ({ isOpen, toggleSidebar, chats, onSelectChat, onNewChat, activeChatId }) => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownButtonRefs = useRef({});

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownOpen && !event.target.closest('.sidebar-dropdown-menu')) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleDotsClick = (chatId) => (e) => {
    e.stopPropagation();
    const btn = dropdownButtonRefs.current[chatId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropdownPos({ top: rect.top + window.scrollY - 90, left: rect.left + window.scrollX - 120 });
    }
    setDropdownOpen(chatId === dropdownOpen ? null : chatId);
  };

  return (
    <>
      {/* Backdrop for mobile - clickable to close sidebar */}
      <div 
        onClick={toggleSidebar}
        className={`fixed inset-0 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'z-40' : 'opacity-0 pointer-events-none'
        }`}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-gray-50 border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 lg:z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Close Button */}
          <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
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
                    className={`p-3 rounded-md cursor-pointer truncate flex items-center justify-between ${
                      chat.id === activeChatId
                        ? 'bg-blue-100 dark:bg-blue-900/40' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => onSelectChat(chat.id)}
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{chat.title || 'Untitled Chat'}</p>
                    </div>
                    <div className="ml-2">
                      <button
                        type="button"
                        ref={el => (dropdownButtonRefs.current[chat.id] = el)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={handleDotsClick(chat.id)}
                      >
                        <PiDotsThreeVerticalBold className="h-5 w-5" />
                      </button>
                    </div>
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

      {/* Render dropdown menu in a fixed position at the end of the sidebar */}
      {dropdownOpen && (
        <div
          className="sidebar-dropdown-menu"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 9999,
            background: 'white',
            border: '2px solid #222',
            color: '#222',
            width: '180px',
            minHeight: '80px',
            fontSize: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'stretch',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }}
        >
          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Edit Title</button>
          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Delete Chat</button>
        </div>
      )}
    </>
  );
};

export default Sidebar; 