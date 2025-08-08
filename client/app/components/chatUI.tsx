'use client';

import { useEffect, useState } from 'react';
import { getSocket, initiateSocket } from '../services/socket';

interface Message {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

const ChatUI = ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    initiateSocket();
    const socket = getSocket();

    socket.on('receiveMessage', (message: Message) => {
      if (
        (message.senderId === senderId && message.receiverId === receiverId) ||
        (message.senderId === receiverId && message.receiverId === senderId)
      ) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [senderId, receiverId]);

  const sendMessage = () => {
    const socket = getSocket();
    const message: Message = {
      senderId,
      receiverId,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    socket.emit('sendMessage', message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="h-64 overflow-y-scroll bg-gray-100 rounded p-3 mb-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`my-1 ${msg.senderId === senderId ? 'text-right' : 'text-left'}`}>
            <span className="inline-block px-3 py-1 rounded bg-blue-200">{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border px-3 py-1 rounded"
          placeholder="Type a message"
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-1 rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatUI;
