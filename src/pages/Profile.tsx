import { FaUser, FaEnvelope, FaPhone, FaShieldAlt } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export function Profile() {
  const { profile, user } = useAuth();

  if (!profile || !user) {
    return (
      <div className="pb-20 md:pb-6 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your account information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    {profile.full_name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 capitalize">{profile.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <FaEnvelope className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-dark-text">{user.email}</p>
                  </div>
                </div>
                {profile.phone && (
                  <div className="flex items-start gap-3">
                    <FaPhone className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-dark-text">
                        {profile.phone}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                    <p className="font-medium text-gray-900 dark:text-dark-text capitalize">
                      {profile.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaUser className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      {format(new Date(profile.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

