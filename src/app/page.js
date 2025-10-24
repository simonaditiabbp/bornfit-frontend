
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // Cek user di localStorage
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
          router.replace("/barcode");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }
  }, [router]);
  return null;
}
