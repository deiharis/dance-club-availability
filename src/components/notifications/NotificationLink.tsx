"use client";

import Link from "next/link";

// A notification that links somewhere. Opening an unread one marks just that one as read
// (keepalive lets the request finish while the next page loads). The unread dot and sidebar
// badge update the next time the page is shown.
export default function NotificationLink({
  id,
  href,
  unread,
  children,
}: {
  id: string;
  href: string;
  unread: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block"
      onClick={() => {
        if (!unread) return;
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
          keepalive: true,
        }).catch(() => {});
      }}
    >
      {children}
    </Link>
  );
}

