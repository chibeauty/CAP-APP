import { FaQuestionCircle, FaPhone, FaEnvelope, FaComments, FaBook, FaShieldAlt } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function Help() {
  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Help & Support</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get help and learn how to use CAP
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card hover>
            <CardContent className="p-6">
              <FaShieldAlt className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-dark-text">
                Emergency Features
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Learn how to use the emergency alert system and communicate with security.
              </p>
              <Button variant="ghost" size="sm">
                Learn More
              </Button>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <FaBook className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-dark-text">
                User Guide
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comprehensive guide to all features and how to use them.
              </p>
              <Button variant="ghost" size="sm">
                Read Guide
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <FaPhone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-dark-text">Phone</p>
                  <p className="text-gray-600 dark:text-gray-400">1-800-CAP-HELP</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaEnvelope className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-dark-text">Email</p>
                  <p className="text-gray-600 dark:text-gray-400">support@cap.app</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaComments className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-dark-text">Live Chat</p>
                  <p className="text-gray-600 dark:text-gray-400">Available 24/7</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text mb-1">
                  How do I send an emergency alert?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tap the red emergency button or navigate to the Emergency screen. Select your
                  alert level and tap "Send Emergency Alert".
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text mb-1">
                  What is Decoy Mode?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Decoy Mode hides emergency features behind a normal-looking app interface. Access
                  emergency features using the configured gesture.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text mb-1">
                  How do I connect a wearable device?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Go to Wearables in the menu, tap "Add Device", and follow the pairing
                  instructions. Make sure Bluetooth is enabled.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

