"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async (choice: boolean) => {
    if (!choice) {
      alert("Kamu tidak berlangganan");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "pro",
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Berhasil berlangganan 6 bulan!");

        // 🔥 redirect ke AI analysis
        router.push("/ai-analysis");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button
        onClick={() => handleSubscribe(true)}
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: "green",
          color: "white",
        }}
      >
        {loading ? "Loading..." : "Langganan (Yes)"}
      </button>

      <button
        onClick={() => handleSubscribe(false)}
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: "red",
          color: "white",
        }}
      >
        Tidak
      </button>
    </div>
  );
}