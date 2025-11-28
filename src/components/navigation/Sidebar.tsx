import { NavLink } from 'react-router-dom';
import { FaHome, FaCalendar, FaComments, FaExclamationTriangle, FaUser, FaCog, FaClock, FaFileAlt, FaQuestionCircle, FaShieldAlt, FaCalculator, FaSignOutAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
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
  const { isCollapsed, toggleSidebar } = useSidebar();

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
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? '80px' : '256px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 z-30"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between flex-shrink-0 px-4 mb-8">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.h1
                key="logo"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xl font-bold text-primary whitespace-nowrap"
              >
                CAP
              </motion.h1>
            ) : (
              <motion.h1
                key="logo-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-bold text-primary mx-auto"
              >
                C
              </motion.h1>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors text-gray-600 dark:text-gray-400"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <FaChevronRight className="w-4 h-4" /> : <FaChevronLeft className="w-4 h-4" />}
          </motion.button>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon] || FaCog;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-medium rounded-lg transition-colors min-h-tap group relative ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => signOut()}
          className={`flex items-center w-full ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors min-h-tap group relative`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <FaSignOutAlt className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

