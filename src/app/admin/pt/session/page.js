"use client";
import PTSessionDataTable from "./DataTable";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackendErrorFallback from "@/components/BackendErrorFallback";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTSessionListPage() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainners, setTrainners] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    // Fetch plans, members, trainners for display
    const fetchMeta = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resPlans = await fetch(`${API_URL}/api/ptsessionplans`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resMembers = await fetch(`${API_URL}/api/users/filter?role=member`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const resTrainners = await fetch(`${API_URL}/api/users/filter?role=trainner`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (resPlans.ok) setPlans(await resPlans.json());
        if (resMembers.ok) setMembers(await resMembers.json());
        if (resTrainners.ok) setTrainners(await resTrainners.json());
      } catch {}
    };
    fetchMeta();
    const fetchSessions = async () => {
      setLoading(true);
      setBackendError(false);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const res = await fetch(`${API_URL}/api/personaltrainersessions/paginated?page=${page}&limit=${perPage}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error("Gagal fetch sessions");
        const result = await res.json();
        setSessions(result.sessions|| []);
        setTotalRows(result.total || 0);
      } catch (err) {
        setBackendError(true);
      }
      setLoading(false);
    };
    fetchSessions();
  }, [page, perPage]);

  if (backendError) {
    return <BackendErrorFallback onRetry={() => window.location.reload()} />;
  }
  if (loading) {
    return <div className="text-blue-600 text-center font-medium mt-20">Loading...</div>;
  }

  

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-blue-700">PT Session List</h1>
            <Link
                href="/admin/pt/session/insert"
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
            >
                Tambah PT Session
            </Link>
        </div>
        {/* <div className="text-gray-500">Total: {totalRows}</div> */}
    <PTSessionDataTable
      data={sessions}
      plans={plans}
      members={members}
      trainners={trainners}
      pagination
      paginationServer
      paginationTotalRows={totalRows}
      paginationPerPage={perPage}
      currentPage={page}
      onChangePage={setPage}
      onChangeRowsPerPage={setPerPage}
      paginationRowsPerPageOptions={[10, 25, 50]}
    />
    </div>
  );
}
