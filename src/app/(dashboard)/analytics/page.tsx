"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Heatmap from "@/components/timetable/Heatmap";
import { SLOTS, DAYS, DAY_LABELS } from "@/lib/timetable";
import { TrendingUp, TrendingDown, Clock, Users, RefreshCw } from "lucide-react";

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");

interface AnalyticsData {
  totalMembers: number;
  heatmap: { day: string; slot: string; freeCount: number; percentage: number }[];
  bestSlot: { day: string; slot: string; freeCount: number; percentage: number };
  mostAvailableDay: { day: string; avg: number };
  leastAvailableDay: { day: string; avg: number };
  dayAverages: { day: string; avg: number }[];
  memberAvailability: { id: string; fullName: string; category: string; percentage: number }[];
}

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core Members";
  if (category === "FFCS") return "FFCS";
  return "Normal Members";
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  function loadAnalytics() {
    setLoading(true);
    fetch("/api/analytics", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadAnalytics();

    // Refresh automatically whenever the user comes back to this tab/page
    function handleFocus() {
      loadAnalytics();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading analytics...</p>
      </div>
    );
  }

  const chartData = data.dayAverages.map((d) => ({
    day: DAY_LABELS[d.day].slice(0, 3),
    "Free %": d.avg,
  }));

  return (
    <div>

      <div data-section="People" className="c-page-header flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white">Analytics</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Availability insights across all members
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">

        {/* Top Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">

          <div className="bg-[#17120f] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-gray-500" />
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                Total Members
              </p>
            </div>
            <p className="text-2xl font-bold text-white">{data.totalMembers}</p>
          </div>

          <div className="bg-[#17120f] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-purple-400" />
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                Best Meeting Time
              </p>
            </div>
            <p className="text-lg font-bold text-white">
              {data.bestSlot.day ? DAY_LABELS[data.bestSlot.day] : "—"}{" "}
              {data.bestSlot.slot}
            </p>
            <p className="text-purple-400 text-xs mt-0.5">
              {data.bestSlot.percentage}% available
            </p>
          </div>

          <div className="bg-[#17120f] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-green-400" />
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                Most Available Day
              </p>
            </div>
            <p className="text-lg font-bold text-white">
              {data.mostAvailableDay.day ? DAY_LABELS[data.mostAvailableDay.day] : "—"}
            </p>
            <p className="text-green-400 text-xs mt-0.5">
              {data.mostAvailableDay.avg}% average
            </p>
          </div>

          <div className="bg-[#17120f] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={14} className="text-red-400" />
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                Least Available Day
              </p>
            </div>
            <p className="text-lg font-bold text-white">
              {data.leastAvailableDay.day ? DAY_LABELS[data.leastAvailableDay.day] : "—"}
            </p>
            <p className="text-red-400 text-xs mt-0.5">
              {data.leastAvailableDay.avg}% average
            </p>
          </div>

        </div>

        {/* Bar Chart */}
        <div className="bg-[#17120f] border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-sm mb-4">
            Average Availability by Day
          </h2>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2330" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#17120f",
                    border: "1px solid #2a2e3a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="Free %" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-[#17120f] border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-sm mb-4">
            Availability Heatmap
          </h2>
          <Heatmap data={data.heatmap} days={DAYS} slots={ACTIVE_SLOTS} />
        </div>

        {/* Per-Member Availability */}
        <div className="bg-[#17120f] border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold text-sm">
              Member Availability Percentage
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {data.memberAvailability.map((member) => (
              <div
                key={member.id}
                className="px-6 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {member.fullName}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {getCategoryLabel(member.category)}
                  </p>
                </div>
                <div className="flex items-center gap-3 w-48">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${member.percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-300 text-xs font-medium w-10 text-right">
                    {member.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}