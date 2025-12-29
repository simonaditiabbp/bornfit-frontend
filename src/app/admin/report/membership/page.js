'use client';
import { useEffect, useState } from 'react';
import { FaIdCard, FaFileCsv, FaFileExcel, FaUsers, FaUserClock, FaUserPlus, FaFilter } from 'react-icons/fa';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import api from '@/utils/fetchClient';
import { PageBreadcrumb } from '@/components/admin';

export default function MembershipReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    search: '',
    page: 1,
    limit: 25
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, total_pages: 1 });

  const fetchData = async () => {
    setLoading(true);
    setBackendError(false);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')));
      const result = await api.get(`/api/membership-reports/data?${params}`);
      setData(result.data.data);
      if (result.data.pagination) {
        setPagination(result.data.pagination);
      }
    } catch (err) {
      if (err.isNetworkError) setBackendError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleDownload = async (endpoint, filename) => {
    setDownloading(filename);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')));
      const blob = await api.get(`/api/membership-reports/${endpoint}?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      if (err?.status === 404) return alert(err.data?.message || 'No data found for selected date range.'), location.reload();
      if (err?.status === 401) return alert('Your session has expired.'), location.reload();
      alert('An error occurred while downloading the report.');
    }
    setDownloading('');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (backendError) return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;

  const StatCard = ({ icon, title, value, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 shadow-lg`}>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '...' : value}</p>
      </div>
    </div>
  );

  const DownloadButton = ({ icon, title, format, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 w-full ${
        disabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 
        format === 'csv' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
    >
      {icon}
      {disabled ? 'Downloading...' : `Download ${format.toUpperCase()}`}
    </button>
  );

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership Reports' }
        ]}
      />
      
      <div className="m-5 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h1 className="text-2xl font-bold text-black dark:text-amber-400 mb-6">Membership Report</h1>

        {/* Download Buttons */}
        <div className="space-y-4 mb-5">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Download Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bookings</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('export/csv', 'all_members.csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('export/excel', 'all_members.xlsx')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attendance</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('expiring/csv', 'expiring_members.csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('expiring/excel', 'expiring_members.xlsx')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Trainer Performance</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('new-members/csv', 'new_members.csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('new-members/excel', 'new_members.xlsx')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-amber-500 dark:text-amber-400" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Filter Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="frozen">Frozen</option>
              </select>
            </div>
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
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Pencarian</label>
              <input
                type="text"
                placeholder="Cari member, trainer, plan, dsb..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', start_date: '', end_date: '', search: '', page: 1, limit: 50 })}
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
                <th className="px-4 py-3">Member ID</th>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">No data found</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 font-mono text-xs">{item.member_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{item.member_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{item.membership_plan}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Level {item.plan_level}</div>
                    </td>
                    <td className="px-4 py-3">{item.duration}</td>
                    <td className="px-4 py-3">{formatDate(item.start_date)}</td>
                    <td className="px-4 py-3">{formatDate(item.end_date)}</td>
                    <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3 text-white">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'active' ? 'bg-green-600' :
                        item.status === 'expired' ? 'bg-red-600' :
                        'bg-yellow-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Halaman {pagination.page} dari {pagination.total_pages} | Total Data: {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                disabled={pagination.page >= pagination.total_pages || loading}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        </div>        
      </div>
    </div>
  );
}
