import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaMapMarkerAlt, FaMicrophone, FaShieldAlt } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { MapWidget } from '@/components/map/MapWidget';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { AlertLevel } from '@/types';
import { ALERT_LEVELS } from '@/lib/constants';

export function EmergencyAlert() {
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('medium');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { latitude, longitude } = useGeolocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmitAlert = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('alerts').insert({
        user_id: user.id,
        level: alertLevel,
        message: message || undefined,
        location: latitude && longitude ? { lat: latitude, lng: longitude } : undefined,
        status: 'active',
      });

      if (error) throw error;

      // Navigate to communications to connect with security
      navigate('/communications');
    } catch (error) {
      console.error('Error submitting alert:', error);
      alert('Failed to submit alert. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const alertLevelOptions = Object.entries(ALERT_LEVELS).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  return (
    <div className="pb-20 md:pb-6 min-h-screen bg-background-light dark:bg-dark-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
            Emergency Alert
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your location and alert will be sent to the security team
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                id="alertLevel"
                label="Select Alert Level"
                value={alertLevel}
                onChange={(e) => setAlertLevel(e.target.value as AlertLevel)}
                options={alertLevelOptions}
              />
              <div className="mt-4 p-4 rounded-lg border" style={{
                backgroundColor: ALERT_LEVELS[alertLevel].bgColor,
                borderColor: ALERT_LEVELS[alertLevel].borderColor,
              }}>
                <p className="text-sm font-medium" style={{ color: ALERT_LEVELS[alertLevel].color }}>
                  {ALERT_LEVELS[alertLevel].label} Alert
                </p>
                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                  {alertLevel === 'critical' && 'Immediate response required'}
                  {alertLevel === 'high' && 'Urgent attention needed'}
                  {alertLevel === 'medium' && 'Moderate concern'}
                  {alertLevel === 'low' && 'Minor issue'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Location</CardTitle>
            </CardHeader>
            <CardContent>
              {latitude && longitude ? (
                <>
                  <MapWidget
                    center={{ lat: latitude, lng: longitude }}
                    showUserLocation
                    height="300px"
                  />
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Requesting location...
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the situation..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text min-h-[100px]"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Audio Recording (Optional)
                </label>
                <AudioRecorder />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={handleSubmitAlert}
              isLoading={isSubmitting}
              className="min-h-[60px] text-lg"
            >
              <FaShieldAlt className="w-5 h-5 mr-2" />
              Send Emergency Alert
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

