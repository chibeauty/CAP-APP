import { useState, useEffect } from 'react';
import { FaFileAlt, FaPlus, FaCalendar, FaMapMarkerAlt, FaSearch, FaFilter, FaDownload, FaEye } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [filteredReports, setFilteredReports] = useState<IncidentReport[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReports();
    } else {
      // For demo purposes, show empty state
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    filterReports();
  }, [searchQuery, reports]);

  const fetchReports = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const reportsData = (data as IncidentReport[]) || [];
      setReports(reportsData);
      setFilteredReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    if (!searchQuery.trim()) {
      setFilteredReports(reports);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reports.filter(
      (report) =>
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query)
    );
    setFilteredReports(filtered);
  };

  const handleSubmitReport = async () => {
    if (!user || !title.trim() || !description.trim()) return;

    try {
      // Get user location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch (geoError) {
          console.log('Location not available:', geoError);
        }
      }

      const { error } = await supabase.from('incident_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        location: location,
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

  const handleViewReport = (report: IncidentReport) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const getStatusBadge = (report: IncidentReport) => {
    // You can add status field to IncidentReport type if needed
    return (
      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
        Active
      </span>
    );
  };

  return (
    <div className="pb-20 md:pb-6 md:ml-64 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Incident Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Submit and manage incident reports
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setShowAddModal(true)} className="shadow-lg">
              <FaPlus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </motion.div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports by title or description..."
                    className="pl-12"
                  />
                </div>
                <Button variant="ghost" className="px-4">
                  <FaFilter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                  <FaFileAlt className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">
                  {searchQuery ? 'No reports found' : 'No reports yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Create your first incident report to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowAddModal(true)} size="lg">
                    <FaPlus className="w-5 h-5 mr-2" />
                    Create Your First Report
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2 line-clamp-2">
                            {report.title}
                          </h3>
                          {getStatusBadge(report)}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            aria-label="View report"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
                            aria-label="Download report"
                          >
                            <FaDownload className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                        {report.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <FaCalendar className="w-4 h-4" />
                            {format(new Date(report.created_at), 'MMM d, yyyy')}
                          </div>
                          {report.location && (
                            <div className="flex items-center gap-1">
                              <FaMapMarkerAlt className="w-4 h-4" />
                              <span className="text-xs">
                                {report.location.lat.toFixed(2)}, {report.location.lng.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add Report Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="New Incident Report"
        >
          <div className="space-y-5">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Your location will be automatically included if location services are enabled.
              </p>
            </div>

            <Input
              id="title"
              label="Report Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the incident"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about the incident..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text min-h-[150px] resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={handleSubmitReport} fullWidth>
                <FaPlus className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
              <Button variant="ghost" onClick={() => setShowAddModal(false)} fullWidth>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Report Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={selectedReport?.title || 'Report Details'}
        >
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Description
                </h3>
                <p className="text-gray-900 dark:text-dark-text">{selectedReport.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Date Reported
                  </h3>
                  <p className="text-gray-900 dark:text-dark-text">
                    {format(new Date(selectedReport.created_at), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
                {selectedReport.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Location
                    </h3>
                    <p className="text-gray-900 dark:text-dark-text text-sm">
                      {selectedReport.location.lat.toFixed(4)}, {selectedReport.location.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="primary" onClick={() => setShowViewModal(false)} fullWidth>
                  Close
                </Button>
                <Button variant="ghost" fullWidth>
                  <FaDownload className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
