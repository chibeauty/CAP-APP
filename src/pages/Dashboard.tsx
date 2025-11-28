import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaExclamationTriangle, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Event, Alert } from '@/types';
import { format } from 'date-fns';

export function Dashboard() {
  const { profile } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'upcoming')
        .order('start_time', { ascending: true })
        .limit(3);

      if (events) setUpcomingEvents(events as Event[]);

      // Fetch recent alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (alerts) setRecentAlerts(alerts as Alert[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            Welcome back, {profile?.full_name || 'User'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stay safe and connected with your community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Events</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                    {upcomingEvents.length}
                  </p>
                </div>
                <FaCalendar className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                    {recentAlerts.filter((a) => a.status === 'active').length}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <div className="mt-1">
                    <StatusIndicator status="safe" label="Safe" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Events</CardTitle>
                <Link to="/events">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No upcoming events
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-dark-text">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FaClock className="w-4 h-4" />
                          {format(new Date(event.start_time), 'MMM d, h:mm a')}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Alerts</CardTitle>
                <Link to="/communications">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              ) : recentAlerts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent alerts
                </p>
              ) : (
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

