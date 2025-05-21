import './globals.css';

export const metadata = {
  title: 'Streamly - AI Chat Assistant',
  description: 'A modern ChatGPT-like web application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
