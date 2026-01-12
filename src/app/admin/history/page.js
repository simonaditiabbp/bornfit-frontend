'use client';

import { useState, useEffect } from 'react';
import { FaHistory, FaFilter, FaSearch, FaEye, FaTrash, FaDownload } from 'react-icons/fa';
import api from '@/utils/fetchClient';
import LoadingSpin from '@/components/admin/LoadingSpin';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';

export default function HistoryPage() {
    dayjs.extend(utc);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });
    const [filters, setFilters] = useState({
        action: '',
        entity: '',
        user_id: '',
        startDate: '',
        endDate: '',
        user_name: '',
        status: '',
    });
    const [hideFetchActions, setHideFetchActions] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, pagination.limit, hideFetchActions]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
            });
            
            if (hideFetchActions) {
                params.append('exclude_action', 'fetch');
            }

            const response = await api.get(`/api/audit-logs?${params}`);
            if (response.status) {
                setLogs(response.data.logs);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        }
        setLoading(false);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLogs();
    };

    const emptyFilters = {
        action: '',
        entity: '',
        user_id: '',
        startDate: '',
        endDate: '',
        user_name: '',
        status: '',
    };

    const handleClearFilters = () => {
        setFilters(emptyFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLogs({
            ...emptyFilters,
            page: 1
        });
    };

    const handleViewDetail = (log) => {
        setSelectedLog(log);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this log?')) return;
        try {
            await api.delete(`/api/audit-logs/${id}`);
            fetchLogs();
        } catch (error) {
            console.error('Failed to delete log:', error);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: 1,
                limit: 999999,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
            });
            
            // Tambahkan filter untuk exclude action fetch jika checkbox dicentang
            if (hideFetchActions) {
                params.append('exclude_action', 'fetch');
            }

            const response = await api.get(`/api/audit-logs?${params}`);
            if (response.status) {
                const allLogs = response.data.logs;
                const csv = [
                    ['Timestamp', 'Action', 'Entity', 'Flag Name', 'User Name', 'Entity ID', 'Status'],
                    ...allLogs.map(log => [
                        dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
                        log.action,
                        log.entity,
                        log.flag_name,
                        log.user_name,
                        log.entity_id || '',
                        log.status || '',
                    ]),
                ]
                    .map(row => row.join(','))
                    .join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Failed to export logs:', error);
            alert('Failed to export logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getActionBadgeColor = (action) => {
        switch (action.toLowerCase()) {
            case 'insert':
                return 'bg-green-500 text-white';
            case 'update':
                return 'bg-blue-500 text-white';
            case 'delete':
                return 'bg-red-500 text-white';
            case 'checkin':
                return 'bg-amber-500 text-white';
            case 'login':
                return 'bg-purple-500 text-white';
            case 'resend':
                return 'bg-teal-500 text-white';
            case 'reject':
                return 'bg-red-600 text-white';
            case 'renew':
                return 'bg-green-600 text-white';
            case 'unfreeze':
                return 'bg-indigo-500 text-white';
            case 'export':
                return 'bg-black text-white';
            case 'fetch':
                return 'bg-gray-400 text-white';
            case 'send':
                return 'bg-teal-600 text-white';
            case 'send_email':
                return 'bg-teal-600 text-white';
            case 'bulk_send':
                return 'bg-teal-800 text-white';
            case 'bulk_send_email':
                return 'bg-teal-800 text-white';
            case 'book':
                return 'bg-emerald-500 text-white'
            case 'approve':
                return 'bg-green-700 text-white';
            case 'verify':
                return 'bg-pink-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status.toLowerCase()) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'failed':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-amber-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <FaHistory className="text-amber-400 dark:text-amber-400 text-3xl" />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">History & Audit Logs</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition"
                        >
                            <FaFilter /> Filters
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition"
                        >
                            <FaDownload /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Action</label>
                                <select
                                    value={filters.action}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2 text-gray-800 dark:text-gray-200"
                                >
                                    <option value="">All Actions</option>
                                    <option value="insert">Insert</option>
                                    <option value="update">Update</option>
                                    <option value="delete">Delete</option>
                                    <option value="checkin">Checkin</option>
                                    <option value="login">Login</option>
                                    <option value="resend">Resend</option>
                                    <option value="reject">Reject</option>
                                    <option value="renew">Renew</option>
                                    <option value="unfreeze">Unfreeze</option>
                                    <option value="export">Export</option>
                                    <option value="fetch">Fetch</option>
                                    <option value="send">Send</option>
                                    <option value="book">Book</option>
                                    <option value="approve">Approve</option>
                                    <option value="verify">Verify</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Entity</label>
                                <input
                                    type="text"
                                    value={filters.entity}
                                    onChange={(e) => handleFilterChange('entity', e.target.value)}
                                    placeholder="e.g., users, membership"
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2 text-gray-800 dark:text-gray-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2 text-gray-800 dark:text-gray-200"
                                >
                                    <option value="">Status</option>
                                    <option value="success">Success</option>
                                    <option value="error">Error</option>
                                    <option value="warning">Warning</option>
                                </select>
                            </div>                            

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Staff Username</label>
                                <input
                                    type="text"
                                    value={filters.user_name}
                                    onChange={(e) => handleFilterChange('user_name', e.target.value)}
                                    placeholder="Filter by Staff Username"
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2 text-gray-800 dark:text-gray-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Start Date</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2 text-gray-800 dark:text-gray-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">End Date</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-2 text-gray-800 dark:text-gray-200"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hideFetchActions}
                                    onChange={(e) => setHideFetchActions(e.target.checked)}
                                    className="w-4 h-4 text-amber-500 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 rounded focus:ring-amber-500 cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Hide &quot;Fetch&quot; actions
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleApplyFilters}
                                className="bg-amber-500 dark:bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
                        <div className="text-green-700 dark:text-green-400 text-sm font-semibold">Total Logs</div>
                        <div className="text-3xl font-bold text-green-900 dark:text-green-200">{pagination.total}</div>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
                        <div className="text-blue-700 dark:text-blue-400 text-sm font-semibold">Current Page</div>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-200">
                            {pagination.page} / {pagination.totalPages}
                        </div>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-lg p-4">
                        <div className="text-purple-700 dark:text-purple-400 text-sm font-semibold">Showing</div>
                        <div className="text-3xl font-bold text-purple-900 dark:text-purple-200">{logs.length} logs</div>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4">
                        <div className="text-amber-700 dark:text-amber-400 text-sm font-semibold">Per Page</div>
                        <div className="text-3xl font-bold text-amber-900 dark:text-amber-200">{pagination.limit}</div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {loading ? (
                    <div className="p-12">
                        <LoadingSpin />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <FaHistory className="mx-auto text-6xl mb-4 opacity-30" />
                        <p className="text-lg">No audit logs found.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Entity
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Flag Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Entity ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                                                {dayjs.utc(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                                                    {log.action.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                                                {log.entity}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 max-w-xs truncate">
                                                {log.flag_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                                                {log.user_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                                                {log.entity_id || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(log.status)}`}>
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <button
                                                    onClick={() => handleViewDetail(log)}
                                                    className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition cursor-pointer font-semibold"
                                                    title="View Details"
                                                >
                                                    <FaEye className="text-sm" />
                                                    <span>Detail</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</span>
                                <select
                                    value={pagination.limit}
                                    onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                                    className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-200"
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-semibold text-gray-800 dark:text-white transition"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-semibold text-gray-800 dark:text-white transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {showModal && selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                Audit Log Details
                            </h2>
                            <button onClick={() => setShowModal(false)}
                                className="p-2 rounded-full
                                            text-red-600 hover:text-red-200
                                            hover:bg-red-700
                                            dark:text-red-600 dark:hover:text-red-200 dark:hover:bg-red-700
                                            transition"
                                aria-label="Close modal"
                                >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Timestamp</div>
                                    <div className="text-lg font-bold">{dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Action</div>
                                    <span className={`px-3 py-1 rounded text-sm font-semibold ${getActionBadgeColor(selectedLog.action)}`}>
                                        {selectedLog.action.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Entity</div>
                                    <div className="text-lg">{selectedLog.entity}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Entity ID</div>
                                    <div className="text-lg">{selectedLog.entity_id || '-'}</div>
                                </div>                                
                                <div className="col-span-2">
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Flag Name</div>
                                    <div className="text-lg">{selectedLog.flag_name}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">User Name</div>
                                    <div className="text-lg">{selectedLog.user_name}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">User Email</div>
                                    <div className="text-lg">{selectedLog.user_email || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">User ID</div>
                                    <div className="text-lg">{selectedLog.user_id || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">IP Address</div>
                                    <div className="text-lg">{selectedLog.ip_address || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</div>
                                    <div className="text-lg">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(selectedLog.status || '-')}`}>
                                            {selectedLog.status.toUpperCase() || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {((selectedLog.action.toUpperCase() == "BULK_SEND" || selectedLog.action.toUpperCase() == "BULK_SEND_EMAIL") && selectedLog.response_data) && (
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Response Data</div>
                                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(JSON.parse(selectedLog.response_data), null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.request_body && (
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Request Body</div>
                                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(JSON.parse(selectedLog.request_body), null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.changes && (
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Changes</div>
                                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(JSON.parse(selectedLog.changes), null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.user_agent && (
                                <div>
                                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">User Agent</div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300">{selectedLog.user_agent}</div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
