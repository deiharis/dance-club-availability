"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Trash2, X, Check } from "lucide-react";

interface Event {
  id: string;
  name: string;
  eventDate: string;
  createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", eventDate: "" });

  function loadEvents() {
    setLoading(true);
    fetch("/api/events", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to add event");
      return;
    }

    setForm({ name: "", eventDate: "" });
    setShowForm(false);
    loadEvents();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete event "${name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadEvents();
    }
  }

  return (
    <div>

      <div data-section="Super admin" className="c-page-header flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white">
            Events
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Add events that members can select when requesting OD
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm((prev) => !prev);
            setError("");
            setForm({ name: "", eventDate: "" });
          }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Add Event"}
        </button>
      </div>

      <div className="p-4 sm:p-8">

        {/* Add Event Form */}
        {showForm && (
          <div className="bg-[#17120f] border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-white font-semibold text-sm mb-4">
              New Event
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                    Event Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                    placeholder="e.g. Inter-College Dance Competition"
                    className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) =>
                      setForm({ ...form, eventDate: e.target.value })
                    }
                    required
                    className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <Check size={14} />
                {submitting ? "Adding..." : "Add Event"}
              </button>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="bg-[#17120f] border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold text-sm">
              All Events ({events.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays
                size={32}
                className="text-gray-700 mx-auto mb-3"
              />
              <p className="text-gray-500 text-sm">No events added yet.</p>
              <p className="text-gray-600 text-xs mt-1">
                Add events so members can select them when requesting OD.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-purple-600/10 border border-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={15} className="text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {event.name}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(event.eventDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(event.id, event.name)}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Delete event"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}