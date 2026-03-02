'use client';
import { useEffect, useState } from 'react';
import { FaChartLine } from 'react-icons/fa';
import toast from 'react-hot-toast';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import api from '@/utils/fetchClient';
import { PageBreadcrumb } from '@/components/admin';
import { ReportDownloadSection, ReportFilterSection, ReportPagination } from '@/components/admin/report';

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
    limit: 20,
    search: ''
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, total_pages: 1 });

  const fetchData = async () => {
    setLoading(true);
    setBackendError(false);
    try {
      const params = new URLSearchParams(filters);
      const result = await api.get(`/api/revenue-reports/data?${params}`);
      setData(result.data.data);
      if (result.data.pagination) {
        setPagination(result.data.pagination);
      }
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
      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('Download error:', err);
      if (err?.status === 404) {
        toast.error(err.data?.message || 'No data found for selected date range');
        return;
      }
      if (err?.status === 401) {
        toast.error('Your session has expired');
        setTimeout(() => location.reload(), 1500);
        return;
      }
      toast.error('An error occurred while downloading the report');
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
    const d = new Date(date);
    d.setHours(d.getHours() );

    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

        {/* Download Buttons */}
        <ReportDownloadSection 
          title="Download Reports"
          downloadOptions={[
            { label: 'All Payments', type: 'payment-all' },
            { label: 'Membership Revenue', type: 'membership' },
            { label: 'Class Purchase Revenue', type: 'class-purchase' },
            { label: 'Daily Revenue', type: 'daily' }
          ]}
          onDownload={handleDownload}
          downloading={downloading}
        />
        {/* Filters & Search */}
        <ReportFilterSection 
          title="Filter Data"
          filterFields={[
            { key: 'start_date', label: 'Start Date', type: 'date' },
            { key: 'end_date', label: 'End Date', type: 'date' },
            { key: 'search', label: 'Pencarian', type: 'text', placeholder: 'Cari nama, email, type, dsb...' }
          ]}
          filters={filters}
          onFilterChange={setFilters}
          onReset={() => setFilters({ start_date: '', end_date: '', page: 1, limit: 20, search: '' })}
        />

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
          {/* Pagination Controls */}
          <ReportPagination 
            pagination={pagination}
            currentLimit={filters.limit}
            limitOptions={[20, 50, 100]}
            loading={loading}
            onPageChange={(newPage) => setFilters(f => ({ ...f, page: newPage }))}
            onLimitChange={(newLimit) => setFilters({ ...filters, limit: newLimit, page: 1 })}
          />
        </div>        
      </div>
    </div>
  );
}
