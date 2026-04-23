"use client";

import { useState } from "react";

export function GeneratePlanButton({ weakAreas }: { weakAreas: string[] }) {
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
        body: JSON.stringify({ weakAreas }),
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
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        {loading ? "Generating..." : "Generate Learning Plan"}
      </button>

      {/* ANALYSIS */}
      {plan?.analysis && (
        <p className="text-sm text-gray-700">{plan.analysis}</p>
      )}

      {/* LEARNING PLAN */}
      {Array.isArray(plan?.learningPlan) && plan?.learningPlan?.length > 0 ? (
        <div className="space-y-6">
          {plan.learningPlan.map((week: any) => (
            <div key={week.week} className="p-4 bg-gray-100 rounded-lg">
              <h2 className="font-bold mb-2">
                Week {week.week} -{" "}
                {Array.isArray(week.focusDomain)
                  ? week.focusDomain.join(", ")
                  : "-"}
              </h2>

              <div className="space-y-2">
                {Array.isArray(week.days) &&
                  week.days.map((d: any) => (
                    <div
                      key={`${week.week}-${d.date}-${d.questionId}`}
                      className="p-2 bg-white rounded"
                    >
                      <p className="font-medium">
                        {d.day} - {d.date}
                      </p>

                      <p className="text-sm text-gray-700">{d.activityTitle}</p>

                      <p className="text-xs text-gray-500">
                        Question ID: {d.questionId}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Tidak ada learning plan yang dihasilkan AI
        </p>
      )}
    </div>
  );
}
