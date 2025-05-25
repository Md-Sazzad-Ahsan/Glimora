import Link from 'next/link';
import { TbLayoutSidebarLeftExpand } from "react-icons/tb";
import { useSession } from 'next-auth/react';


const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { data: session } = useSession();
  return (
    <header className={`fixed top-0 right-0 z-50 bg-white shadow-md dark:bg-gray-800 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64 left-0' : 'left-0'}`}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label="Open Sidebar"
            >
              <TbLayoutSidebarLeftExpand className="h-6 w-6" />
            </button>
          )}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              Glimora
            </span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {session?.user ? (
            <Link href={`/users/${session.user.id}`} className="text-white hover:text-gray-300">
              Profile
            </Link>
          ) : (
            <>
              <Link href="/auth" className="text-white hover:text-gray-300">
                Sign In
              </Link>
              <Link href="/auth" className="text-white hover:text-gray-300">
                Sign Up
              </Link>
            </>
          )}








      </div>
    </div>
    </header >
  );
};

export default Header; 