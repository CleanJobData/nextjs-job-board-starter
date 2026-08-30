"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface JobPostingsTabsProps {
  postingsSection: React.ReactNode;
  companiesSection: React.ReactNode;
  postingsCount: number;
  companiesCount: number;
}

/**
 * Thin client wrapper around the two server-rendered sections of
 * /job-postings - Tabs' active-tab state has to live in a client component,
 * but the sections themselves (postings list + form, companies manager)
 * are passed in as already-rendered server output rather than duplicated
 * or lifted into this file, so the page itself can stay a server component.
 */
export function JobPostingsTabs({
  postingsSection,
  companiesSection,
  postingsCount,
  companiesCount,
}: JobPostingsTabsProps) {
  const [tab, setTab] = React.useState("postings");

  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="postings" activeValue={tab} onValueChange={setTab}>
          Your postings ({postingsCount})
        </TabsTrigger>
        <TabsTrigger value="companies" activeValue={tab} onValueChange={setTab}>
          Your companies ({companiesCount})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="postings" activeValue={tab}>
        {postingsSection}
      </TabsContent>
      <TabsContent value="companies" activeValue={tab}>
        {companiesSection}
      </TabsContent>
    </Tabs>
  );
}
