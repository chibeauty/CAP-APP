import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaShieldAlt, FaEdit, FaSave, FaTimes, FaCamera, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export function Profile() {
  const { profile, user, fetchUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Refresh profile
      if (fetchUserProfile) {
        fetchUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
    setIsEditing(false);
  };

  if (!profile || !user) {
    return (
      <div className="pb-20 md:pb-6 md:ml-64 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="pb-20 md:pb-6 md:ml-64 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Manage your account information and preferences
          </p>
        </motion.div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
            >
              <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Profile updated successfully!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <CardContent className="p-6 -mt-16">
              <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-4xl font-bold shadow-lg border-4 border-white dark:border-gray-800">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  {isEditing && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                      aria-label="Change avatar"
                    >
                      <FaCamera className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      {isEditing ? (
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="text-2xl font-bold"
                          placeholder="Full Name"
                        />
                      ) : (
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
                          {profile.full_name}
                        </h2>
                      )}
                    </div>
                    {!isEditing && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="shadow-md"
                        >
                          <FaEdit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold capitalize">
                      {profile.role}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <FaEnvelope className="w-4 h-4" />
                    <span>Email Address</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-dark-text text-lg">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <FaPhone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </div>
                  {isEditing ? (
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      type="tel"
                    />
                  ) : (
                    <p className="font-medium text-gray-900 dark:text-dark-text text-lg">
                      {profile.phone || 'Not provided'}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <FaShieldAlt className="w-4 h-4" />
                    <span>Account Role</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-dark-text text-lg capitalize">
                    {profile.role}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <FaUser className="w-4 h-4" />
                    <span>Account Created</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-dark-text text-lg">
                    {format(new Date(profile.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700"
                >
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1"
                  >
                    <FaSave className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1"
                  >
                    <FaTimes className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
