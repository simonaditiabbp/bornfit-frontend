
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.replace("/login");
        return;
      }
      try {
        const user = JSON.parse(userData);
        if (user.role === "admin") {
          router.replace("/admin/dashboard");
        } else if (user.role === "opscan") {
          router.replace("/checkin");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }
  }, [router]);
  if (!mounted) return null;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-blue-600 text-lg font-semibold">Loading...</div>
    </main>
  );
}