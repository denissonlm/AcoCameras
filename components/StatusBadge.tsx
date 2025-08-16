import React from 'react';
import { CameraStatus } from '../types';

interface StatusBadgeProps {
  status: CameraStatus;
}

const statusConfig = {
  [CameraStatus.Online]: {
    text: 'Online',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300',
    icon: '✅'
  },
  [CameraStatus.Offline]: {
    text: 'Offline',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300',
    icon: '🔴'
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  
  // Gracefully handle any unexpected status values that might still be in the DB
  if (!config) {
    return (
       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>
        <span role="img" aria-label="Desconhecido">❔</span>
        <span className="ml-1.5">{status || 'Desconhecido'}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>
      <span role="img" aria-label={config.text}>{config.icon}</span>
      <span className="ml-1.5">{config.text}</span>
    </span>
  );
};

export default StatusBadge;