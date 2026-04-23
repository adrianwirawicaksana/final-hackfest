"use client";

import { useState } from "react";

const questions = Array.from({ length: 20 }, (_, i) => `Pertanyaan ${i + 1}`);

export default function QuestionsForm({ onSubmit, onBack, loading }: any) {
  const [answers, setAnswers] = useState<string[]>(
    Array(20).fill("")
  );

  const handleChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const isValid = answers.every((a) => a !== "");

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Questions</h2>

      <div className="space-y-3 max-h-100 overflow-y-auto">
        {questions.map((q, i) => (
          <div key={i} className="border p-3 rounded">
            <p className="mb-2">{q}</p>

            <div className="flex gap-2">
              <button
                className={`flex-1 p-2 rounded ${
                  answers[i] === "YA"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => handleChange(i, "YA")}
              >
                YA
              </button>

              <button
                className={`flex-1 p-2 rounded ${
                  answers[i] === "TIDAK"
                    ? "bg-red-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => handleChange(i, "TIDAK")}
              >
                TIDAK
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className="w-1/2 bg-gray-300 p-2 rounded"
          onClick={onBack}
        >
          Back
        </button>

        <button
          className="w-1/2 bg-green-500 text-white p-2 rounded disabled:bg-gray-300"
          disabled={!isValid || loading}
          onClick={() => onSubmit(answers)}
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </div>
    </div>
  );
}