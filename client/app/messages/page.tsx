"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserEmail) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversation/${encodeURIComponent(otherUserEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setSelectedConversation(otherUserEmail);
        
        // Mark messages as read
        await fetch(`${API_BASE_URL}/api/messages/read/${encodeURIComponent(otherUserEmail)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientEmail: selectedConversation,
          message: newMessage
        })
      });
      
      if (res.ok) {
        setNewMessage('');
        fetchMessages(selectedConversation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <p className="text-gray-500">No conversations yet.</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => fetchMessages(conversation.otherUser.email)}
                    className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${
                      selectedConversation === conversation.otherUser.email ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={conversation.otherUser.profilePhoto || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                        alt="Profile"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{conversation.otherUser.name}</p>
                        <p className="text-sm text-gray-500">{conversation.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="md:col-span-2 bg-white rounded-lg shadow">
            {selectedConversation ? (
              <div className="h-96 flex flex-col">
                {/* Messages Header */}
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{selectedConversation}</h3>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.sender.email === localStorage.getItem('email') ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          message.sender.email === localStorage.getItem('email')
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p>{message.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <p className="text-gray-500">Select a conversation to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}