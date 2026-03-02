'use client';
import { useEffect, useState } from 'react';
import { FaChalkboardTeacher } from 'react-icons/fa';
import toast from 'react-hot-toast';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import api from '@/utils/fetchClient';
import { PageBreadcrumb } from '@/components/admin';
import { ReportDownloadSection, ReportFilterSection, ReportPagination } from '@/components/admin/report';

export default function PTSessionReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
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
      const result = await api.get(`/api/pt-session-reports/data?${params}`);
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
      const blob = await api.get(`/api/pt-session-reports/${type}/${format}?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      a.download = `${type}_pt_session_${new Date().getTime()}.${extension}`;
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
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
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

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaChalkboardTeacher className="w-3 h-3" />, label: 'PT Session Reports' }
        ]}
      />
      
      <div className="m-5 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h1 className="text-2xl font-bold text-black dark:text-amber-400 mb-6">PT Session Bookings</h1>

        {/* Download Buttons */}
        <ReportDownloadSection 
          title="Download Reports"
          downloadOptions={[
            { label: 'Bookings', type: 'bookings' },
            { label: 'Trainer Performance', type: 'trainer-performance' }
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
            { key: 'status', label: 'Status', type: 'select', options: [
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]},
            { key: 'search', label: 'Pencarian', type: 'text', placeholder: 'Cari member, trainer, plan, dsb...' }
          ]}
          filters={filters}
          onFilterChange={setFilters}
          onReset={() => setFilters({ start_date: '', end_date: '', status: '', search: '', page: 1, limit: 25 })}
        />

        {/* Data Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Booking Time</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Trainer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500 dark:text-gray-400">No data found</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3">{formatDate(item.booking_time)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{item.member_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.member_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{item.trainer_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.trainer_email}</div>
                    </td>
                    <td className="px-4 py-3">{item.plan_name}</td>
                    <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.plan_price)}</td>
                    <td className="px-4 py-3 text-white">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'completed' ? 'bg-green-600' :
                        item.status === 'confirmed' ? 'bg-blue-600' :
                        item.status === 'pending' ? 'bg-yellow-600' :
                        item.status === 'booked' ? 'bg-blue-600' :
                        'bg-red-600'
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
