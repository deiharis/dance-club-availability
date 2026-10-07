"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Skeleton, EmptyState } from "@/components/ui/states";
import type { AnalyticsData } from "@/lib/analytics-types";
import { Tabs } from "@/components/console/ui";
import AvailabilityTab from "@/components/analytics/AvailabilityTab";
import MembershipTab from "@/components/analytics/MembershipTab";
import DanceTab from "@/components/analytics/DanceTab";
import ActivityTab from "@/components/analytics/ActivityTab";

type Tab = "availability" | "membership" | "dance" | "activity";
const TABS: Tab[] = ["availability", "membership", "dance", "activity"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("availability");

  function loadAnalytics() {
    setLoading(true);
    setError("");
    fetch("/api/analytics", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(() => setError("Could not load analytics. Try refreshing."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // The open tab lives in the address (?tab=membership), so a refresh or Back keeps it.
    const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (t && TABS.includes(t)) setTab(t);
    loadAnalytics();
  }, []);

  function changeTab(t: Tab) {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url);
  }

  // The Dance Floor tab only exists for the SuperAdmin / Advisory; anyone else sent ?tab=dance sees Availability.
  const shown: Tab = tab === "dance" && data && !data.dance ? "availability" : tab;

  return (
    <div>
      <div data-section="People" className="c-page-header flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white">Analytics</h1>
          <p className="text-zinc-500 mt-0.5">
            {data
              ? `Updated ${new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}`
              : "Availability, membership, Dance Floor and activity"}
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="p-4 sm:p-8">
        <div className="mb-6 overflow-x-auto">
          <Tabs
            value={shown}
            onChange={changeTab}
            options={[
              { key: "availability" as Tab, label: "Availability" },
              { key: "membership" as Tab, label: "Membership" },
              // Only the SuperAdmin gets every team's dance data
              ...(data && !data.dance ? [] : [{ key: "dance" as Tab, label: "Dance Floor" }]),
              { key: "activity" as Tab, label: "Activity" },
            ]}
          />
        </div>

        {error && !data && (
          <EmptyState icon={WifiOff} title="Analytics did not load" body="This is usually a brief connection problem. Nothing is lost." action={{ label: "Try again", onClick: loadAnalytics }} />
        )}

        {!data ? (
          !error && (
            <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-80 lg:col-span-2" />
                <Skeleton className="h-80" />
              </div>
            </div>
          )
        ) : (
          // key remounts the tab on every switch, so its charts animate in again
          <div key={`${shown}-${data.generatedAt}`}>
            {shown === "availability" && <AvailabilityTab all={data.availability} filled={data.availabilityFilled} />}
            {shown === "membership" && <MembershipTab d={data.membership} />}
            {shown === "dance" && data.dance && <DanceTab d={data.dance} />}
            {shown === "activity" && <ActivityTab d={data.activity} />}
          </div>
        )}
      </div>
    </div>
  );
}
