"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FaBookmark, FaCheck } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { trackApplication, type TrackApplicationInput } from "../actions/applications";

/** Drop into any job card/detail view once applications is enabled - see components/jobs/JobDetailView.tsx for the reference integration. */
export function TrackApplicationButton({ job }: { job: TrackApplicationInput }) {
  const { status } = useSession();
  const [tracked, setTracked] = useState(false);
  const [pending, startTransition] = useTransition();

  // applications' guestAccess is hard-locked false - a signed-out visitor
  // can't call trackApplication() at all (checkAccess() would reject it
  // server-side anyway), so point them at sign-in instead of showing a
  // button that would just fail silently on click.
  if (status !== "authenticated") {
    return (
      <Button variant="outline" size="lg" className="w-full py-6 md:py-2" asChild>
        <Link href="/sign-in">
          Sign in to track this job <FaBookmark className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  function handleClick() {
    startTransition(async () => {
      await trackApplication(job);
      setTracked(true);
    });
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full py-6 md:py-2"
      disabled={pending || tracked}
      onClick={handleClick}
    >
      {tracked ? (
        <>
          Tracked <FaCheck className="ml-2 h-4 w-4" />
        </>
      ) : (
        <>
          Track this job <FaBookmark className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
