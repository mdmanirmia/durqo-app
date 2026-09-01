import { Suspense } from "react";
import GaPropertyPicker from "@/components/dashboard/GaPropertyPicker";

export default function GaConnectPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-10 text-sm text-ink-faint sm:px-7">Loading&hellip;</div>}>
      <GaPropertyPicker />
    </Suspense>
  );
}
