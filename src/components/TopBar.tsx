"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export function TopBar({ user }: { user: Session["user"] }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="text-sm text-gray-500">Masterglobal Logistics Order Management System</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">{user?.name ?? "User"}</span>
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Logout
        </button>
      </div>
    </header>
  );
}
