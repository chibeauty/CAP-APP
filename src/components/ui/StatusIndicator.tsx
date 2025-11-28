import { AlertLevel } from '@/types';
import { ALERT_LEVELS } from '@/lib/constants';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

interface StatusIndicatorProps {
  status: 'safe' | 'warning' | 'danger' | AlertLevel;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  safe: {
    icon: FaCheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    darkColor: 'dark:text-success-light',
  },
  warning: {
    icon: FaExclamationTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    darkColor: 'dark:text-yellow-400',
  },
  danger: {
    icon: FaTimesCircle,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    darkColor: 'dark:text-accent-light',
  },
  low: {
    icon: FaInfoCircle,
    color: ALERT_LEVELS.low.color,
    bgColor: ALERT_LEVELS.low.bgColor,
    darkColor: ALERT_LEVELS.low.darkColor,
  },
  medium: {
    icon: FaExclamationTriangle,
    color: ALERT_LEVELS.medium.color,
    bgColor: ALERT_LEVELS.medium.bgColor,
    darkColor: ALERT_LEVELS.medium.darkColor,
  },
  high: {
    icon: FaExclamationTriangle,
    color: ALERT_LEVELS.high.color,
    bgColor: ALERT_LEVELS.high.bgColor,
    darkColor: ALERT_LEVELS.high.darkColor,
  },
  critical: {
    icon: FaTimesCircle,
    color: ALERT_LEVELS.critical.color,
    bgColor: ALERT_LEVELS.critical.bgColor,
    darkColor: ALERT_LEVELS.critical.darkColor,
  },
};

export function StatusIndicator({ status, label, size = 'md' }: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${config.bgColor} ${config.darkColor} ${config.color} rounded-full p-1.5`}>
        <Icon className={sizes[size]} />
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      )}
    </div>
  );
}

