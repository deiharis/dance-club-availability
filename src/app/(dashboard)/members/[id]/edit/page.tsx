"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import MemberForm, { MemberFormState } from "@/components/members/MemberForm";
import ResetPassword from "@/components/members/ResetPassword";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [canReset, setCanReset] = useState(false);

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
  });

  useEffect(() => {
    fetch(`/api/members/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          fullName: data.fullName ?? "",
          registerNumber: data.registerNumber ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          department: data.department ?? "",
          academicYear: String(data.academicYear ?? "1"),
          category: data.category ?? "MEMBER",
          isFFCS: data.isFFCS ?? false,
          position: data.position ?? "",
          team: data.team ?? "",
        });
        setCanReset(!!data.canResetPassword);
        setFetching(false);
      })
      .catch(() => {
        setError("Failed to load member data");
        setFetching(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalIsFFCS = form.category === "FFCS_ONLY" ? true : form.isFFCS;

    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isFFCS: finalIsFFCS }),
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
      <div data-section="People" className="c-page-header flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white">Edit member</h1>
          <p className="text-zinc-500 mt-0.5">Update details and club role</p>
        </div>
        <Link
          href="/members"
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5"
        >
          Back to members
        </Link>
      </div>

      <div className="p-4 sm:p-8 max-w-5xl">
        {fetching ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-zinc-500">Loading member data...</p>
          </div>
        ) : (
          <>
            <MemberForm
              mode="edit"
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
            />
            {canReset && <ResetPassword memberId={id} name={form.fullName} />}
          </>
        )}
      </div>
    </div>
  );
}
