"use client";

import { useState } from "react";

export function GeneratePlanButton({
  weakAreas,
}: {
  weakAreas: string[];
}) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weakAreas,
        }),
      });

      const data = await res.json();
      setPlan(data.plan || data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        {loading ? "Generating..." : "Generate Learning Plan"}
      </button>

      {/* RESULT */}
      {plan?.analysis ? (
        <p className="text-sm text-gray-700 mb-3">{plan.analysis}</p>
      ) : (
        <p className="text-sm text-red-500">
          AI tidak mengembalikan analisis
        </p>
      )}

      {Array.isArray(plan?.weeklySchedule) &&
      plan.weeklySchedule.length > 0 ? (
        <div className="space-y-3">
          {plan.weeklySchedule.map((p: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded">
              <p className="font-medium">
                {p.day} - {p.date}
              </p>
              <p className="text-sm text-gray-700">
                {p.activityTitle}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Tidak ada jadwal yang dihasilkan AI
        </p>
      )}
    </div>
  );
}