"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function GeneratePlanButton({ weakAreas }: { weakAreas: string[] }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const router = useRouter();

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
              {/* WEEK HEADER */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-base">Week {week.week}</h2>
                {Array.isArray(week.focusDomain) &&
                  week.focusDomain.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {week.focusDomain.map((domain: string) => (
                        <span
                          key={domain}
                          className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  )}
              </div>

              {/* DAYS */}
              <div className="space-y-2">
                {Array.isArray(week.days) &&
                  week.days.map((d: any) => (
                    <div
                      key={`${week.week}-${d.date}-${d.questionId}`}
                      className="p-3 bg-white rounded-lg border border-gray-200"
                    >
                      {/* DAY + DATE */}
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">
                          {d.day} — {d.date}
                        </p>

                        {/* LEVEL BADGE */}
                        {d.level && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              d.level === 1
                                ? "bg-green-100 text-green-700"
                                : d.level === 2
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            Level {d.level}
                          </span>
                        )}
                      </div>

                      {/* ACTIVITY TITLE */}
                      <p className="text-sm text-gray-800 mb-2">
                        {d.activityTitle}
                      </p>

                      {/* META + LINK */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3 text-xs text-gray-400">
                          {/* Domain tag */}
                          {d.domain && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                              {d.domain}
                            </span>
                          )}
                          <span>ID: {d.questionId}</span>
                        </div>

                        {/* LINK */}
                        {d.href && (
                          <Link
                            href={d.href}
                            className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline"
                          >
                            Mulai →
                          </Link>
                        )}
                      </div>
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

      {/* REFERRAL MESSAGE — tampil jika ada */}
      {plan?.referralMessage && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-700 mb-1">
            ⚠️ Rekomendasi Konsultasi
          </p>
          <p className="text-sm text-red-600">{plan.referralMessage}</p>
        </div>
      )}

      {/* PRIORITY BADGE */}
      {plan?.priority && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Prioritas:</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              plan.priority === "high"
                ? "bg-red-100 text-red-700"
                : plan.priority === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {plan.priority.toUpperCase()}
          </span>

           <button
              className="w-full bg-blue-500 text-white p-2 rounded-lg"
              onClick={() => router.push("/screening")}
            >
              Ulangi Screening
            </button>
        </div>
      )}
    </div>
  );
}
