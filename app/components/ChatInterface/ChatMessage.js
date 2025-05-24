import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

const ChatMessage = ({ message, index }) => {
  return (
    <div className="space-y-4 mt-4">
      <div className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[90%] ${
          message.role === 'user' 
            ? 'bg-gray-600 text-white rounded-lg px-4 py-2 shadow-sm' 
            : 'text-gray-800 dark:text-gray-200'
        }`}>
          {message.role === 'user' ? (
            <p className="text-white whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              {/* Render images if present in the assistant message */}
              {Array.isArray(message.images) && message.images.length > 0 && (
                <div className="mb-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {message.images.map((img, i) => (
                    <Image
                      key={img.url || img.src || i}
                      src={img.url || img.src}
                      alt={img.alt || `Result image ${i+1}`}
                      className="rounded-lg object-cover max-h-48 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      width={400}
                      height={200}
                      loading="lazy"
                      style={{ width: '100%', height: 'auto' }}
                    />
                  ))}
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return inline ? (
                        <code className="bg-gray-200 dark:bg-gray-800 rounded px-1 py-0.5" {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className="not-prose my-4">
                          <div className="relative group bg-gray-800 dark:bg-gray-900 rounded-md">
                            <code className={`${className || ''} block p-4 overflow-x-auto`} {...props}>
                              {children}
                            </code>
                            <button 
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 dark:bg-gray-800 text-gray-300 hover:text-white rounded px-2 py-1 text-xs"
                              onClick={() => navigator.clipboard.writeText(String(children))}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      );
                    },
                    p({children}) {
                      const hasElement = React.Children.toArray(children).some(
                        child => React.isValidElement(child)
                      );
                      if (hasElement) {
                        return <>{children}</>;
                      }
                      return <p className="mb-4 last:mb-0">{children}</p>;
                    },
                    ul({children}) {
                      return <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>;
                    },
                    ol({children}) {
                      return <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>;
                    },
                    li({children}) {
                      return <li className="ml-4 block">{children}</li>;
                    },
                    a: ({href, children}) => {
                      if (message.role === 'assistant') {
                        // For assistant messages, render links as plain text, not clickable.
                        return <>{children}</>; 
                      }
                      // For user messages, render links as clickable.
                      return <a href={href} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer">{children}</a>;
                    },
                    blockquote({children}) {
                      return <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic">{children}</blockquote>;
                    },
                    table({children}) {
                      return <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">{children}</table></div>;
                    },
                    th({children}) {
                      return <th className="px-4 py-2 bg-gray-200 dark:bg-gray-800">{children}</th>;
                    },
                    td({children}) {
                      return <td className="px-4 py-2 border-t border-gray-300 dark:border-gray-600">{children}</td>;
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 