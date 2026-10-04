"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

interface Report {
  id: string;
  description: string;
  workDate: string;
  status: string;
  reviewNotes: string | null;
  submittedAt: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">
        <CheckCircle size={12} />
        Approved
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
        <XCircle size={12} />
        Rejected
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-md">
      <Clock size={12} />
      Pending
    </span>
  );
}

export default function MemberReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    description: "",
    workDate: "",
  });

  function loadReports() {
    fetch("/api/reports", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadReports();
  }, []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
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

    setSuccess("Report submitted successfully. A Core Member will review it shortly.");
    setForm({ description: "", workDate: "" });
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    loadReports();
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-4 sm:space-y-6">

      <div>
        <h1 className="text-xl font-bold text-white">My Reports</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Submit a report whenever you complete club-related work.
        </p>
      </div>

      {/* Submit Form */}
      <div className="bg-[#17120f] border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FileText size={16} className="text-purple-400" />
          Submit New Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

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
              placeholder="Briefly describe the work you completed (2–3 lines)"
              className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm resize-none"
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
              className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
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
                  <p className="text-gray-600 text-xs">
                    JPG, PNG, or HEIC
                  </p>
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

      {/* Reports History */}
      <div className="bg-[#17120f] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold text-sm">My Submitted Reports</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">Loading reports...</p>
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
              <div key={report.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white text-sm">{report.description}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Work date:{" "}
                      {new Date(report.workDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {report.status === "REJECTED" && report.reviewNotes && (
                      <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <p className="text-red-400 text-xs">
                          Rejection reason: {report.reviewNotes}
                        </p>
                      </div>
                    )}
                  </div>
                  <StatusBadge status={report.status} />
                </div>
                <p className="text-gray-600 text-xs mt-2">
                  Submitted{" "}
                  {new Date(report.submittedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}