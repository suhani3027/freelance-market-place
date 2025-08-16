"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { makeApiCall } from '../../lib/api';
import { useSocket } from '../components/SocketProvider';

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { updateUnreadCounts, isConnected, sendTypingIndicator, typingUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const getRelativeTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: diffInDays > 365 ? 'numeric' : undefined
      });
    }
  };

  const getTimeOnly = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const checkAuthentication = () => {
    if (typeof window === 'undefined') return;
    
    // Use the new token format with fallback to old format
    const accessToken = localStorage.getItem('accessToken');
    const oldToken = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    
    const token = accessToken || oldToken;
    
    if (!token || !email) {
      router.push('/login');
      return;
    }
    
    // Migrate old token to new format if needed
    if (oldToken && !accessToken) {
      localStorage.setItem('accessToken', oldToken);
      localStorage.removeItem('token');
      console.log('🔄 Migrated old token format to new format');
    }
    
    setIsAuthenticated(true);
    setUser({ email });
    fetchConversations();
    
    const userParam = searchParams.get('user');
    if (userParam) {
      setSelectedConversation(userParam);
      fetchMessages(userParam);
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await makeApiCall('/api/messages/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      
      let errorMessage = 'Failed to load conversations';
      
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
        router.push('/login');
        return;
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('MongoDB') || error.message.includes('database')) {
        errorMessage = 'Database connection issue. Please try again.';
      }
      
      alert(errorMessage);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserEmail) => {
    try {
      const data = await makeApiCall(`/api/messages/conversation/${encodeURIComponent(otherUserEmail)}`);
      setMessages(data);
      setSelectedConversation(otherUserEmail);
      updateUnreadCounts();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      
      let errorMessage = 'Failed to load messages';
      
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
        router.push('/login');
        return;
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      alert(errorMessage);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        recipientEmail: selectedConversation,
        content: newMessage.trim()
      };

      const response = await makeApiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify(messageData)
      });

      if (response) {
        setNewMessage('');
        fetchMessages(selectedConversation);
        fetchConversations();
        inputRef.current?.focus();
        
        sendTypingIndicator(selectedConversation, false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedConversation) {
      sendTypingIndicator(selectedConversation, true);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        sendTypingIndicator(selectedConversation, false);
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  const startNewConversation = (email) => {
    setSelectedConversation(email);
    setMessages([]);
    const existingConversation = conversations.find(conv => conv.otherUser === email);
    if (existingConversation) {
      fetchMessages(email);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    return conversation.otherUser?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Connect with clients and freelancers</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3" style={{ height: '700px' }}>
            
            {/* Left Column: Conversations List */}
            <div className="lg:col-span-1 border-r border-gray-200 bg-gray-50 flex flex-col">
              {/* Conversations Header */}
              <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversations</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">No conversations yet</p>
                    <p className="text-xs text-gray-500">Start a conversation by connecting with someone</p>
                  </div>
                ) : (
                  filteredConversations
                    .filter(conversation => typeof conversation.otherUser === 'string' && conversation.otherUser)
                    .map((conversation) => (
                      <div
                        key={conversation.otherUser || conversation._id || Math.random()}
                        onClick={() => typeof conversation.otherUser === 'string' && startNewConversation(conversation.otherUser)}
                        className={`p-3 cursor-pointer transition-colors hover:bg-gray-100 ${
                          selectedConversation === conversation.otherUser ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {conversation.otherUser.charAt(0).toUpperCase()}
                            </div>
                            {isConnected && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.otherUser}
                            </p>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500 truncate">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-400">
                                {getRelativeTime(conversation.lastMessage.timestamp)}
                              </span>
                            )}
                            {conversation.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Right Column: Chat Area */}
            <div className="lg:col-span-2 flex flex-col bg-white" style={{ height: '700px' }}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0" style={{ height: '80px' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {selectedConversation.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            {selectedConversation}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {isConnected ? 'Online' : 'Offline'}
                            {typingUsers.has(selectedConversation) && (
                              <span className="ml-2 text-blue-500">• typing...</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area - Scrollable */}
                  <div 
                    ref={messagesContainerRef}
                    className="overflow-y-auto bg-gray-50 p-4"
                    style={{ height: 'calc(700px - 160px)' }}
                  >
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <h3 className="text-base font-medium text-gray-900 mb-1">Start the conversation!</h3>
                          <p className="text-sm text-gray-600">Send your first message to begin chatting</p>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.senderEmail === user.email ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                              {message.senderEmail !== user.email && (
                                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                  {message.senderEmail.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div
                                className={`px-3 py-2 rounded-lg max-w-xs ${
                                  message.senderEmail === user.email
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                  message.senderEmail === user.email ? 'text-blue-100' : 'text-gray-400'
                                }`}>
                                  <span className="text-xs">{getTimeOnly(message.createdAt)}</span>
                                  {message.senderEmail === user.email && (
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
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input Bar - FIXED AT BOTTOM */}
                  <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0" style={{ height: '80px' }}>
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={newMessage}
                          onChange={handleTyping}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}