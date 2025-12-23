'use client';
import { useEffect, useState } from 'react';
import { FaChartLine, FaFileCsv, FaFileExcel, FaMoneyBillWave, FaFilter } from 'react-icons/fa';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import api from '@/utils/fetchClient';
import { PageBreadcrumb } from '@/components/admin';

export default function RevenueReportPage() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
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
    setBackendError(false);
    try {
      const params = new URLSearchParams(filters);
      const result = await api.get(`/api/revenue-reports/data?${params}`);
      setData(result.data.data);
    } catch (err) {
      if (err.isNetworkError) setBackendError(true);
    }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({ start_date: filters.start_date, end_date: filters.end_date });
      const result = await api.get(`/api/revenue-reports/summary?${params}`);
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

  const handleDownload = async (type, format) => {
    setDownloading(`${type}-${format}`);
    try {
      const params = new URLSearchParams({ start_date: filters.start_date, end_date: filters.end_date });
      const blob = await api.get(`/api/revenue-reports/${type}/${format}?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      a.download = `${type}_revenue_${new Date().getTime()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      if (err?.status === 404) return alert(err.data?.message || 'No data found for selected date range.'), location.reload();
      if (err?.status === 401) return alert('Your session has expired.'), location.reload();
      alert('An error occurred while downloading the report.');
    } finally {
      setDownloading('');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (backendError) return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;

  const StatCard = ({ title, value, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700`}>
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{loading ? '...' : value}</p>
    </div>
  );

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaChartLine className="w-3 h-3" />, label: 'Revenue Reports' }
        ]}
      />
      
      <div className="m-5 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h1 className="text-2xl font-bold text-black dark:text-amber-400 mb-6">Revenue Summary</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard title="Total Revenue" value={formatCurrency(summary?.total_revenue || 0)} color="text-green-400" />
          <StatCard title="Membership Revenue" value={formatCurrency(summary?.membership_revenue.total || 0)} color="text-blue-400" />
          <StatCard title="Class Revenue" value={formatCurrency(summary?.class_purchases.total || 0)} color="text-purple-400" />
          <StatCard title="PT Session Revenue" value={formatCurrency(summary?.pt_sessions.total || 0)} color="text-yellow-400" />
          <StatCard title="Transfer Revenue" value={formatCurrency(summary?.transfer_fees.total || 0)} color="text-orange-400" />
          <StatCard title="Freeze Revenue" value={formatCurrency(summary?.freeze_fees.total || 0)} color="text-pink-400" />
        </div>

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
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Amount</th>
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
                    <td className="px-4 py-3">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 text-white">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.type === 'Membership' ? 'bg-blue-600' :
                        item.type === 'Class Purchase' ? 'bg-purple-600' :
                        item.type === 'PT Session' ? 'bg-yellow-600' :
                        item.type === 'Freeze Fee' ? 'bg-orange-600' :
                        item.type === 'Transfer Fee' ? 'bg-pink-600' :
                        'bg-gray-600'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3">{item.customer_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Download Buttons */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Download Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Membership Revenue</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload('membership', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                    <FaFileCsv className="inline mr-1" /> CSV
                  </button>
                  <button onClick={() => handleDownload('membership', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                    <FaFileExcel className="inline mr-1" /> Excel
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Class Purchase Revenue</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload('class-purchase', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                    <FaFileCsv className="inline mr-1" /> CSV
                  </button>
                  <button onClick={() => handleDownload('class-purchase', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                    <FaFileExcel className="inline mr-1" /> Excel
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Daily Revenue</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload('daily', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                    <FaFileCsv className="inline mr-1" /> CSV
                  </button>
                  <button onClick={() => handleDownload('daily', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                    <FaFileExcel className="inline mr-1" /> Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
