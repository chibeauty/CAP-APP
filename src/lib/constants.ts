export const ALERT_LEVELS = {
  low: {
    label: 'Low',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    darkColor: 'text-blue-400',
    darkBgColor: 'dark:bg-blue-900/20',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    darkColor: 'text-yellow-400',
    darkBgColor: 'dark:bg-yellow-900/20',
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    darkColor: 'text-orange-400',
    darkBgColor: 'dark:bg-orange-900/20',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    darkColor: 'text-red-400',
    darkBgColor: 'dark:bg-red-900/20',
  },
} as const;

export const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Home', path: '/', icon: 'Home' },
  { id: 'events', label: 'Events', path: '/events', icon: 'Calendar' },
  { id: 'communications', label: 'Communications', path: '/communications', icon: 'MessageCircle' },
  { id: 'emergency', label: 'Emergency', path: '/emergency', icon: 'AlertTriangle' },
  { id: 'profile', label: 'Profile', path: '/profile', icon: 'User' },
] as const;

