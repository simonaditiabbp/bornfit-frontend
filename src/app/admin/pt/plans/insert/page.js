"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PlanForm from "../PlanForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTPlanInsertPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_URL}/api/ptsessionplans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      router.push("/admin/pt/plans");
    } catch (err) {
      alert("Gagal menyimpan plan");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Add PT Session Plan</h1>
      <PlanForm onSubmit={handleSubmit} onCancel={() => router.push('/admin/pt/plans')} loading={loading} />
    </div>
  );
}
