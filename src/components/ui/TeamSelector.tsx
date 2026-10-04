"use client";

import React from "react";
import { getTeamsForCategory } from "@/lib/teams";

interface TeamSelectorProps {
  category: string;
  value: string;
  onChange: (team: string) => void;
}

export default function TeamSelector({
  category,
  value,
  onChange,
}: TeamSelectorProps) {
  const teams = getTeamsForCategory(category);

  if (teams.length === 0) return null;

  const label =
    category === "CORE"
      ? "Core Team"
      : category === "MEMBER"
      ? "Member Team"
      : "Dance Team";

  return (
    <div>
      <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
        {label}{" "}
        <span className="text-red-400 normal-case font-normal">(required)</span>
      </label>
      <div className="bg-[#0a0a0c] border border-gray-700 rounded-lg p-3 space-y-1.5 max-h-56 overflow-y-auto">
        {teams.map((team) => (
          <label
            key={team}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              value === team
                ? "bg-purple-600/20 border border-purple-500/30"
                : "hover:bg-white/5 border border-transparent"
            }`}
          >
            <input
              type="radio"
              name="team"
              value={team}
              checked={value === team}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4 accent-purple-500 flex-shrink-0"
              required
            />
            <span className="text-white text-sm">{team}</span>
          </label>
        ))}
      </div>
    </div>
  );
}