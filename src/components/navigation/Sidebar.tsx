import { NavLink } from 'react-router-dom';
import { FaHome, FaCalendar, FaComments, FaExclamationTriangle, FaUser, FaCog, FaClock, FaFileAlt, FaQuestionCircle, FaShieldAlt, FaCalculator, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { NAVIGATION_ITEMS } from '@/lib/constants';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home: FaHome,
  Calendar: FaCalendar,
  MessageCircle: FaComments,
  AlertTriangle: FaExclamationTriangle,
  User: FaUser,
  Settings: FaCog,
  Watch: FaClock,
  FileText: FaFileAlt,
  HelpCircle: FaQuestionCircle,
  Shield: FaShieldAlt,
  Calculator: FaCalculator,
};

export function Sidebar() {
  const { profile, signOut } = useAuth();

  const menuItems = [
    ...NAVIGATION_ITEMS,
    { id: 'settings', label: 'Settings', path: '/settings', icon: 'Settings' },
    { id: 'wearables', label: 'Wearables', path: '/wearables', icon: 'Watch' },
    { id: 'reports', label: 'Reports', path: '/reports', icon: 'FileText' },
    { id: 'help', label: 'Help', path: '/help', icon: 'HelpCircle' },
  ];

  if (profile?.role === 'security' || profile?.role === 'admin') {
    menuItems.push({ id: 'security', label: 'Security Dashboard', path: '/security', icon: 'Shield' });
  }

  menuItems.push({ id: 'decoy', label: 'Decoy Setup', path: '/decoy-setup', icon: 'Calculator' });

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 z-30"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <h1 className="text-xl font-bold text-primary">CAP</h1>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon] || FaCog;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-tap ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => signOut()}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors min-h-tap"
        >
          <FaSignOutAlt className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}

