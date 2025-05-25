import { SessionProvider } from 'next-auth/react';
import './globals.css';


export const metadata = {
  title: 'Glimora -  Assistant',
  description: 'A modern ChatGPT-like web application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="description" content="Glimora is an AI assistant for suggesting and finding movies and dramas based on your mood or story." />
        {/* Open Graph tags */}
        <meta property="og:title" content="Glimora - AI Movie & Drama Suggestion Assistant" />
        <meta property="og:description" content="Get personalized movie and drama recommendations with AI. Share your mood or story and discover what to watch next!" />
        <meta property="og:image" content="/opengraph-image.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://glimora.vercel.app/" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Glimora - AI Movie & Drama Suggestion Assistant" />
        <meta name="twitter:description" content="Get personalized movie and drama recommendations with AI. Share your mood or story and discover what to watch next!" />
        <meta name="twitter:image" content="/opengraph-image.jpg" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
