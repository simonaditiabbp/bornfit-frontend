'use client';
import { useEffect, useState } from 'react';
import { FaUserCheck, FaFileCsv, FaFileExcel, FaFilter } from 'react-icons/fa';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CheckinReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    page: 1,
    limit: 50
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const params = new URLSearchParams(filters);
      const res = await fetch(`${API_URL}/api/checkin-reports/data?${params}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result.data.data);
      } else {
        setBackendError(true);
      }
    } catch (err) {
      setBackendError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDownload = async (type, format) => {
    setDownloading(`${type}-${format}`);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const params = new URLSearchParams({ start_date: filters.start_date, end_date: filters.end_date });
      const res = await fetch(`${API_URL}/api/checkin-reports/${type}/${format}?${params}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = format === 'excel' ? 'xlsx' : 'csv';
        a.download = `${type}_checkin_${new Date().getTime()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download report.');
      }
    } catch (err) {
      alert('An error occurred while downloading the report.');
    }
    setDownloading('');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (backendError) return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-200 dark:border-gray-700">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <FaUserCheck className="w-4 h-4 me-2.5 text-amber-500 dark:text-amber-300" /> 
              <span className="ms-1 text-sm font-medium text-gray-700 dark:text-gray-200">Check-in Reports</span>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="m-5 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h1 className="text-2xl font-bold text-amber-500 dark:text-amber-400 mb-6">Check-in Data</h1>

        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-amber-500 dark:text-amber-400" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Filter Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ start_date: '', end_date: '', page: 1, limit: 50 })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded transition w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Check-in Time</th>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">No data found</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3">{formatDate(item.checkin_time)}</td>
                    <td className="px-4 py-3 font-semibold">{item.user_name}</td>
                    <td className="px-4 py-3">{item.user_email}</td>
                    <td className="px-4 py-3">{item.user_phone}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{item.location || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Download Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Download Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">All Check-ins</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('export', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('export', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Daily Summary</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('daily-summary', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('daily-summary', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Member Frequency</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('member-frequency', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('member-frequency', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
