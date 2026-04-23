const skillMapping: Record<number, string> = {
  // 1. Attention (Perhatian & Joint Attention)
  1: "attention",
  7: "attention",
  10: "attention",
  14: "attention",
  16: "attention",

  // 2. Communication & Language
  2: "communication_language",
  6: "communication_language",
  9: "communication_language",
  17: "communication_language",
  18: "communication_language",

  // 3. Social & Emotional
  5: "social_emotional",
  8: "social_emotional",
  11: "social_emotional",
  19: "social_emotional",

  // 4. Cognitive (Kognitif)
  3: "cognitive",
  15: "cognitive",

  // 5. Motoric (Motorik & Sensory Movement)
  4: "motoric",
  12: "motoric",
  13: "motoric",
  20: "motoric",
};

type DetailItem = {
  question: number;
  answer: string;
  risk_point: number;
};

type MChatResult = {
  detail: DetailItem[];
};

export function detectWeakAreas(resultScreen?: MChatResult) {
  const weakAreas: string[] = [];

  if (!resultScreen?.detail || !Array.isArray(resultScreen.detail)) {
    return weakAreas;
  }

  resultScreen.detail.forEach((item) => {
    if (item.risk_point === 1) {
      const skill = skillMapping[item.question];

      if (skill && !weakAreas.includes(skill)) {
        weakAreas.push(skill);
      }
    }
  });

  return weakAreas;
}

export async function POST(req: Request) {
  const body = await req.json();

  const weakAreas = detectWeakAreas(body.resultScreening);

  return Response.json({
    weakAreas,
  });
}
