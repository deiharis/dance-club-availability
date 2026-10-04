"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import MemberForm, { MemberFormState } from "@/components/members/MemberForm";

export default function AddMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<MemberFormState>({
    fullName: "",
    registerNumber: "",
    email: "",
    phone: "",
    department: "",
    academicYear: "1",
    category: "MEMBER",
    isFFCS: false,
    position: "",
    team: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/members");
  }

  return (
    <div>
      <div data-section="People" className="c-page-header">
        <h1 className="text-white">Add member</h1>
        <p className="text-zinc-500 mt-0.5">Create an account and set their club role</p>
      </div>

      <div className="p-4 sm:p-8 max-w-5xl">
        <MemberForm
          mode="add"
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
