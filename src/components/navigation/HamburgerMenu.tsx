import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBars, FaTimes, FaCog, FaClock, FaFileAlt, FaQuestionCircle, FaShieldAlt, FaCalculator, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: 'settings', label: 'Settings', path: '/settings', icon: FaCog },
    { id: 'wearables', label: 'Wearables', path: '/wearables', icon: FaClock },
    { id: 'reports', label: 'Reports', path: '/reports', icon: FaFileAlt },
    { id: 'help', label: 'Help', path: '/help', icon: FaQuestionCircle },
  ];

  if (profile?.role === 'security' || profile?.role === 'admin') {
    menuItems.push({ id: 'security', label: 'Security Dashboard', path: '/security', icon: FaShieldAlt });
  }

  menuItems.push({ id: 'decoy', label: 'Decoy Setup', path: '/decoy-setup', icon: FaCalculator });

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-40 p-2 bg-white dark:bg-dark-surface rounded-lg shadow-lg min-h-tap min-w-tap"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-dark-surface z-30 md:hidden shadow-xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-primary">Menu</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 min-h-tap min-w-tap"
                    aria-label="Close menu"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
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
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors min-h-tap"
                  >
                    <FaSignOutAlt className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

