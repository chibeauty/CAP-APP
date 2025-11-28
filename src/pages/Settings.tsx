import { FaMoon, FaSun, FaBell, FaShieldAlt, FaGlobe } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';

export function Settings() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your preferences</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <FaMoon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <FaSun className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text">Dark Mode</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Switch between light and dark theme
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaBell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      Push Notifications
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive alerts and updates
                    </p>
                  </div>
                </div>
                <Toggle defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaShieldAlt className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      Emergency Alerts
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Critical alerts only
                    </p>
                  </div>
                </div>
                <Toggle defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language & Region</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                id="language"
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                ]}
                defaultValue="en"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaGlobe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      Location Sharing
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Share location during emergencies
                    </p>
                  </div>
                </div>
                <Toggle defaultChecked />
              </div>
              <Button variant="secondary" fullWidth>
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

