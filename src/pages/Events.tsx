import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendar, FaMapMarkerAlt, FaClock, FaChevronRight } from 'react-icons/fa';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { supabase } from '@/lib/supabase';
import type { Event, EventStatus } from '@/types';
import { format } from 'date-fns';

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<EventStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      let query = supabase.from('events').select('*').order('start_time', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents((data as Event[]) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Events</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage community events
            </p>
          </div>
          <Select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as EventStatus | 'all')}
            options={[
              { value: 'all', label: 'All Events' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            className="w-full sm:w-48"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
                <FaCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No events found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card hover className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">
                        {event.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[event.status]}`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FaClock className="w-4 h-4" />
                        <span>{format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-primary">
                      <span className="text-sm font-medium">View Details</span>
                      <FaChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

