"use client";

import { useState } from "react";
import { GeneratePlanButton } from "./GeneratePlanButton";

export function DetectButton({ item }: any) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDetect = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/detection-area", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultScreening: item,
        }),
      });

      const data = await res.json();

      setResult(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const formatArea = (area: string) => {
    switch (area) {
      case "attention":
        return "Perhatian & Fokus";
      case "communication_language":
        return "Komunikasi & Bahasa";
      case "social_emotional":
        return "Sosial & Emosional";
      case "cognitive":
        return "Kognitif";
      case "motoric":
        return "Motorik & Gerakan";
      default:
        return area;
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleDetect}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
      >
        {loading ? "Mendeteksi..." : "Deteksi Area Kelemahan"}
      </button>

      {/* RESULT */}
      {result && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Hasil Deteksi:</h4>

          <p className="text-sm text-gray-700">
            Ditemukan <b>{result.total}</b> area kelemahan:
          </p>

          <ul className="mt-2 space-y-1">
            {result.weakAreas?.map((area: string, i: number) => (
              <li key={i} className="text-sm bg-white px-3 py-2 rounded border">
                • {formatArea(area)}
              </li>
            ))}
          </ul>

          {/* 🔥 GENERATE PLAN BUTTON */}
          <div className="mt-4">
            <GeneratePlanButton
              weakAreas={result.weakAreas}
            />
          </div>
        </div>
      )}
    </div>
  );
}
