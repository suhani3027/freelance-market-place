'use client';

import { useState } from 'react';
import Link from 'next/link';
import MessageButton from './MessageButton';

interface MessageCardProps {
  conversation: {
    otherUser: string;
    lastMessage?: {
      content: string;
      timestamp: string;
    };
    unreadCount: number;
  };
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const EnhancedMessageCard = ({ 
  conversation, 
  isSelected = false, 
  onClick,
  className = '' 
}: MessageCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getRelativeTime = (timestamp: string) => {
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

  const getInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  return (
    <div
      className={`relative p-4 cursor-pointer transition-all duration-200 rounded-xl ${
        isSelected 
          ? 'bg-white border-r-2 border-r-blue-500 shadow-lg' 
          : 'hover:bg-white hover:shadow-md'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative">
          <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg transition-transform duration-200 ${
            isHovered ? 'scale-110' : ''
          }`}>
            {getInitials(conversation.otherUser)}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {conversation.otherUser}
            </p>
            {conversation.lastMessage && (
              <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                {getRelativeTime(conversation.lastMessage.timestamp)}
              </span>
            )}
          </div>
          
          {conversation.lastMessage ? (
            <p className="text-xs text-slate-600 truncate leading-relaxed">
              {conversation.lastMessage.content}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No messages yet
            </p>
          )}
        </div>

        {/* Unread count */}
        {conversation.unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0">
            {conversation.unreadCount}
          </span>
        )}
      </div>

      {/* Quick actions on hover */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex space-x-2 opacity-0 animate-fade-in">
          <Link
            href={`/messages?user=${encodeURIComponent(conversation.otherUser)}`}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default EnhancedMessageCard;
