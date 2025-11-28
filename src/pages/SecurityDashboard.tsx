import { useEffect, useState } from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaUsers, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { MapWidget } from '@/components/map/MapWidget';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Alert, User } from '@/types';
import { format } from 'date-fns';

export function SecurityDashboard() {
  const { profile } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch active alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (alerts) setActiveAlerts(alerts as Alert[]);

      // Fetch active users (users with active alerts or in events)
      // This would be a more complex query in production
      const { data: users } = await supabase.from('profiles').select('*').limit(10);
      if (users) setActiveUsers(users as User[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role !== 'security' && profile?.role !== 'admin') {
      return;
    }
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.role]);

  if (profile?.role !== 'security' && profile?.role !== 'admin') {
    return (
      <div className="pb-20 md:pb-6 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="text-center py-12">
              <FaShieldAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                You don't have permission to access this page
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor active alerts and user locations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                    {activeAlerts.length}
                  </p>
                </div>
                <FaExclamationTriangle className="w-10 h-10 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                    {activeUsers.length}
                  </p>
                </div>
                <FaUsers className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                    {'<'} 2min
                  </p>
                </div>
                <FaClock className="w-10 h-10 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              ) : activeAlerts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No active alerts
                </p>
              ) : (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <StatusIndicator status={alert.level} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {alert.message && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          {alert.message}
                        </p>
                      )}
                      {alert.location && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <FaMapMarkerAlt className="w-3 h-3" />
                          {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <MapWidget height="500px" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

