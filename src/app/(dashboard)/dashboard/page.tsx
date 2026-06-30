import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users, Calendar, Search, BarChart2 } from "lucide-react";

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core Members";
  if (category === "FFCS") return "FFCS";
  return "Normal Members";
}

function getCategoryStyle(category: string) {
  if (category === "CORE") return "bg-purple-500/20 text-purple-400";
  if (category === "FFCS") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const totalMembers = await db.member.count();
  const totalCore = await db.member.count({ where: { category: "CORE" } });
  const totalFFCS = await db.member.count({ where: { category: "FFCS" } });
  const totalNormal = await db.member.count({ where: { category: "MEMBER" } });
  const recentMembers = await db.member.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>

      <div className="border-b border-gray-800 bg-[#1a1d27] px-8 py-4">
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
      </div>

      <div className="p-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
              Total Members
            </p>
            <p className="text-3xl font-bold text-white">{totalMembers}</p>
          </div>

          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
              Core Members
            </p>
            <p className="text-3xl font-bold text-purple-400">{totalCore}</p>
          </div>

          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
              Normal Members
            </p>
            <p className="text-3xl font-bold text-green-400">{totalNormal}</p>
          </div>

          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
              FFCS
            </p>
            <p className="text-3xl font-bold text-blue-400">{totalFFCS}</p>
          </div>

        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <Link href="/members" className="bg-[#1a1d27] border border-gray-800 hover:border-purple-500/50 rounded-xl p-5 transition-all group">
            <div className="w-9 h-9 bg-purple-600/10 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600/20 transition-colors">
              <Users size={16} className="text-purple-400" />
            </div>
            <p className="text-white text-sm font-medium">Members</p>
            <p className="text-gray-500 text-xs mt-1">Manage all members</p>
          </Link>

          <Link href="/timetable" className="bg-[#1a1d27] border border-gray-800 hover:border-blue-500/50 rounded-xl p-5 transition-all group">
            <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
              <Calendar size={16} className="text-blue-400" />
            </div>
            <p className="text-white text-sm font-medium">Timetable</p>
            <p className="text-gray-500 text-xs mt-1">View availability</p>
          </Link>

          <Link href="/search" className="bg-[#1a1d27] border border-gray-800 hover:border-green-500/50 rounded-xl p-5 transition-all group">
            <div className="w-9 h-9 bg-green-600/10 border border-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600/20 transition-colors">
              <Search size={16} className="text-green-400" />
            </div>
            <p className="text-white text-sm font-medium">Search</p>
            <p className="text-gray-500 text-xs mt-1">Find members</p>
          </Link>

          <Link href="/analytics" className="bg-[#1a1d27] border border-gray-800 hover:border-orange-500/50 rounded-xl p-5 transition-all group">
            <div className="w-9 h-9 bg-orange-600/10 border border-orange-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-600/20 transition-colors">
              <BarChart2 size={16} className="text-orange-400" />
            </div>
            <p className="text-white text-sm font-medium">Analytics</p>
            <p className="text-gray-500 text-xs mt-1">View statistics</p>
          </Link>

        </div>

        {/* Recent Members */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold text-sm">
              Recently Added Members
            </h2>
          </div>

          {recentMembers.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-gray-500 text-sm">
                No members yet. Add your first member to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {recentMembers.map((member) => (
                <div
                  key={member.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-400 text-xs font-semibold">
                        {member.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {member.fullName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {member.registerNumber} · {member.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">
                      {member.position}
                    </span>
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