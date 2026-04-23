"use client";

import { useState } from "react";
import ProfileForm from "./_components/ProfileForm";
import QuestionsForm from "./_components/QuestionsForm";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
  });

  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleProfileNext = (data: any) => {
    setProfile(data);
    setStep(2);
  };

  const handleSubmitAnswers = async (finalAnswers: string[]) => {
    setLoading(true);

    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          answers: finalAnswers,
        }),
      });

      const data = await res.json();
      setResult(data);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Error submit screening");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-800 bg-gray-100 p-4">
      <div className="bg-white w-full max-w-xl p-6 rounded-2xl shadow">
        {step === 1 && <ProfileForm onNext={handleProfileNext} />}

        {step === 2 && (
          <QuestionsForm
            loading={loading}
            onBack={() => setStep(1)}
            onSubmit={handleSubmitAnswers}
          />
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">Hasil Screening</h2>

            {/* SCORE CARD */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-3xl font-bold text-blue-600">
                {result?.result?.score ?? "-"}
              </p>
            </div>

            {/* RISK LEVEL */}
            <div
              className={`p-4 rounded-xl text-center font-semibold ${
                result?.result?.riskLevel === "HIGH"
                  ? "bg-red-100 text-red-600"
                  : result?.result?.riskLevel === "MODERATE"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-green-100 text-green-600"
              }`}
            >
              Risk Level: {result?.result?.riskLevel}
            </div>

            {/* ACTION */}
            <div className="bg-gray-50 border p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Rekomendasi</p>
              <p className="font-medium">{result?.result?.action}</p>
            </div>

            {/* DETAIL ANSWERS */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold mb-2">Jawaban Risiko</h3>

              {result?.result?.detail?.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.result.detail.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm">
                        Q{item.question} - {item.answer}
                      </span>

                      <span className="text-red-500 text-xs font-bold">
                        +{item.risk_point}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Tidak ada indikator risiko
                </p>
              )}
            </div>

            {/* BUTTON */}
            <button
              className="w-full bg-blue-500 text-white p-2 rounded-lg"
              onClick={() => {
                setStep(1);
                setResult(null);
                setProfile({ name: "", age: "", gender: "" });
                setAnswers([]);
              }}
            >
              Ulangi Screening
            </button>

            <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg"
              onClick={() => router.push("/ai-analysis")}
            >
              Analisis dengan AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
