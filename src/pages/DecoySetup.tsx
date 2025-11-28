import { useState } from 'react';
import { FaCalculator, FaCloud, FaFileAlt, FaShieldAlt } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { useAuth } from '@/contexts/AuthContext';
import type { DecoyConfig } from '@/types';

export function DecoySetup() {
  const { user } = useAuth();
  const [config, setConfig] = useState<DecoyConfig>({
    enabled: false,
    app_type: 'calculator',
    activation_gesture: 'triple_tap',
  });

  const handleSave = () => {
    // Save to localStorage or Supabase
    localStorage.setItem('decoyConfig', JSON.stringify(config));
    alert('Decoy mode configuration saved');
  };

  return (
    <div className="pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Decoy Mode</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure a discreet interface to hide emergency features
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enable Decoy Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaShieldAlt className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-dark-text">
                    Activate Decoy Interface
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hide emergency features behind a normal-looking app
                  </p>
                </div>
              </div>
              <Toggle
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
            </div>
          </CardContent>
        </Card>

        {config.enabled && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Decoy App Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  id="appType"
                  label="Choose Decoy App Appearance"
                  value={config.app_type}
                  onChange={(e) =>
                    setConfig({ ...config, app_type: e.target.value as DecoyConfig['app_type'] })
                  }
                  options={[
                    { value: 'calculator', label: 'Calculator' },
                    { value: 'weather', label: 'Weather' },
                    { value: 'notes', label: 'Notes' },
                  ]}
                />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      config.app_type === 'calculator'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setConfig({ ...config, app_type: 'calculator' })}
                  >
                    <FaCalculator className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="text-sm font-medium text-center">Calculator</p>
                  </div>
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      config.app_type === 'weather'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setConfig({ ...config, app_type: 'weather' })}
                  >
                    <FaCloud className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="text-sm font-medium text-center">Weather</p>
                  </div>
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      config.app_type === 'notes'
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setConfig({ ...config, app_type: 'notes' })}
                  >
                    <FaFileAlt className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="text-sm font-medium text-center">Notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Activation Gesture</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  id="gesture"
                  label="How to Access Emergency Features"
                  value={config.activation_gesture}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      activation_gesture: e.target.value as DecoyConfig['activation_gesture'],
                    })
                  }
                  options={[
                    { value: 'triple_tap', label: 'Triple Tap on Screen' },
                    { value: 'long_press', label: 'Long Press on Logo' },
                    { value: 'invisible_button', label: 'Invisible Button (Top-Right Corner)' },
                  ]}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Use this gesture to access emergency features while in decoy mode.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex gap-4">
          <Button variant="primary" onClick={handleSave} fullWidth>
            Save Configuration
          </Button>
          {config.enabled && (
            <Button variant="secondary" onClick={() => window.location.href = '/decoy'} fullWidth>
              Test Decoy Mode
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

