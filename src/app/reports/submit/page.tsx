"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  FileBadge,
} from "lucide-react";

interface Report {
  id: string;
  description: string;
  workDate: string;
  status: string;
  reviewNotes: string | null;
  submittedAt: string;
}

interface ApprovedReport {
  id: string;
  description: string;
  workDate: string;
  odRequest: { id: string; status: string } | null;
}

interface ODRequest {
  id: string;
  reason: string;
  activityDate: string;
  slots: string[];
  status: string;
  approvedAt: string | null;
  report: {
    description: string;
    workDate: string;
  };
}
function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">
        <CheckCircle size={12} /> Approved
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
        <XCircle size={12} /> Rejected
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-md">
      <Clock size={12} /> Pending
    </span>
  );
}

function ODStatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">
        <CheckCircle size={12} /> OD Approved
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md">
      <Clock size={12} /> OD Pending
    </span>
  );
}

type Tab = "submit" | "od";

export default function SubmitReportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("submit");
  const [reports, setReports] = useState<Report[]>([]);
  const [approvedReports, setApprovedReports] = useState<ApprovedReport[]>([]);
  const [odRequests, setODRequests] = useState<ODRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [odSubmitting, setODSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [odError, setODError] = useState("");
  const [odSuccess, setODSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [canRequestOD, setCanRequestOD] = useState(false);

  // OD form
  const [odForm, setODForm] = useState({
    reportId: "",
    reason: "",
    slots: [] as string[],
  });

  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    description: "",
    workDate: "",
  });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (!session?.user) {
          router.push("/login");
          return;
        }
        setUserRole(session.user.role ?? "MEMBER");
      });

    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);

    Promise.all([
      fetch("/api/reports/mine", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/reports/approved", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/od", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([myReports, approved, myODs]) => {
      setReports(Array.isArray(myReports) ? myReports : []);

      const approvedList = Array.isArray(approved) ? approved : [];
      setApprovedReports(approvedList);

      // Can request OD if there are approved reports without an OD request
      const hasEligible = approvedList.some((r: ApprovedReport) => !r.odRequest);
      setCanRequestOD(hasEligible);

      setODRequests(Array.isArray(myODs) ? myODs : []);
      setLoading(false);
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please attach an image as proof.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("description", form.description);
    formData.append("workDate", form.workDate);
    formData.append("image", file);

    const res = await fetch("/api/reports", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to submit report");
      return;
    }

    setSuccess(
      "Report submitted. Once approved by a Core Member, you can request an OD for it."
    );
    setForm({ description: "", workDate: "" });
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    loadAll();
  }

  async function handleRequestOD(e: React.FormEvent) {
    e.preventDefault();
    setODError("");
    setODSuccess("");

    if (!odForm.reportId || !odForm.reason.trim()) {
      setODError("Please select a report and enter a reason.");
      return;
    }

    setODSubmitting(true);

    const res = await fetch("/api/od", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(odForm),
    });

    const data = await res.json();
    setODSubmitting(false);

    if (!res.ok) {
      setODError(data.error || "Failed to submit OD request");
      return;
    }

    setODSuccess(
      "OD request submitted. The Super Admin will mark it as approved once the college grants the OD."
    );
    setODForm({ reportId: "", reason: "", slots: [] });
    loadAll();
  }

  function getBackLink() {
    if (userRole === "SUPERADMIN" || userRole === "ADMIN") return "/dashboard";
    return "/profile";
  }

  const eligibleReports = approvedReports.filter((r) => !r.odRequest);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">

      {/* Top bar */}
      <nav className="border-b border-gray-800 bg-[#1a1d27] px-4 sm:px-8 py-4 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-base sm:text-lg tracking-tight">
            Dance Club
          </span>
          <p className="text-gray-500 text-xs mt-0.5">My Reports & OD</p>
        </div>
        <Link
          href={getBackLink()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Link>
      </nav>

      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-4 sm:space-y-6">

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800 pb-0">
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "submit"
                ? "border-purple-500 text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <FileText size={15} />
            Reports
          </button>
          <button
            onClick={() => setActiveTab("od")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "od"
                ? "border-purple-500 text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <FileBadge size={15} />
            OD Requests
            {odRequests.filter((o) => o.status === "PENDING").length > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">
                {odRequests.filter((o) => o.status === "PENDING").length}
              </span>
            )}
          </button>
        </div>

        {/* ── REPORTS TAB ── */}
        {activeTab === "submit" && (
          <>
            {/* Submit form */}
            <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-6">
              <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <FileText size={16} className="text-purple-400" />
                Submit New Report
              </h2>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                    Work Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    required
                    rows={3}
                    placeholder="Briefly describe the work you completed"
                    className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                    Date of Work
                  </label>
                  <input
                    type="date"
                    value={form.workDate}
                    onChange={(e) =>
                      setForm({ ...form, workDate: e.target.value })
                    }
                    required
                    className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                    Proof Image{" "}
                    <span className="text-red-400 normal-case font-normal">
                      (required)
                    </span>
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-gray-500" />
                        <p className="text-gray-400 text-sm">
                          Click to upload image
                        </p>
                        <p className="text-gray-600 text-xs">JPG, PNG, or HEIC</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </form>
            </div>

            {/* Reports history */}
            <div className="bg-[#1a1d27] border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
                <h2 className="text-white font-semibold text-sm">
                  My Submitted Reports
                </h2>
              </div>
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">Loading...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No reports submitted yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {reports.map((report) => (
                    <div key={report.id} className="px-4 sm:px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">
                            {report.description}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Work date:{" "}
                            {new Date(report.workDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          {report.status === "REJECTED" &&
                            report.reviewNotes && (
                              <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                <p className="text-red-400 text-xs">
                                  Rejection reason: {report.reviewNotes}
                                </p>
                              </div>
                            )}
                          {report.status === "APPROVED" && (
                            <p className="text-gray-500 text-xs mt-1">
                              You can request OD for this report in the OD tab.
                            </p>
                          )}
                        </div>
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="text-gray-600 text-xs mt-2">
                        Submitted{" "}
                        {new Date(report.submittedAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── OD TAB ── */}
        {activeTab === "od" && (
          <>
            {/* OD request form */}
            {canRequestOD ? (
              <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-6">
                <h2 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
                  <FileBadge size={16} className="text-purple-400" />
                  Request OD
                </h2>
                <p className="text-gray-500 text-xs mb-4">
                  Select an approved report and describe the activity for which
                  you need OD.
                </p>

                <form onSubmit={handleRequestOD} className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                      Select Approved Report
                    </label>
                    <select
                      value={odForm.reportId}
                      onChange={(e) =>
                        setODForm({ ...odForm, reportId: e.target.value })
                      }
                      required
                      className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    >
                      <option value="">Select a report...</option>
                      {eligibleReports.map((r) => (
                        <option key={r.id} value={r.id}>
                          {new Date(r.workDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          — {r.description.slice(0, 60)}
                          {r.description.length > 60 ? "..." : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                      Time Slots Needed{" "}
                      {odForm.slots.length > 0 && (
                        <span className="text-purple-400 normal-case font-normal">
                          ({odForm.slots.length} selected)
                        </span>
                      )}
                    </label>
                    <div className="bg-[#0f1117] border border-gray-700 rounded-lg p-3 space-y-2 max-h-52 overflow-y-auto">
                      {[
                        { label: "T1", time: "08:00 AM to 08:50 AM" },
                        { label: "T2", time: "08:55 AM to 09:45 AM" },
                        { label: "T3", time: "09:50 AM to 10:40 AM" },
                        { label: "T4", time: "10:45 AM to 11:35 AM" },
                        { label: "T5", time: "11:40 AM to 12:30 PM" },
                        { label: "T6", time: "12:35 PM to 01:25 PM" },
                        { label: "Lunch", time: "01:25 PM to 02:00 PM" },
                        { label: "T7", time: "02:00 PM to 02:50 PM" },
                        { label: "T8", time: "02:55 PM to 03:45 PM" },
                        { label: "T9", time: "03:50 PM to 04:40 PM" },
                        { label: "T10", time: "04:45 PM to 05:35 PM" },
                        { label: "T11", time: "05:40 PM to 06:30 PM" },
                        { label: "T12", time: "06:35 PM to 07:25 PM" },
                      ].map((slot) => {
                        const value = `${slot.time}`;
                        const checked = odForm.slots.includes(value);
                        return (
                          <label
                            key={slot.label}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              checked
                                ? "bg-purple-600/20 border border-purple-500/30"
                                : "hover:bg-white/5 border border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setODForm((prev) => ({
                                  ...prev,
                                  slots: checked
                                    ? prev.slots.filter((s) => s !== value)
                                    : [...prev.slots, value],
                                }));
                              }}
                              className="w-4 h-4 accent-purple-500 flex-shrink-0"
                            />
                            <div>
                              <span className="text-white text-xs font-medium">
                                {slot.time}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                      OD Reason
                    </label>
                    <textarea
                      value={odForm.reason}
                      onChange={(e) =>
                        setODForm({ ...odForm, reason: e.target.value })
                      }
                      required
                      rows={2}
                      placeholder="e.g. Participated in inter-college dance competition representing the club"
                      className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm resize-none"
                    />
                  </div>

                  {odError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                      <p className="text-red-400 text-sm">{odError}</p>
                    </div>
                  )}

                  {odSuccess && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                      <p className="text-green-400 text-sm">{odSuccess}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={odSubmitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {odSubmitting ? "Submitting..." : "Request OD"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-6 text-center">
                <FileBadge size={28} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium mb-1">
                  No eligible reports for OD
                </p>
                <p className="text-gray-600 text-xs">
                  You need at least one approved report without an existing OD
                  request. Submit a report first, wait for Core Team approval,
                  then return here.
                </p>
              </div>
            )}

            {/* OD request history */}
            <div className="bg-[#1a1d27] border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
                <h2 className="text-white font-semibold text-sm">
                  My OD Requests
                </h2>
              </div>
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">Loading...</p>
                </div>
              ) : odRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No OD requests yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {odRequests.map((od) => (
                    <div key={od.id} className="px-4 sm:px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">{od.reason}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Activity:{" "}
                            {new Date(od.activityDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          <p className="text-gray-600 text-xs mt-0.5">
                            Report: {od.report.description.slice(0, 60)}
                            {od.report.description.length > 60 ? "..." : ""}
                          </p>
                          {od.slots && od.slots.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {od.slots.map((slot) => (
                                <span
                                  key={slot}
                                  className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300"
                                >
                                  {slot}
                                </span>
                              ))}
                            </div>
                          )}
                          {od.status === "APPROVED" && od.approvedAt && (
                            <p className="text-green-400 text-xs mt-1">
                              OD approved on{" "}
                              {new Date(od.approvedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          )}
                        </div>
                        <ODStatusBadge status={od.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}