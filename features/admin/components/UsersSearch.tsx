"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { debounce } from "@/lib/utils";

/** Updates the `q` URL param (debounced), which re-runs the server fetch in page.tsx - same "URL is the source of truth" pattern the jobs filters already use. */
export function UsersSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();

  const onChange = debounce((value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.replace(`/admin/users${params.toString() ? `?${params}` : ""}`);
  }, 300);

  return (
    <Input
      type="search"
      placeholder="Search by name or email..."
      defaultValue={initialQuery}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-sm"
    />
  );
}
