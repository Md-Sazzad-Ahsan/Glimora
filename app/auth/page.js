'use client';

import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../lib/firebaseConfig'; // Your Firebase config
import Header from '../components/Header'; // Adjust if needed

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function AuthPage() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSigningUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Optional: Store user data in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // On successful authentication, you might want to redirect the user
      // For email/password, Firebase handles the session.
      // You might want to reload the page or push to another route.
      window.location.reload(); // Simple reload to update session state

    } catch (error) {
      setError(error.message);
    }
  };
  const { data: session, status } = useSession();

  return (
    <div>
      <Header />
      {session ? (
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-bold mb-4">Welcome, {session.user.email}!</h2>
          <button onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
              {isSigningUp ? 'Create an account' : 'Sign in to your account'}
            </h2>

            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>} 

            <form onSubmit={handleEmailAuth}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between mb-4">
                <button
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                >
                  {isSigningUp ? 'Sign Up with Email' : 'Sign In with Email'}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center mb-4">
              <span className="text-gray-500 dark:text-gray-400">or</span>
            </div>

            {/* Google Sign-in/Sign-up button */}
            <button onClick={() => signIn('google')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSigningUp ? 'Sign Up with Google' : 'Sign In with Google'}
              </button>

            {/* Github Sign-in button */}
             <button onClick={() => signIn('github')}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 mt-4"
              >
                Sign In with Github
            </button>

            <button
              onClick={() => setIsSigningUp(!isSigningUp)}
              className="w-full text-center text-blue-600 hover:underline dark:text-blue-400"
            >
              {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
