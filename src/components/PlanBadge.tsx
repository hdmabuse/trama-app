"use client";

const colors: Record<string, { bg: string; text: string }> = {
  FREE: { bg: "bg-stone-100", text: "text-stone-600" },
  PRO: { bg: "bg-trama-50", text: "text-trama-600" },
  TEAM: { bg: "bg-orange-50", text: "text-orange-600" },
};
const labels: Record<string, string> = { FREE: "Free", PRO: "Pro", TEAM: "Team" };

export function PlanBadge({ plan }: { plan: string }) {
  const c = colors[plan] || colors.FREE;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {labels[plan] || plan}
    </span>
  );
}
