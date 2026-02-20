'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/fetchClient';
import BackendErrorFallback from '@/components/BackendErrorFallback';
import { FaUser, FaSearch, FaIdCard } from 'react-icons/fa';
import { PageBreadcrumb, PageContainer, LoadingText, StyledDataTable } from '@/components/admin';
import dayjs from 'dayjs';

export default function MemberProfileListPage() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setBackendError(false);
      
      try {
        const params = new URLSearchParams({
          role: 'member',
          page: page.toString(),
          limit: perPage.toString(),
        });
        
        if (search && search.trim() !== '') {
          params.append('search', search);
        }
        
        const response = await api.get(`/api/users?${params.toString()}`);
        const usersData = response.data?.users || [];
        
        // Fetch memberships untuk setiap user
        const enrichedUsers = await Promise.all(usersData.map(async (user) => {
          try {
            const membershipData = await api.get(`/api/memberships/member/${user.id}?allStatus=true`);
            const memberships = membershipData.data?.memberships || [];
            const activeMembership = memberships.find(m => m.status === 'active');
            
            return {
              ...user,
              activeMembership: activeMembership || null,
              totalMemberships: memberships.length
            };
          } catch (err) {
            return {
              ...user,
              activeMembership: null,
              totalMemberships: 0
            };
          }
        }));
        
        setMembers(enrichedUsers);
        setTotalRows(response.data?.total || enrichedUsers.length);
      } catch (err) {
        console.error('Error fetching members:', err);
        setMembers([]);
        if (err.isNetworkError) {
          setBackendError(true);
        }
      }
      
      setLoading(false);
    };
    
    fetchMembers();
  }, [page, perPage, search]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      if (page !== 1) setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, page]);

  const handleChangePage = (newPage) => {
    const pageNum = typeof newPage === 'number' ? newPage : (Array.isArray(newPage) ? newPage[0] : Number(newPage));
    if (!pageNum || pageNum === page) return;
    setPage(pageNum);
  };

  const handleChangeRowsPerPage = (newPerPage) => {
    const perPageNum = typeof newPerPage === 'number' ? newPerPage : (Array.isArray(newPerPage) ? newPerPage[0] : Number(newPerPage));
    if (!perPageNum || perPageNum === perPage) return;
    setPerPage(perPageNum);
    if (page !== 1) setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
  };

  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
        </div>
      ),
      width: '200px',
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      cell: row => (
        <span className="text-gray-700 dark:text-gray-300 text-sm">{row.email}</span>
      ),
    },
    {
      name: 'Phone',
      selector: row => row.phone || '-',
      sortable: true,
      cell: row => (
        <span className="text-gray-700 dark:text-gray-300 text-sm">{row.phone || '-'}</span>
      ),
      width: '130px',
    },
    {
      name: 'Active Membership',
      selector: row => row.activeMembership?.membershipPlan?.name || '-',
      sortable: true,
      cell: row => {
        if (row.activeMembership) {
          return (
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {row.activeMembership.membershipPlan?.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Until {formatDate(row.activeMembership.end_date)}
              </span>
            </div>
          );
        }
        return (
          <span className="text-gray-400 dark:text-gray-500 text-sm italic">No active membership</span>
        );
      },
      width: '220px',
    },
    {
      name: 'Total Memberships',
      selector: row => row.totalMemberships,
      sortable: true,
      cell: row => (
        <div className="flex items-center justify-center">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
            {row.totalMemberships}
          </span>
        </div>
      ),
      center: true,
      width: '150px',
    },
    {
      name: 'Actions',
      cell: row => (
        <button
          onClick={() => router.push(`/admin/member-profile/${row.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
        >
          <FaUser className="w-3.5 h-3.5" />
          View Profile
        </button>
      ),
      center: true,
      width: '150px',
    },
  ];

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaIdCard className="w-3 h-3" />, label: 'Member Profiles' }
        ]}
      />
      
      <PageContainer>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Member Profiles
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View comprehensive member information including memberships, PT sessions, and activity history
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <LoadingText />
          ) : (
            <StyledDataTable
              columns={columns}
              data={members}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationDefaultPage={page}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              paginationRowsPerPageOptions={[10, 20, 30, 50]}
              highlightOnHover
              responsive
            />
          )}
        </div>
      </PageContainer>
    </div>
  );
}
