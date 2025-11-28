import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaCalendar, FaMapMarkerAlt, FaClock, FaUser, FaArrowLeft } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapWidget } from '@/components/map/MapWidget';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types';
import { format } from 'date-fns';

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data as Event);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-20 md:pb-6 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-gray-500 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pb-20 md:pb-6 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Event not found</p>
              <Link to="/events" className="mt-4 inline-block">
                <Button variant="primary">Back to Events</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/events" className="inline-flex items-center text-primary mb-4">
          <FaArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{event.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-dark-text">
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaClock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">End Time</p>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      {format(new Date(event.end_time), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      {event.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaCalendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium text-gray-900 dark:text-dark-text capitalize">
                      {event.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Map</CardTitle>
          </CardHeader>
          <CardContent>
            <MapWidget height="400px" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

