import { useState, useEffect } from 'react';
import { FaFileAlt, FaPlus, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { IncidentReport } from '@/types';
import { format } from 'date-fns';

export function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as IncidentReport[]) || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!user || !title.trim() || !description.trim()) return;

    try {
      const { error } = await supabase.from('incident_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
      });

      if (error) throw error;
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    }
  };

  return (
    <div className="pb-20 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
              Incident Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Submit and view incident reports
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No reports yet</p>
              <Button onClick={() => setShowAddModal(true)}>
                <FaPlus className="w-4 h-4 mr-2" />
                Create Your First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">
                      {report.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{report.description}</p>
                  {report.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <FaMapMarkerAlt className="w-4 h-4" />
                      {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="New Incident Report"
        >
          <div className="space-y-4">
            <Input
              id="title"
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the incident"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about the incident..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text min-h-[150px]"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSubmitReport} fullWidth>
                Submit Report
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

