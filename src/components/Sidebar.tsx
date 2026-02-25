"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/customer-master", label: "Customer Master" },
  { href: "/order-preparation", label: "Order Preparation" },
  { href: "/reports", label: "Reports" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-800">Order Management</span>
        </div>
        <nav className="flex-1 p-2">
          <ul className="space-y-0.5">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`block rounded px-3 py-2 text-sm font-medium ${active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
