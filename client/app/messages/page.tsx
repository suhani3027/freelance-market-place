"use client";

import React, { useEffect, useState, useRef } from "react";
import { getSocket } from "../services/socket";

interface Message {
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
  _id?: string;
}

function getRoomName(user1: string, user2: string) {
  return [user1, user2].sort().join("_");
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [receiver, setReceiver] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<{ [email: string]: string }>({});
  const [allUsers, setAllUsers] = useState<{ name: string; email: string }[]>([]);
  const [canChat, setCanChat] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const sender = typeof window !== "undefined" ? localStorage.getItem("email") || "" : "";
  const socketRef = useRef<any>(null);
  const currentRoom = useRef<string | null>(null);

  // Helper to fetch and cache user name
  const fetchUserName = async (email: string) => {
    if (!email || userNames[email]) return;
    try {
      const res = await fetch(`http://localhost:5000/api/user/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setUserNames((prev) => ({ ...prev, [email]: data.name || email }));
      }
    } catch {
      // fallback: use email
      setUserNames((prev) => ({ ...prev, [email]: email }));
    }
  };

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => {
        if (prev.some(m => m._id === msg._id || (m.timestamp === msg.timestamp && m.content === msg.content))) {
          return prev;
        }
        return [...prev, msg];
      });
      // Fetch names for sender/receiver
      fetchUserName(msg.sender);
      fetchUserName(msg.receiver);
    });

    return () => {
      socket.off("receiveMessage");
    };
    // eslint-disable-next-line 
  }, []);

  // Fetch message history and user names when selectedUser changes
  useEffect(() => {
    if (selectedUser && sender) {
      const room = getRoomName(sender, selectedUser);
      currentRoom.current = room;
      socketRef.current.emit("joinRoom", room);
      fetch(`http://localhost:5000/messages/${encodeURIComponent(sender)}/${encodeURIComponent(selectedUser)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(data);
            // Fetch names for all users in the thread
            data.forEach((msg: Message) => {
              fetchUserName(msg.sender);
              fetchUserName(msg.receiver);
            });
          }
        });
      // Also fetch name for sidebar
      fetchUserName(selectedUser);
      fetchUserName(sender);
    }
    // eslint-disable-next-line
  }, [selectedUser, sender]);

  // Check connection status when selectedUser changes
  useEffect(() => {
    if (selectedUser && sender) {
      const checkConnection = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:5000/api/connections/check/${encodeURIComponent(selectedUser)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await res.json();
          if (result.connected) {
            setCanChat(true);
            setConnectionStatus('accepted');
          } else {
            // Check for pending/rejected requests
            const pendingRes = await fetch('http://localhost:5000/api/connections/pending', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const pendingList = await pendingRes.json();
            const pending = pendingList.find((c: any) => c.requester.email === sender && c.recipient.email === selectedUser);
            if (pending) {
              setCanChat(false);
              setConnectionStatus(pending.status);
            } else {
              setCanChat(false);
              setConnectionStatus(null);
            }
          }
        } catch {
          setCanChat(false);
          setConnectionStatus(null);
        }
      };
      checkConnection();
    } else {
      setCanChat(true);
      setConnectionStatus(null);
    }
  }, [selectedUser, sender]);

  // Fetch all users for chat partner selection
  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllUsers(data.filter(u => u.email !== sender));
        }
      });
  }, [sender]);

  const sendMessage = () => {
    if (!input.trim() || !selectedUser || !canChat) return;
    const msg: Message = {
      sender,
      receiver: selectedUser,
      content: input,
      timestamp: new Date().toISOString(),
    };
    const room = getRoomName(sender, selectedUser);
    socketRef.current.emit("sendMessage", { msg, room });
    setMessages((prev) => [...prev, msg]);
    setInput("");
    fetchUserName(selectedUser);
    fetchUserName(sender);
  };

  // Get unique conversation partners (the 'other' user in each message)
  const conversationUsers = Array.from(
    new Set(
      messages
        .map((msg) => (msg.sender === sender ? msg.receiver : msg.sender))
        .filter((user) => user && user !== sender)
    )
  );

  // Filter messages for the selected conversation
  const thread = selectedUser
    ? messages.filter(
        (msg) =>
          (msg.sender === sender && msg.receiver === selectedUser) ||
          (msg.sender === selectedUser && msg.receiver === sender)
      )
    : [];

  // Get the 'other' user's info for the thread header
  const otherUser = selectedUser;

  return (
    <div className="flex h-[80vh] w-full bg-gray-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r flex flex-col p-6">
        <h2 className="text-2xl font-semibold mb-4">Messages</h2>
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="Search"
            className="flex-1 border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button className="ml-2 p-2 rounded hover:bg-gray-100">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-2-2"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationUsers.length === 0 ? (
            <span className="text-gray-400">Conversations will appear here</span>
          ) : (
            <ul>
              {conversationUsers.map((user) => (
                <li
                  key={user}
                  className={`p-2 rounded cursor-pointer mb-2 ${selectedUser === user ? "bg-green-100" : "hover:bg-gray-100"}`}
                  onClick={() => setSelectedUser(user)}
                >
                  {userNames[user] || user}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* User selection dropdown for new chat */}
        <div className="mt-4">
          <select
            className="w-full border rounded px-3 py-2"
            value={receiver}
            onChange={e => {
              setReceiver(e.target.value);
              setSelectedUser(e.target.value);
            }}
          >
            <option value="">Start new chat...</option>
            {allUsers.map(user => (
              <option key={user.email} value={user.email}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {selectedUser ? (
          <div className="w-full max-w-2xl flex flex-col h-full">
            {/* Thread header with the other user's info */}
            <div className="p-4 border-b text-lg font-semibold text-gray-700 bg-white">{userNames[otherUser] || otherUser}</div>
            <div className="flex-1 overflow-y-auto p-4">
              {thread.map((msg, idx) => (
                <div key={msg._id || idx} className={`mb-2 ${msg.sender === sender ? "text-right" : "text-left"}`}>
                  <div className="inline-block bg-white rounded px-4 py-2 shadow">
                    <div className="text-xs text-gray-500 mb-1">
                      <span>{msg.sender === sender ? "You" : (userNames[msg.sender] || msg.sender)} → {msg.receiver === sender ? "You" : (userNames[msg.receiver] || msg.receiver)}</span>
                      <span className="ml-2">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <div>{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Chat input, only if connected */}
            <div className="p-4 border-t bg-white flex items-center gap-2">
              {!canChat ? (
                <div className="text-red-500 flex-1">
                  {connectionStatus === 'pending' && 'You must wait for your connection request to be accepted to chat.'}
                  {connectionStatus === 'rejected' && 'Your connection request was rejected. You cannot chat.'}
                  {connectionStatus === null && 'You must connect with this user to chat.'}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="flex-1 border rounded px-3 py-2"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                    placeholder="Type your message..."
                    disabled={!canChat}
                  />
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    onClick={sendMessage}
                    disabled={!canChat || !input.trim()}
                  >
                    Send
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <svg width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-6 text-gray-300">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <h1 className="text-2xl font-semibold mb-2 text-gray-700">Welcome to Messages</h1>
            <p className="text-gray-500 mb-6 text-center max-w-md">Once you connect with a freelancer, you’ll be able to chat and collaborate here</p>
            {/* Dropdown replaces manual input */}
            <select
              className="border rounded px-3 py-2 mb-2"
              value={receiver}
              onChange={e => {
                setReceiver(e.target.value);
                setSelectedUser(e.target.value);
              }}
            >
              <option value="">Start new chat...</option>
              {allUsers.map(user => (
                <option key={user.email} value={user.email}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}
      </main>
    </div>
  );
}