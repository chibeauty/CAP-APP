import { useState, useEffect } from 'react';
import { FaClock, FaPlus, FaBluetooth, FaBatteryHalf, FaTrash } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Wearable } from '@/types';

export function Wearables() {
  const { user } = useAuth();
  const [wearables, setWearables] = useState<Wearable[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWearables();
    }
  }, [user]);

  const fetchWearables = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wearables')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setWearables((data as Wearable[]) || []);
    } catch (error) {
      console.error('Error fetching wearables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async () => {
    if (!user || !deviceName.trim()) return;

    try {
      // In production, this would use Web Bluetooth API to pair
      const { error } = await supabase.from('wearables').insert({
        user_id: user.id,
        name: deviceName,
        device_type: 'smartwatch',
        is_connected: false,
      });

      if (error) throw error;
      setShowAddModal(false);
      setDeviceName('');
      fetchWearables();
    } catch (error) {
      console.error('Error adding wearable:', error);
      alert('Failed to add device');
    }
  };

  const handleRemoveDevice = async (id: string) => {
    try {
      const { error } = await supabase.from('wearables').delete().eq('id', id);
      if (error) throw error;
      fetchWearables();
    } catch (error) {
      console.error('Error removing wearable:', error);
    }
  };

  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Wearables</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your connected wearable devices
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : wearables.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FaClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No devices connected</p>
              <Button onClick={() => setShowAddModal(true)}>
                <FaPlus className="w-4 h-4 mr-2" />
                Add Your First Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wearables.map((device) => (
              <Card key={device.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FaClock className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-dark-text">
                          {device.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {device.device_type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove device"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <span
                        className={`font-medium ${
                          device.is_connected
                            ? 'text-success'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {device.is_connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    {device.battery_level !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Battery</span>
                        <div className="flex items-center gap-2">
                          <FaBatteryHalf className="w-4 h-4" />
                          <span className="font-medium">{device.battery_level}%</span>
                        </div>
                      </div>
                    )}
                    {device.last_sync && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
                        <span className="font-medium text-gray-900 dark:text-dark-text">
                          {new Date(device.last_sync).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Wearable Device"
        >
          <div className="space-y-4">
            <Input
              id="deviceName"
              label="Device Name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., Apple Watch, Fitbit"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Make sure Bluetooth is enabled and your device is in pairing mode.
            </p>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleAddDevice} fullWidth>
                Add Device
              </Button>
              <Button variant="ghost" onClick={() => setShowAddModal(false)} fullWidth>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

