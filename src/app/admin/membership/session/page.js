'use client';
import { useEffect, useState } from 'react';
import api from '@/utils/fetchClient';
import BackendErrorFallback from '../../../../components/BackendErrorFallback';
import MembershipSessionDataTable from './DataTable';
import { FaPlus, FaIdCard, FaSyncAlt, FaEnvelope } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, PageHeader, LoadingText } from '../../../../components/admin';

export default function MembershipSessionPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [sendingText, setSendingText] = useState('Send Bulk Reminder');

  const handleChangePage = (newPage) => {
    const pageNum = typeof newPage === 'number' ? newPage : (Array.isArray(newPage) ? newPage[0] : Number(newPage));
    if (!pageNum || pageNum === page) return;
    setPage(pageNum);
  };

  const handleChangeRowsPerPage = (newPerPage, currentPageArg) => {
    const perPageNum = typeof newPerPage === 'number' ? newPerPage : (Array.isArray(newPerPage) ? newPerPage[0] : Number(newPerPage));
    if (!perPageNum || perPageNum === perPage) return;
    setPerPage(perPageNum);
    if (page !== 1) setPage(1);
  };

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setBackendError(false);
      
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
        });
        
        if (search && search.trim() !== '') {
          params.append('search', search);
        }
        
        const data = await api.get(`/api/memberships?${params.toString()}`);
        setSessions(data.data?.memberships || []);
        setTotalRows(data.data?.total || 0);
      } catch (err) {
        setSessions([]);
        if (err.isNetworkError) {
          setBackendError(true);
        }
      }
      setLoading(false);
    };
    fetchSessions();
  }, [page, perPage, search]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const result = await api.post('/api/memberships/update-status-cron');
      if (result.status === 'success') {
        // Refresh data setelah update status berhasil
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
        });
        
        if (search && search.trim() !== '') {
          params.append('search', search);
        }
        
        const data = await api.get(`/api/memberships?${params.toString()}`);
        setSessions(data.data?.memberships || []);
        setTotalRows(data.data?.total || 0);
        
        // Tampilkan notifikasi sukses (opsional)
        alert('Membership status has been successfully updated!');
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
      alert('Failed to update membership status. Please try again.');
    }
    setRefreshing(false);
  };

  const handleSendBulkReminder = async () => {
    setSendingBulk(true);
    setSendingText('Sending...');

    try {
      const result = await api.post('/api/memberships/bulk-send-renewal-email', {}, {
        timeout: 10000
      });
      
      if (!result || !result.data) {
        alert('❌ Failed to queue job. Please try again.');
        setSendingBulk(false);
        setSendingText('Send Bulk Reminder');
        return;
      }

      const { jobId } = result.data;
      
      // Show success immediately - no waiting!
      alert(`✅ Bulk email job queued successfully!\n\n` +
        `Job ID: ${jobId}\n\n` +
        `Emails will be sent in the background.\n` +
        `Check audit logs (History) later for results.`);
      
      setSendingBulk(false);
      setSendingText('Send Bulk Reminder');
      
    } catch (error) {
      console.error('Error queueing bulk send:', error);
      setSendingBulk(false);
      setSendingText('Send Bulk Reminder');
      
      const errorMessage = error?.data?.message || error?.message || 'Unknown error';
      alert(`❌ Failed to queue bulk send job\n\n${errorMessage}`);
    }
  };

  if (backendError) return <BackendErrorFallback onRetry={() => { setBackendError(false); window.location.reload(); }} />;

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Membership' }
        ]}
      />
      
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Search member/plan..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full max-w-xs p-2 border text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-amber-200 rounded focus:outline-none text-base"
            />
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title="Update Membership Status"
            >
              <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Updating...' : 'Refresh Status'}
            </button>
            <button
                onClick={handleSendBulkReminder}
                disabled={sendingBulk}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Send renewal reminder emails to all members expiring within 7 days and all expired memberships"
              >
                <FaEnvelope className={sendingBulk ? 'animate-pulse' : ''} />
                {sendingText}
              </button>
          </div>
          <a
            href="/admin/membership/session/insert"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            <FaPlus />
            Add Session
          </a>
        </div>
        {loading ? (
          <LoadingText />
        ) : (
          <MembershipSessionDataTable 
            data={sessions}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            currentPage={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            paginationRowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </PageContainer>
    </div>
  );
}
