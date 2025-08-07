"use client";
import React from 'react';

interface OrderStatusProps {
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  className?: string;
}

export default function OrderStatus({ status, className = '' }: OrderStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏳'
        };
      case 'paid':
        return {
          label: 'Paid',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🔄'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: '🎉'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color} ${className}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
} 