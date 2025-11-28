import { NavLink } from 'react-router-dom';
import { FaHome, FaCalendar, FaComments, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import { NAVIGATION_ITEMS } from '@/lib/constants';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home: FaHome,
  Calendar: FaCalendar,
  MessageCircle: FaComments,
  AlertTriangle: FaExclamationTriangle,
  User: FaUser,
};

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-gray-700 z-30 md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-tap min-w-tap px-4 transition-colors ${
                  isActive
                    ? 'text-primary dark:text-primary-light'
                    : 'text-gray-500 dark:text-gray-400'
                }`
              }
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

