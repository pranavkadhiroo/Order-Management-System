"use client";

import CustomerForm from "@/components/CustomerForm";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditCustomerPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/customers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customer");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/customer-master" className="text-gray-600 hover:text-gray-900">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Customer</h1>
      </div>
      {data && <CustomerForm initialData={data} isEditing />}
    </div>
  );
}
