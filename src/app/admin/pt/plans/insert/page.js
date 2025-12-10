"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaCog } from 'react-icons/fa';
import { PageBreadcrumb, PageContainerInsert, FormActions, FormInput, FormInputGroup } from '@/components/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PTPlanInsertPage() {
  const router = useRouter();
  
  const initialFormState = {
    name: "",
    duration_value: 1,
    max_session: 1,
    price: 0,
    minutes_per_session: 60,
    description: "",
    duration_unit: "day",
  };
  
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  
  const handleReset = () => {
    setForm(initialFormState);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "price" || name === "duration_value" || name === "max_session" || name === "minutes_per_session" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div>
      <PageBreadcrumb 
        items={[
          { icon: <FaCog className="w-3 h-3" />, label: 'Settings', href: '/admin/settings' },
          { label: 'PT Plans', href: '/admin/pt/plans' },
          { label: 'Create' }
        ]}
      />

      <PageContainerInsert>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-amber-300 text-center">Create PT Session Plan</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <FormInputGroup className="grid grid-cols-2 gap-4">
            <FormInput
              label="Duration (days)"
              name="duration_value"
              type="number"
              value={form.duration_value}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Max Session"
              name="max_session"
              type="number"
              value={form.max_session}
              onChange={handleChange}
              required
            />
          </FormInputGroup>

          <FormInputGroup className="grid grid-cols-2 gap-4">
            <FormInput
              label="Price (Rp)"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
            />
            <FormInput
              label="Minutes/Session"
              name="minutes_per_session"
              type="number"
              value={form.minutes_per_session}
              onChange={handleChange}
              required
            />
          </FormInputGroup>

          <FormInput
            label="Description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={handleChange}
            required
          />

          <FormActions
            onReset={handleReset}
            cancelHref="/admin/pt/plans"
            isSubmitting={loading}
            submitLabel="Create Plan"
          />
        </form>
      </PageContainerInsert>
    </div>
  );
}
