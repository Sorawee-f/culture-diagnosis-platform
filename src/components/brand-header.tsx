import { Lightbulb } from "lucide-react";

export function BrandHeader({ eyebrow }: { eyebrow?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
        <Lightbulb size={24} />
      </div>
      <div>
        <div className="font-semibold text-emerald-700">{eyebrow ?? "CULTURE DIAGNOSIS"}</div>
        <div className="text-sm text-slate-500">Reality vs Expectation Survey</div>
      </div>
    </div>
  );
}
