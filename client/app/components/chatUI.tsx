'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    socket.on('typing', (data) => {
      if (data.senderId === receiverId && data.receiverId === senderId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('typing');
    };
  }, [senderId, receiverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const getTimeOnly = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const socket = getSocket();
    const message: Message = {
      senderId,
      receiverId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    socket.emit('sendMessage', message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
            {receiverId.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{receiverId}</h3>
            <p className="text-blue-100 text-sm">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Area - This is where scrolling happens */}
      <div 
        ref={messagesContainerRef}
        className="h-96 overflow-y-auto bg-gradient-to-b from-slate-50 to-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Start the conversation!</h3>
              <p className="text-slate-600">Send your first message to begin chatting</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.senderId === senderId ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-end space-x-2 max-w-xs">
                  {msg.senderId !== senderId && (
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {msg.senderId.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      msg.senderId === senderId
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                        : 'bg-white text-slate-900 rounded-bl-md border border-slate-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center justify-end mt-2 space-x-1 ${
                      msg.senderId === senderId ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      <span className="text-xs">{getTimeOnly(msg.timestamp)}</span>
                      {msg.senderId === senderId && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {receiverId.charAt(0).toUpperCase()}
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-slate-200 bg-white flex-shrink-0">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
