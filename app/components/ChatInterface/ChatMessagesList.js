import React from 'react';
import ChatMessage from './ChatMessage';

const ChatMessagesList = ({ messages, openIframes, setOpenIframes }) => (
  <>
    {messages.map((message, index) => (
      <ChatMessage
        key={index}
        message={message}
        index={index}
        openIframes={openIframes}
        setOpenIframes={setOpenIframes}
      />
    ))}
  </>
);

export default ChatMessagesList; 