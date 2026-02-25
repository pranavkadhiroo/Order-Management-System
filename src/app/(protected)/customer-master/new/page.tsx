"use client";

import CustomerForm from "@/components/CustomerForm";
import Link from "next/link";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/customer-master" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">New Customer</h1>
      </div>
      <CustomerForm />
    </div>
  );
}
