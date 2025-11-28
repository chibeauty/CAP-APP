import { useState, useEffect } from 'react';
import { FaPlus, FaBluetooth, FaBatteryFull, FaBatteryThreeQuarters, FaBatteryHalf, FaBatteryQuarter, FaBatteryEmpty, FaTrash, FaSync, FaWifi, FaSignal } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Wearable } from '@/types';
import { format } from 'date-fns';

export function Wearables() {
  const { user } = useAuth();
  const [wearables, setWearables] = useState<Wearable[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('smartwatch');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

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
      // Try Web Bluetooth API if available
      let macAddress = '';
      if ('bluetooth' in navigator) {
        try {
          const device = await (navigator as any).bluetooth.requestDevice({
            filters: [{ services: ['battery_service'] }],
            optionalServices: ['device_information']
          });
          macAddress = device.id || '';
        } catch (bluetoothError) {
          console.log('Bluetooth pairing skipped or failed:', bluetoothError);
        }
      }

      const { error } = await supabase.from('wearables').insert({
        user_id: user.id,
        name: deviceName.trim(),
        device_type: deviceType,
        mac_address: macAddress,
        is_connected: !!macAddress,
        battery_level: Math.floor(Math.random() * 100),
        last_sync: new Date().toISOString(),
      });

      if (error) throw error;
      setShowAddModal(false);
      setDeviceName('');
      setDeviceType('smartwatch');
      fetchWearables();
    } catch (error) {
      console.error('Error adding wearable:', error);
      alert('Failed to add device');
    }
  };

  const handleSync = async (deviceId: string) => {
    setSyncing(deviceId);
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { error } = await supabase
        .from('wearables')
        .update({
          last_sync: new Date().toISOString(),
          battery_level: Math.floor(Math.random() * 100),
          is_connected: true,
        })
        .eq('id', deviceId);

      if (error) throw error;
      fetchWearables();
    } catch (error) {
      console.error('Error syncing device:', error);
    } finally {
      setSyncing(null);
    }
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return FaBatteryEmpty;
    if (level >= 80) return FaBatteryFull;
    if (level >= 60) return FaBatteryThreeQuarters;
    if (level >= 40) return FaBatteryHalf;
    if (level >= 20) return FaBatteryQuarter;
    return FaBatteryEmpty;
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level >= 60) return 'text-green-500';
    if (level >= 30) return 'text-yellow-500';
    return 'text-red-500';
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
    <div className="pb-20 md:pb-6 md:ml-64 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Wearables
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Manage your connected wearable devices and stay safe
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setShowAddModal(true)} className="shadow-lg">
              <FaPlus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </motion.div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : wearables.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                  <FaBluetooth className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">
                  No devices connected
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Connect your wearable devices to track your safety and receive alerts
                </p>
                <Button onClick={() => setShowAddModal(true)} size="lg">
                  <FaPlus className="w-5 h-5 mr-2" />
                  Add Your First Device
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wearables.map((device, index) => {
              const BatteryIcon = getBatteryIcon(device.battery_level);
              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            device.is_connected 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {device.is_connected ? (
                              <FaBluetooth className="w-6 h-6 text-white" />
                            ) : (
                              <FaBluetooth className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-dark-text">
                              {device.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {device.device_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDevice(device.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          aria-label="Remove device"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FaSignal className="w-4 h-4" />
                            Status
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            device.is_connected
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {device.is_connected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>

                        {device.battery_level !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <BatteryIcon className={`w-4 h-4 ${getBatteryColor(device.battery_level)}`} />
                              Battery
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    device.battery_level >= 60
                                      ? 'bg-green-500'
                                      : device.battery_level >= 30
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${device.battery_level}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${getBatteryColor(device.battery_level)}`}>
                                {device.battery_level}%
                              </span>
                            </div>
                          </div>
                        )}

                        {device.last_sync && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <FaWifi className="w-4 h-4" />
                              Last Sync
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                              {format(new Date(device.last_sync), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        )}

                        <div className="pt-3 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSync(device.id)}
                            disabled={syncing === device.id}
                            className="flex-1"
                          >
                            <FaSync className={`w-4 h-4 mr-2 ${syncing === device.id ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Wearable Device"
        >
          <div className="space-y-5">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <FaBluetooth className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                    Bluetooth Pairing
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Make sure Bluetooth is enabled and your device is in pairing mode. We'll attempt to connect automatically.
                  </p>
                </div>
              </div>
            </div>

            <Input
              id="deviceName"
              label="Device Name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., Apple Watch, Fitbit, Garmin"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Device Type
              </label>
              <Select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                options={[
                  { value: 'smartwatch', label: 'Smartwatch' },
                  { value: 'fitness_tracker', label: 'Fitness Tracker' },
                  { value: 'panic_button', label: 'Panic Button' },
                  { value: 'smart_ring', label: 'Smart Ring' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={handleAddDevice} fullWidth>
                <FaPlus className="w-4 h-4 mr-2" />
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

