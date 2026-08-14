import Image from "next/image";

export function BrandHeader({ eyebrow }: { eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <Image
        src="/thairath-group-logo.png"
        alt="Thairath Group"
        width={782}
        height={316}
        priority
        className="h-auto w-[150px] sm:w-[180px]"
      />
      <div className="hidden h-10 w-px bg-slate-200 sm:block" />
      <div>
        <div className="font-semibold text-emerald-700">{eyebrow ?? "CULTURE DIAGNOSIS"}</div>
        <div className="text-sm text-slate-500">Reality vs Expectation Survey</div>
      </div>
    </div>
  );
}
