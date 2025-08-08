"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  recipient: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  connectionId: string;
  otherUser: {
    _id: string;
    name: string;
    email: string;
  };
  latestMessage?: Message;
  unreadCount: number;
}

function MessagesContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const initialUser = searchParams?.get('user');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserEmail(localStorage.getItem('email'));
    }
  }, []);

  useEffect(() => {
    // Add a small delay to prevent multiple rapid calls
    const timer = setTimeout(() => {
      fetchConversations();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialUser && conversations.length > 0) {
      // Find conversation with this user
      const conversation = conversations.find(conv => conv.otherUser.email === initialUser);
      if (conversation && !selectedConversation) {
        setSelectedConversation(conversation);
        fetchMessages(conversation.otherUser.email);
      }
    }
  }, [conversations, initialUser, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'client-token' || token === 'freelancer-token' || !token.startsWith('eyJ')) {
        setError('Please log in to view messages');
        setLoading(false);
        return;
      }

      const res = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();

        // Check for duplicate connectionIds
        const connectionIds = data.map((conv: Conversation) => conv.connectionId);
        const duplicates = connectionIds.filter((id: string, index: number) => connectionIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
          // Remove duplicates before setting state
          const uniqueConversations = data.filter((conv: Conversation, index: number) => 
            connectionIds.indexOf(conv.connectionId) === index
          );
          setConversations(uniqueConversations);
        } else {
          setConversations(data);
        }
      } else {
        setError('Failed to load conversations');
      }
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserEmail: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/messages/conversation/${encodeURIComponent(otherUserEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();

        // Check for duplicate message IDs
        const messageIds = data.map((msg: Message) => msg._id);
        const duplicates = messageIds.filter((id: string, index: number) => messageIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
          // Duplicate message IDs found, but we'll handle them gracefully
        }
        setMessages(data);
        
        // Mark messages as read
        await fetch(`http://localhost:5000/api/messages/read/${encodeURIComponent(otherUserEmail)}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        setError('Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: selectedConversation.otherUser.email,
          content: newMessage.trim()
        })
      });

             if (res.ok) {
         const sentMessage = await res.json();
         setMessages(prev => [...prev, sentMessage]);
         setNewMessage('');
       } else {
        const data = await res.json();
        alert(data.message || 'Failed to send message');
      }
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.otherUser.email);
  };

  const refreshConversations = async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading messages...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="text-center text-gray-500">
          <p>No conversations yet.</p>
          <p className="mt-2">Connect with other users to start messaging!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Conversations List */}
                 <div className="w-1/3 border-r border-gray-200">
           <div className="p-4 border-b border-gray-200 flex justify-between items-center">
             <h2 className="text-lg font-semibold">Conversations</h2>
             <button
               onClick={refreshConversations}
               disabled={refreshing}
               className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
               title="Refresh conversations"
             >
               {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
             </button>
           </div>
          <div className="overflow-y-auto h-full">
                         {conversations.map((conversation, index) => (
               <div
                 key={conversation.connectionId}
                onClick={() => handleConversationSelect(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.connectionId === conversation.connectionId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {conversation.otherUser.name?.charAt(0) || conversation.otherUser.email.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {conversation.otherUser.name || conversation.otherUser.email.split('@')[0]}
                      </div>
                      {conversation.latestMessage && (
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                          {conversation.latestMessage.content}
                        </div>
                      )}
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedConversation.otherUser.name?.charAt(0) || selectedConversation.otherUser.email.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {selectedConversation.otherUser.name || selectedConversation.otherUser.email.split('@')[0]}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedConversation.otherUser.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                 {messages.map((message, index) => (
                   <div
                     key={message._id}
                    className={`flex ${message.sender.email === userEmail ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender.email === userEmail
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.sender.email === userEmail ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MessagesPage = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
};

export default MessagesPage;