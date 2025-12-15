'use client';
import { useEffect, useState } from 'react';
import { FaIdCard, FaFileCsv, FaFileExcel, FaUsers, FaUserClock, FaUserPlus, FaFilter } from 'react-icons/fa';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import api from '@/utils/fetchClient';
import { PageBreadcrumb } from '@/components/admin';

export default function MembershipReportPage() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 50
  });

  const fetchData = async () => {
    setLoading(true);
    setBackendError(false);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')));
      const result = await api.get(`/api/membership-reports/data?${params}`);
      setData(result.data.data);
    } catch (err) {
      if (err.isNetworkError) setBackendError(true);
    }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const result = await api.get('/api/membership-reports/summary');
      setSummary(result.data);
    } catch (err) {
      // Silently fail - summary is optional
    }
  };

  useEffect(() => {
    fetchData();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard icon={<FaUsers size={24} className="text-white"/>} title="Total Members" value={summary?.total_memberships} color="bg-blue-500" />
          <StatCard icon={<FaUserPlus size={24} className="text-white"/>} title="Active Members" value={summary?.active_members} color="bg-green-500" />
          <StatCard icon={<FaUserClock size={24} className="text-white"/>} title="Expiring Soon" value={summary?.expiring_soon} color="bg-yellow-500" />
          <StatCard icon={<FaUsers size={24} className="text-white"/>} title="New Members (30d)" value={summary?.new_members_last_30_days} color="bg-purple-500" />
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-amber-500 dark:text-amber-400" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Filter Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', start_date: '', end_date: '', page: 1, limit: 50 })}
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
        </div>

        <div className="space-y-8">
          {/* All Members Report */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">All Members Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
              <DownloadButton 
                icon={<FaFileCsv />} 
                title="All Members" 
                format="csv" 
                onClick={() => handleDownload('export/csv', 'all_members.csv')}
                disabled={downloading !== ''}
              />
              <DownloadButton 
                icon={<FaFileExcel />} 
                title="All Members" 
                format="excel" 
                onClick={() => handleDownload('export/excel', 'all_members.xlsx')}
                disabled={downloading !== ''}
              />
            </div>
          </div>

          {/* Expiring Members Report */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Expiring Members Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
              <DownloadButton 
                icon={<FaFileCsv />} 
                title="Expiring Members" 
                format="csv" 
                onClick={() => handleDownload('expiring/csv', 'expiring_members.csv')}
                disabled={downloading !== ''}
              />
              <DownloadButton 
                icon={<FaFileExcel />} 
                title="Expiring Members" 
                format="excel" 
                onClick={() => handleDownload('expiring/excel', 'expiring_members.xlsx')}
                disabled={downloading !== ''}
              />
            </div>
          </div>

          {/* New Members Report */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">New Members Report (Last 30 Days)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
              <DownloadButton 
                icon={<FaFileCsv />} 
                title="New Members" 
                format="csv" 
                onClick={() => handleDownload('new-members/csv', 'new_members.csv')}
                disabled={downloading !== ''}
              />
              <DownloadButton 
                icon={<FaFileExcel />} 
                title="New Members" 
                format="excel" 
                onClick={() => handleDownload('new-members/excel', 'new_members.xlsx')}
                disabled={downloading !== ''}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
