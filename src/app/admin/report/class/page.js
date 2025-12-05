'use client';
import { useEffect, useState } from 'react';
import { FaDumbbell, FaFileCsv, FaFileExcel, FaFilter } from 'react-icons/fa';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClassReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    class_type: '',
    page: 1,
    limit: 50
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')));
      const res = await fetch(`${API_URL}/api/class-reports/data?${params}`, {
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
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')));
      const res = await fetch(`${API_URL}/api/class-reports/${type}/${format}?${params}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = format === 'excel' ? 'xlsx' : 'csv';
        a.download = `${type}_class_${new Date().getTime()}.${extension}`;
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
      <div className="bg-gray-800 flex py-3 px-5 text-lg border-b border-gray-700">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <FaDumbbell className="w-4 h-4 me-2.5 text-amber-300" /> 
              <span className="ms-1 text-sm font-medium text-gray-200">Class Reports</span>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="m-5 p-5 bg-gray-800 border border-gray-700 rounded-lg">
        <h1 className="text-2xl font-bold text-amber-400 mb-6">Class & Event Data</h1>

        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-amber-400" />
            <h3 className="text-lg font-semibold text-gray-200">Filter Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Class Type</label>
              <select
                value={filters.class_type}
                onChange={(e) => setFilters({ ...filters, class_type: e.target.value, page: 1 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value="">All Types</option>
                <option value="Membership Only">Membership Only</option>
                <option value="Free">Free</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ start_date: '', end_date: '', class_type: '', page: 1, limit: 50 })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-3">Class Date</th>
                <th className="px-4 py-3">Class Name</th>
                <th className="px-4 py-3">Event Plan</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-400">No data found</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3">{formatDate(item.class_date)}</td>
                    <td className="px-4 py-3 font-semibold">{item.class_name || '-'}</td>
                    <td className="px-4 py-3">
                      <div>{item.event_plan_name}</div>
                      <div className="text-xs text-gray-400">{item.access_type}</div>
                    </td>
                    <td className="px-4 py-3">{item.instructor_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.class_type === 'Membership Only' ? 'bg-blue-600' :
                        item.class_type === 'Free' ? 'bg-green-600' :
                        'bg-purple-600'
                      }`}>
                        {item.class_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-green-400 font-semibold">{item.checked_in} checked-in</div>
                      <div className="text-xs text-gray-400">{item.booked} booked, {item.cancelled} cancelled</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-400">{formatCurrency(item.purchase_revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Download Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-200">Download Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Classes</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('classes', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('classes', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Attendance</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('attendance', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('attendance', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Event Plans</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('event-plans', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('event-plans', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Instructor Performance</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('instructor-performance', 'csv')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button onClick={() => handleDownload('instructor-performance', 'excel')} disabled={downloading !== ''} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600">
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
