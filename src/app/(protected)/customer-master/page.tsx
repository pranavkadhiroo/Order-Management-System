"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  customerCode: string;
  customerName: string;
  telephone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
};

export default function CustomerMasterPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      const res = await fetch(`/api/customers?page=${page}&pageSize=${pageSize}`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (!cancelled) {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
      setLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [page]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Master</h1>
        <Link href="/customer-master/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add Customer</Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No customers yet. Add one to get started.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Telephone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Country</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{c.customerCode}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{c.customerName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.telephone ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.email ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.country ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <Link href={`/customer-master/${c.id}`} className="text-blue-600 hover:underline">View / Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <span className="text-sm text-gray-500">Page {page} of {totalPages} ({total} total)</span>
                <div className="flex gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-50">Previous</button>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
