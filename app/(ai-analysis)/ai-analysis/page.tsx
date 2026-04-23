import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { DetectButton } from "./_components/DetectButton";

const Page = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || !subscription.isActive) {
    redirect("/pricing");
  }

  const results = await prisma.screeningResult.findMany({
    where: { clerkId: userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen text-gray-800 bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          AI Analysis Result
        </h1>

        {results.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-xl shadow mb-4">

            {/* SCORE */}
            <div className="flex justify-between">
              <h2 className="font-semibold">Screening Result</h2>

              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                Score: {item.score}
              </span>
            </div>

            {/* RISK LEVEL */}
            <div className="mt-2">
              <span
                className={`px-3 py-1 text-xs rounded-full ${
                  item.riskLevel === "HIGH"
                    ? "bg-red-100 text-red-600"
                    : item.riskLevel === "MODERATE"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {item.riskLevel}
              </span>
            </div>

            {/* ACTION */}
            <p className="mt-3 text-gray-700">
              <span className="font-semibold">Action:</span>{" "}
              {item.action}
            </p>

            {/* DETAIL */}
            <div className="mt-4">
              <h3 className="font-semibold text-sm mb-2">
                Detail Jawaban
              </h3>

              <div className="space-y-2">
                {Array.isArray(item.detail) &&
                  item.detail.map((d: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between bg-gray-50 p-3 rounded-lg text-sm"
                    >
                      <span>
                        Q{d.question} - {d.answer}
                      </span>
                      <span className="text-red-500">
                        +{d.risk_point}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* DETECTION BUTTON 🔥 */}
            <DetectButton item={item} />

            {/* DATE */}
            <p className="mt-3 text-xs text-gray-400">
              {new Date(item.createdAt).toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;