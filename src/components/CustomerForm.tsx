"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerSchema } from "@/services/CustomerService";
import { z } from "zod";

type CustomerFormData = z.infer<typeof CustomerSchema>;

interface Props {
    initialData?: CustomerFormData & { id?: string };
    isEditing?: boolean;
}

export default function CustomerForm({ initialData, isEditing = false }: Props) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CustomerFormData>(
        initialData || {
            customerCode: "",
            customerName: "",
            telephone: "",
            email: "",
            country: "",
            city: "",
            state: "",
            salesPerson: "",
            addresses: [],
            contacts: [],
            documents: [],
        }
    );

    const [uploading, setUploading] = useState(false);

    // OTP State
    const [originalEmail] = useState(initialData?.email || "");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [emailVerified, setEmailVerified] = useState(isEditing && !!initialData?.email);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSendOtp = async () => {
        if (!form.email) return;
        setOtpLoading(true);
        setOtpMessage(null);
        try {
            const res = await fetch("/api/customers/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setOtpSent(true);
            setOtpMessage({ type: 'success', text: "OTP sent to your email!" });
        } catch (err: any) {
            setOtpMessage({ type: 'error', text: err.message });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!form.email || !otp) return;
        setOtpLoading(true);
        setOtpMessage(null);
        try {
            const res = await fetch("/api/customers/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setEmailVerified(true);
            setOtpSent(false);
            setOtpMessage({ type: 'success', text: "Email verified successfully!" });
        } catch (err: any) {
            setOtpMessage({ type: 'error', text: err.message });
        } finally {
            setOtpLoading(false);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (form.email && !emailVerified && form.email !== originalEmail) {
            setError("Please verify the email address before saving.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const url = isEditing && initialData?.id ? `/api/customers/${initialData.id}` : "/api/customers";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to save customer");
            }

            router.push("/customer-master");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setForm((prev) => ({
                ...prev,
                documents: [
                    ...(prev.documents || []),
                    {
                        fileName: data.fileName,
                        filePath: data.filePath,
                        fileType: data.fileType,
                        fileSize: data.fileSize,
                        notes: "",
                    },
                ],
            }));
        } catch (err: any) {
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = "";
        }
    }

    const removeAddress = (index: number) => {
        setForm(prev => ({ ...prev, addresses: prev.addresses?.filter((_, i) => i !== index) }));
    };

    const removeContact = (index: number) => {
        setForm(prev => ({ ...prev, contacts: prev.contacts?.filter((_, i) => i !== index) }));
    };

    const removeDocument = (index: number) => {
        setForm(prev => ({ ...prev, documents: prev.documents?.filter((_, i) => i !== index) }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="rounded bg-red-50 p-4 text-sm text-red-600 border border-red-200">
                    {error}
                </div>
            )}

            {/* Basic Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Basic Information</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Customer Code *</label>
                        <input
                            type="text"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={form.customerCode}
                            onChange={(e) => setForm({ ...form, customerCode: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Customer Name *</label>
                        <input
                            type="text"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={form.customerName}
                            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Telephone</label>
                        <input
                            type="text"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={form.telephone || ""}
                            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 w-full">
                                <input
                                    type="email"
                                    className="block flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    value={form.email || ""}
                                    onChange={(e) => {
                                        setForm({ ...form, email: e.target.value });
                                        if (e.target.value !== originalEmail) {
                                            setEmailVerified(false);
                                            setOtpSent(false);
                                        } else if (originalEmail) {
                                            setEmailVerified(true);
                                        }
                                        setOtpMessage(null);
                                    }}
                                    disabled={emailVerified && form.email !== originalEmail}
                                />
                                {form.email && !emailVerified && form.email !== originalEmail && (
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={otpLoading}
                                        className="whitespace-nowrap rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                    >
                                        {otpSent ? "Resend OTP" : "Send OTP"}
                                    </button>
                                )}
                                {(emailVerified && form.email) || (isEditing && form.email === originalEmail && form.email) ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 shrink-0">
                                        Verified
                                    </span>
                                ) : null}
                            </div>

                            {otpSent && !emailVerified && (
                                <div className="flex flex-col gap-2 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <label className="text-xs font-medium text-gray-700">Enter OTP sent to email</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="6-digit OTP"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={otpLoading || !otp}
                                            className="whitespace-nowrap px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                </div>
                            )}

                            {otpMessage && (
                                <div className={`text-xs font-medium ${otpMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                    {otpMessage.text}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Sales Person</label>
                        <input
                            type="text"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={form.salesPerson || ""}
                            onChange={(e) => setForm({ ...form, salesPerson: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Addresses */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Addresses</h2>
                    <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, addresses: [...(prev.addresses || []), { address: "" }] }))}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Add Address
                    </button>
                </div>
                <div className="space-y-4">
                    {form.addresses?.map((addr, index) => (
                        <div key={index} className="relative grid gap-4 rounded border border-gray-100 bg-gray-50 p-4 md:grid-cols-2">
                            <button type="button" onClick={() => removeAddress(index)} className="absolute right-2 top-2 text-red-500 hover:text-red-700">×</button>
                            <div className="md:col-span-2">
                                <input
                                    placeholder="Address Line *"
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                    value={addr.address}
                                    onChange={(e) => {
                                        const newAddresses = [...(form.addresses || [])];
                                        newAddresses[index].address = e.target.value;
                                        setForm({ ...form, addresses: newAddresses });
                                    }}
                                />
                            </div>
                            <input
                                placeholder="City"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                value={addr.city || ""}
                                onChange={(e) => {
                                    const newAddresses = [...(form.addresses || [])];
                                    newAddresses[index].city = e.target.value;
                                    setForm({ ...form, addresses: newAddresses });
                                }}
                            />
                            <input
                                placeholder="State"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                value={addr.state || ""}
                                onChange={(e) => {
                                    const newAddresses = [...(form.addresses || [])];
                                    newAddresses[index].state = e.target.value;
                                    setForm({ ...form, addresses: newAddresses });
                                }}
                            />
                            <input
                                placeholder="Country"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                value={addr.country || ""}
                                onChange={(e) => {
                                    const newAddresses = [...(form.addresses || [])];
                                    newAddresses[index].country = e.target.value;
                                    setForm({ ...form, addresses: newAddresses });
                                }}
                            />
                            <input
                                placeholder="Telephone"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                value={addr.telephone || ""}
                                onChange={(e) => {
                                    const newAddresses = [...(form.addresses || [])];
                                    newAddresses[index].telephone = e.target.value;
                                    setForm({ ...form, addresses: newAddresses });
                                }}
                            />
                        </div>
                    ))}
                    {(!form.addresses || form.addresses.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No addresses added.</p>
                    )}
                </div>
            </div>

            {/* Contacts */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Contact Persons</h2>
                    <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, contacts: [...(prev.contacts || []), { contactName: "" }] }))}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        + Add Contact
                    </button>
                </div>
                <div className="space-y-4">
                    {form.contacts?.map((contact, index) => (
                        <div key={index} className="relative grid gap-4 rounded border border-gray-100 bg-gray-50 p-4 md:grid-cols-2">
                            <button type="button" onClick={() => removeContact(index)} className="absolute right-2 top-2 text-red-500 hover:text-red-700">×</button>
                            <input
                                placeholder="Name *"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                value={contact.contactName}
                                onChange={(e) => {
                                    const newContacts = [...(form.contacts || [])];
                                    newContacts[index].contactName = e.target.value;
                                    setForm({ ...form, contacts: newContacts });
                                }}
                            />
                            <input
                                placeholder="Position"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                value={contact.position || ""}
                                onChange={(e) => {
                                    const newContacts = [...(form.contacts || [])];
                                    newContacts[index].position = e.target.value;
                                    setForm({ ...form, contacts: newContacts });
                                }}
                            />
                            <input
                                placeholder="Email"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                value={contact.email || ""}
                                onChange={(e) => {
                                    const newContacts = [...(form.contacts || [])];
                                    newContacts[index].email = e.target.value;
                                    setForm({ ...form, contacts: newContacts });
                                }}
                            />
                            <input
                                placeholder="Phone"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                value={contact.phone || ""}
                                onChange={(e) => {
                                    const newContacts = [...(form.contacts || [])];
                                    newContacts[index].phone = e.target.value;
                                    setForm({ ...form, contacts: newContacts });
                                }}
                            />
                        </div>
                    ))}
                    {(!form.contacts || form.contacts.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No contacts added.</p>
                    )}
                </div>
            </div>

            {/* Documents */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Documents</h2>
                    <div className="relative">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        <button type="button" className="text-sm text-blue-600 hover:text-blue-800" disabled={uploading}>
                            {uploading ? "Uploading..." : "+ Upload Document"}
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    {form.documents?.map((doc, index) => (
                        <div key={index} className="relative flex flex-col gap-2 rounded border border-gray-100 bg-gray-50 p-4">
                            <button type="button" onClick={() => removeDocument(index)} className="absolute right-2 top-2 text-red-500 hover:text-red-700">×</button>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-700">{doc.fileName}</span>
                                <span className="text-xs text-gray-500">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                            </div>
                            <input
                                placeholder="Notes (optional)"
                                className="w-full rounded border border-gray-300 px-3 py-1 text-sm"
                                value={doc.notes || ""}
                                onChange={(e) => {
                                    const newDocs = [...(form.documents || [])];
                                    newDocs[index].notes = e.target.value;
                                    setForm({ ...form, documents: newDocs });
                                }}
                            />
                            {isEditing && (
                                <a href={`/api/files/${doc.filePath}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    Download
                                </a>
                            )}
                        </div>
                    ))}
                    {(!form.documents || form.documents.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
                <button
                    type="submit"
                    disabled={loading || uploading}
                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save Customer"}
                </button>
                <Link
                    href="/customer-master"
                    className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
