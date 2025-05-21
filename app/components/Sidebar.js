import { TbLayoutSidebarLeftCollapse } from "react-icons/tb";

const Sidebar = ({ isOpen, toggleSidebar }) => {
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
            <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Chat history items */}
              <div className="p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <p className="text-sm text-gray-800 dark:text-gray-200 truncate">Previous Chat 1</p>
              </div>
              <div className="p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <p className="text-sm text-gray-800 dark:text-gray-200 truncate">Previous Chat 2</p>
              </div>
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