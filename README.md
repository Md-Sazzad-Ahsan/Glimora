# Glimora - AI Movie & Drama Suggestion Assistant

Glimora is a modern PWA (Progressive Web App) AI assistant that helps you discover and get personalized recommendations for movies and dramas based on your mood or story. Powered by advanced AI, Glimora analyzes your input and suggests the best titles to watch next.

- **PWA support**: Installable on mobile and desktop, with offline capabilities.
- **Open Graph & Twitter Card**: Social sharing with a rich preview image (`app/opengraph-image.jpg`).
- **Manifest**: Custom icons and theme for a native app feel.

---

# Glimora - Modern AI Chat Application

A modern ChatGPT-like web application built with Next.js 13+ (App Router) and TailwindCSS.

## Features

- 🎨 Modern and responsive design
- 🌓 Light/Dark mode support
- 💬 Real-time chat interface
- 📱 Mobile-friendly layout
- 🎯 Sidebar with chat history (auto-saved)
- 🔍 Clean and intuitive UI
- 📄 PDF upload and file processing (extract text from PDFs and chat about them)
- 💾 **Automatic chat history saving** (see below)

## How Chat History Works

- Every chat (conversation) is saved in your browser's **localStorage**.
- Each chat contains the full back-and-forth: **user questions and AI responses**.
- When you revisit the app, your chat history is restored automatically.
- You can create, rename, and delete chats from the sidebar.
- **No data is sent to any server except for AI processing and PDF extraction.**

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/glimora.git
cd glimora
```

2. Install dependencies:
```bash
npm install
```

3. **Set up your OpenRouter API key:**
   - Go to [https://openrouter.ai/keys](https://openrouter.ai/keys) and log in or create an account and create an API key.
   - Copy the generated key.
   - In your project root, create a `.env` file (if it doesn't exist) and add the API key
      
  **Do not use quotes or spaces around the key.**

   - Restart your development server after saving the `.env` file.

4. Run the development server:
```bash
npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- Next.js 13+ (App Router)
- TailwindCSS
- React
- ESLint

## Project Structure

```
glimora/
├── app/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── ChatInterface.js
│   ├── layout.js
│   └── page.js
├── public/
└── package.json
```

## PDF Upload & File Processing
- You can upload PDF files in the chat interface.
- The app extracts text from the PDF and allows you to chat about its content.
- Only PDF files are supported for upload.

## Error Handling & Troubleshooting

### Malformed AI Responses
- Sometimes, the AI may return unexpected or malformed output (e.g., repeated numbers, Markdown headers like `# 1.1.1.1...`).
- This is a limitation of the AI model, not the app.
- If this happens, try rephrasing your question or sending it again.
- The app will attempt to parse and display only valid responses, but cannot guarantee perfect results for every input.

### API Key Issues
- If you see errors about a missing or invalid API key:
  1. Make sure you have created an API key at [https://openrouter.ai/keys](https://openrouter.ai/keys).
  2. Add it to your `.env` file (no quotes or spaces).
  3. Restart your development server after saving the `.env` file.
- Never commit your API key to a public repository.

### Chat History Saving
- Chat history is saved in your browser's localStorage.
- If you clear your browser data, your chat history will be lost.
- Make sure you are not using private/incognito mode if you want to keep your history.

### PDF Upload Issues
- Only PDF files are supported.
- If PDF extraction fails, make sure the file is not corrupted and try again.

## FAQ

**Q: Is my chat data sent to any server?**
- Only for AI processing and PDF extraction. Your chat history is stored locally in your browser.

**Q: Can I use this app on mobile?**
- Yes! Glimora is a PWA and works great on mobile devices.

**Q: Why do I sometimes get weird or repeated responses from the AI?**
- This is a limitation of the AI model. Try rephrasing your question or sending it again.

## Contributing

Feel free to open issues and pull requests!
