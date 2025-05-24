import React from 'react';
import ChatMessage from './ChatMessage';

const ChatMessagesList = ({ messages }) => (
  <>
    {messages.map((message, index) => (
      <ChatMessage
        key={index}
        message={message}
        index={index}
      />
    ))}
  </>
);

export default ChatMessagesList; 