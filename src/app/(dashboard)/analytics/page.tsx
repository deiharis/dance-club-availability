"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import type { AnalyticsData } from "@/lib/analytics-types";
import { Tabs } from "@/components/console/ui";
import AvailabilityTab from "@/components/analytics/AvailabilityTab";
import MembershipTab from "@/components/analytics/MembershipTab";
import DanceTab from "@/components/analytics/DanceTab";
import ActivityTab from "@/components/analytics/ActivityTab";

type Tab = "availability" | "membership" | "dance" | "activity";

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
    loadAnalytics();
  }, []);

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
            value={tab}
            onChange={setTab}
            options={[
              { key: "availability", label: "Availability" },
              { key: "membership", label: "Membership" },
              { key: "dance", label: "Dance Floor" },
              { key: "activity", label: "Activity" },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!data ? (
          !error && <p className="py-20 text-center text-sm text-zinc-500">Loading analytics...</p>
        ) : (
          // key remounts the tab on every switch, so its charts animate in again
          <div key={`${tab}-${data.generatedAt}`}>
            {tab === "availability" && <AvailabilityTab d={data.availability} />}
            {tab === "membership" && <MembershipTab d={data.membership} />}
            {tab === "dance" && <DanceTab d={data.dance} />}
            {tab === "activity" && <ActivityTab d={data.activity} />}
          </div>
        )}
      </div>
    </div>
  );
}
