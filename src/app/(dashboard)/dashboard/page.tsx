import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users, Calendar, Search, BarChart2 } from "lucide-react";

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core";
  if (category === "FFCS_ONLY") return "FFCS Only";
  if (category === "DANCER") return "Dancer";
  return "Member";
}

function getCategoryStyle(category: string) {
  if (category === "CORE") return "bg-purple-500/20 text-purple-400";
  if (category === "FFCS_ONLY") return "bg-blue-500/20 text-blue-400";
  if (category === "DANCER") return "bg-pink-500/20 text-pink-400";
  return "bg-gray-500/20 text-gray-400";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const totalMembers = await db.member.count();
  const totalCore = await db.member.count({ where: { category: "CORE" } });
  const totalDancer = await db.member.count({ where: { category: "DANCER" } });
  const totalFFCS = await db.member.count({ where: { isFFCS: true } });

  const recentMembers = await db.member.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="border-b border-gray-800 bg-[#1a1d27] px-4 sm:px-8 py-4">
        <h1 className="text-base sm:text-lg font-semibold text-white">Dashboard</h1>
      </div>

      <div className="p-4 sm:p-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Total</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">{totalMembers}</p>
          </div>
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Core</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-400">{totalCore}</p>
          </div>
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Dancers</p>
            <p className="text-2xl sm:text-3xl font-bold text-pink-400">{totalDancer}</p>
          </div>
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">FFCS</p>
            <p className="text-2xl sm:text-3xl font-bold text-teal-400">{totalFFCS}</p>
          </div>
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/members" className="bg-[#1a1d27] border border-gray-800 hover:border-purple-500/50 rounded-xl p-4 sm:p-5 transition-all group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-600/10 border border-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-600/20 transition-colors">
              <Users size={15} className="text-purple-400" />
            </div>
            <p className="text-white text-sm font-medium">Members</p>
            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">Manage all members</p>
          </Link>

          <Link href="/timetable" className="bg-[#1a1d27] border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 sm:p-5 transition-all group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600/20 transition-colors">
              <Calendar size={15} className="text-blue-400" />
            </div>
            <p className="text-white text-sm font-medium">Timetable</p>
            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">View availability</p>
          </Link>

          <Link href="/search" className="bg-[#1a1d27] border border-gray-800 hover:border-green-500/50 rounded-xl p-4 sm:p-5 transition-all group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-green-600/10 border border-green-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-600/20 transition-colors">
              <Search size={15} className="text-green-400" />
            </div>
            <p className="text-white text-sm font-medium">Search</p>
            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">Find members</p>
          </Link>

          <Link href="/analytics" className="bg-[#1a1d27] border border-gray-800 hover:border-orange-500/50 rounded-xl p-4 sm:p-5 transition-all group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-600/10 border border-orange-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-600/20 transition-colors">
              <BarChart2 size={15} className="text-orange-400" />
            </div>
            <p className="text-white text-sm font-medium">Analytics</p>
            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">View statistics</p>
          </Link>
        </div>

        {/* Recent Members */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold text-sm">Recently Added</h2>
          </div>
          {recentMembers.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-gray-500 text-sm">No members yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentMembers.map((member) => (
                <div key={member.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-xs font-semibold">
                        {member.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{member.fullName}</p>
                      <p className="text-gray-500 text-xs truncate hidden sm:block">
                        {member.registerNumber} · {member.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-400 text-xs hidden sm:block">{member.position}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${getCategoryStyle(member.category)}`}>
                      {getCategoryLabel(member.category)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}