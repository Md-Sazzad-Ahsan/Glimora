'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const UserProfilePage = ({ params }) => {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth'); // Redirect to your login page
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Placeholder for fetching user data from a database based on the 'id'
  // import { useState, useEffect } from 'react';
  // const [userData, setUserData] = useState(null);
  // useEffect(() => {
  //   // Fetch user data from your database (e.g., Firebase) using the 'id' from params
  //   // setUserData(fetchedData);
  // }, [id]);

  if (session) {
    // You might want to add logic here to fetch specific user data based on 'id'
    // For this example, we'll just display session info.

    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">User Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">User ID: {id}</p>
          {session.user?.name && (
            <p className="text-gray-600 dark:text-gray-300">Name: {session.user.name}</p>
          )}
          {session.user?.email && (
            <p className="text-gray-600 dark:text-gray-300">Email: {session.user.email}</p>
          )}
          {/* Display additional user data fetched from the database here */}
          {/* {userData && (
            <p className="text-gray-600 dark:text-gray-300">Additional Info: {userData.someField}</p>
          )} */}
        </div>
      </div>
    );
  }

  return null; // Or a loading indicator while redirecting
};

export default UserProfilePage;