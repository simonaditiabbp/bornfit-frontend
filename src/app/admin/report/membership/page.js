'use client';
import { useEffect, useState } from 'react';
import { FaIdCard } from 'react-icons/fa';
import toast from 'react-hot-toast';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import api from '@/utils/fetchClient';
import { PageBreadcrumb } from '@/components/admin';
import { ReportDownloadSection, ReportFilterSection, ReportPagination } from '@/components/admin/report';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDownload = async (type, format) => {
    setDownloading(`${type}-${format}`);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')));
      const blob = await api.get(`/api/membership-reports/${type}/${format}?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      a.download = `${type}_membership_${new Date().getTime()}.${extension}`;
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
        <ReportDownloadSection 
          title="Download Reports"
          downloadOptions={[
            { label: 'All Members', type: 'export' },
            { label: 'Expiring Members', type: 'expiring' },
            { label: 'New Members', type: 'new-members' }
          ]}
          onDownload={handleDownload}
          downloading={downloading}
        />
        
        {/* Filters */}
        <ReportFilterSection 
          title="Filter Data"
          filterFields={[
            { key: 'status', label: 'Status', type: 'select', options: [
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'frozen', label: 'Frozen' }
            ]},
            { key: 'start_date', label: 'Start Date', type: 'date' },
            { key: 'end_date', label: 'End Date', type: 'date' },
            { key: 'search', label: 'Pencarian', type: 'text', placeholder: 'Cari member, trainer, plan, dsb...' }
          ]}
          filters={filters}
          onFilterChange={setFilters}
          onReset={() => setFilters({ status: '', start_date: '', end_date: '', search: '', page: 1, limit: 25 })}
        />

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
          <ReportPagination 
            pagination={pagination}
            currentLimit={filters.limit}
            limitOptions={[25, 50, 100]}
            loading={loading}
            onPageChange={(newPage) => setFilters(f => ({ ...f, page: newPage }))}
            onLimitChange={(newLimit) => setFilters({ ...filters, limit: newLimit, page: 1 })}
          />
        </div>        
      </div>
    </div>
  );
}
