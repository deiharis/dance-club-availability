"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, Download, Upload, FileSpreadsheet } from "lucide-react";

interface Member {
  id: string;
  fullName: string;
  registerNumber: string;
  email: string;
  department: string;
  academicYear: number;
  category: string;
  position: string;
}

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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadMembers() {
    setLoading(true);
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/members/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setImporting(false);
    setImportResult(data);

    if (fileInputRef.current) fileInputRef.current.value = "";

    loadMembers();
  }

  return (
    <div>

      <div className="border-b border-gray-800 bg-[#1a1d27] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Members</h1>
          <p className="text-gray-500 text-xs mt-0.5">{members.length} total</p>
        </div>

        <div className="flex items-center gap-2">

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Upload size={14} />
            {importing ? "Importing..." : "Import"}
          </button>

          <Link
            href="/api/members/export"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={14} />
            Export
          </Link>

          <Link
            href="/api/timetable/export"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={14} />
            Availability
          </Link>

          <Link
            href="/members/add"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Member
          </Link>

        </div>
      </div>

      <div className="p-8">

        {/* Import result banner */}
        {importResult && (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 mb-6">
            <p className="text-white text-sm font-medium mb-1">
              Import complete — {importResult.created} added, {importResult.skipped} skipped
            </p>
            {importResult.errors.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-gray-500 text-xs">
                    {err}
                  </p>
                ))}
                {importResult.errors.length > 5 && (
                  <p className="text-gray-600 text-xs">
                    +{importResult.errors.length - 5} more
                  </p>
                )}
              </div>
            )}
            <button
              onClick={() => setImportResult(null)}
              className="text-purple-400 hover:text-purple-300 text-xs mt-2 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl overflow-hidden">

          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-sm">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-sm mb-4">No members yet.</p>
              <Link
                href="/members/add"
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Add your first member
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Name</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Reg Number</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Category</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Position</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Department</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Year</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-400 text-xs font-semibold">
                            {member.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{member.fullName}</p>
                          <p className="text-gray-500 text-xs">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm font-mono">{member.registerNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${getCategoryStyle(member.category)}`}>
                        {getCategoryLabel(member.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{member.position}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{member.department}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">Year {member.academicYear}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/members/${member.id}/edit`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          Edit
                        </Link>
                        <Link href={`/members/${member.id}/delete`} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                          Delete
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>

    </div>
  );
}