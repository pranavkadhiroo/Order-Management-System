"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { OrderSchema } from "@/services/OrderService"; // We'll infer types from this if possible, or just duplicate for client
// Actually OrderSchema might not be easily importable if it uses backend types.
// We'll define a local type or use basic validation.

type Customer = { id: string; customerCode: string; customerName: string };

// Define types locally for the form state since we don't have shared types package
type OrderDetail = { billNumber: string; marks: string; description: string; qty: number; weight: number; volume: number };
type Container = { billNumber: string; containerNumber: string; sealNumber: string; containerWeight: number };
type Charge = { description: string; qty: number; saleRate: number; costRate: number; vatPercent: number; currency: string };

function CustomerSearchSelect({ customers, value, onChange }: { customers: Customer[]; value: string; onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedCustomer = customers.find(c => c.id === value);
    const displayValue = open ? search : (selectedCustomer ? `${selectedCustomer.customerName} (${selectedCustomer.customerCode})` : "");

    const filtered = customers.filter(c =>
        c.customerName.toLowerCase().includes(search.toLowerCase()) ||
        c.customerCode.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <input
                type="text"
                className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md border p-2"
                placeholder={selectedCustomer ? `${selectedCustomer.customerName} (${selectedCustomer.customerCode})` : "Search a customer..."}
                value={displayValue}
                onChange={(e) => {
                    setSearch(e.target.value);
                    if (!open) setOpen(true);
                    if (value) onChange("");
                }}
                onFocus={() => { setOpen(true); setSearch(""); }}
            />
            {/* Hidden select for standard HTML required validation */}
            <select required value={value} onChange={() => { }} className="absolute opacity-0 w-0 h-0 pointer-events-none" tabIndex={-1}>
                <option value=""></option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select>

            {open && (
                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filtered.length === 0 ? (
                        <li className="relative cursor-default select-none py-2 px-3 text-gray-700">No customers found.</li>
                    ) : (
                        filtered.map(c => (
                            <li
                                key={c.id}
                                className={`relative cursor-pointer select-none py-2 px-3 hover:bg-blue-600 hover:text-white ${value === c.id ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                onClick={() => {
                                    onChange(c.id);
                                    setSearch("");
                                    setOpen(false);
                                }}
                            >
                                <span className={`block truncate ${value === c.id ? 'font-semibold' : 'font-normal'}`}>
                                    {c.customerName} ({c.customerCode})
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

type OrderFormProps = {
    customers: Customer[];
    initialData?: any; // strict type would be better but valid for now
};

export function OrderForm({ customers, initialData }: OrderFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        customerId: initialData?.customerId || "",
        orderNumber: initialData?.orderNumber || "",
        orderDate: initialData?.orderDate ? new Date(initialData.orderDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        executionDate: initialData?.executionDate ? new Date(initialData.executionDate).toISOString().split("T")[0] : "",
    });

    const [details, setDetails] = useState<OrderDetail[]>(initialData?.details || []);
    const [containers, setContainers] = useState<Container[]>(initialData?.containers || []);
    const [charges, setCharges] = useState<Charge[]>(initialData?.charges || []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const payload = {
            ...formData,
            details: details.map(d => ({ ...d, qty: Number(d.qty), weight: Number(d.weight), volume: Number(d.volume) })),
            containers: containers.map(c => ({ ...c, containerWeight: Number(c.containerWeight) })),
            charges: charges.map(c => ({ ...c, qty: Number(c.qty), saleRate: Number(c.saleRate), costRate: Number(c.costRate), vatPercent: Number(c.vatPercent) })),
        };

        try {
            const url = initialData?.id ? `/api/orders/${initialData.id}` : "/api/orders";
            const method = initialData?.id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Something went wrong");
            }

            router.push("/order-preparation");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to add/remove items
    const addDetail = () => setDetails([...details, { billNumber: "", marks: "", description: "", qty: 1, weight: 0, volume: 0 }]);
    const removeDetail = (index: number) => setDetails(details.filter((_, i) => i !== index));
    const updateDetail = (index: number, field: keyof OrderDetail, value: any) => {
        const newDetails = [...details];
        newDetails[index] = { ...newDetails[index], [field]: value };
        setDetails(newDetails);
    };

    const addContainer = () => setContainers([...containers, { billNumber: "", containerNumber: "", sealNumber: "", containerWeight: 0 }]);
    const removeContainer = (index: number) => setContainers(containers.filter((_, i) => i !== index));
    const updateContainer = (index: number, field: keyof Container, value: any) => {
        const newContainers = [...containers];
        newContainers[index] = { ...newContainers[index], [field]: value };
        setContainers(newContainers);
    };

    const addCharge = () => setCharges([...charges, { description: "", qty: 1, saleRate: 0, costRate: 0, vatPercent: 0, currency: "USD" }]);
    const removeCharge = (index: number) => setCharges(charges.filter((_, i) => i !== index));
    const updateCharge = (index: number, field: keyof Charge, value: any) => {
        const newCharges = [...charges];
        newCharges[index] = { ...newCharges[index], [field]: value };
        setCharges(newCharges);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
            <div className="space-y-6 sm:space-y-5">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Order Information</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Basic details of the order.</p>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                    <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">Customer</label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                        <CustomerSearchSelect
                            customers={customers}
                            value={formData.customerId}
                            onChange={(val) => setFormData({ ...formData, customerId: val })}
                        />
                    </div>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                    <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">Order Number</label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                            type="text"
                            required
                            value={formData.orderNumber}
                            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                            className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md border p-2"
                        />
                    </div>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                    <label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">Dates</label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2 flex gap-4">
                        <div>
                            <label className="block text-xs text-gray-500">Order Date</label>
                            <input
                                type="date"
                                required
                                value={formData.orderDate}
                                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                                className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Execution Date</label>
                            <input
                                type="date"
                                value={formData.executionDate}
                                onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                                className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 space-y-6 sm:pt-10 sm:space-y-5">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">BL Details</h3>
                    <button type="button" onClick={addDetail} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                        Add BL
                    </button>
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">BL No</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">BL Marks</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">BL Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">BL Qty</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">BL Weight</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">BL Volume</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {details.map((d, i) => (
                                <tr key={i}>
                                    <td className="px-2 py-2"><input type="text" className="w-full border-gray-300 rounded-md text-sm border p-1" value={d.billNumber} onChange={e => updateDetail(i, 'billNumber', e.target.value)} placeholder="Req" required /></td>
                                    <td className="px-2 py-2"><input type="text" className="w-full border-gray-300 rounded-md text-sm border p-1" value={d.marks} onChange={e => updateDetail(i, 'marks', e.target.value)} /></td>
                                    <td className="px-2 py-2"><input type="text" className="w-full border-gray-300 rounded-md text-sm border p-1" value={d.description} onChange={e => updateDetail(i, 'description', e.target.value)} /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.01" className="w-20 border-gray-300 rounded-md text-sm border p-1" value={d.qty} onChange={e => updateDetail(i, 'qty', e.target.value)} required /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.01" className="w-20 border-gray-300 rounded-md text-sm border p-1" value={d.weight} onChange={e => updateDetail(i, 'weight', e.target.value)} /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.01" className="w-20 border-gray-300 rounded-md text-sm border p-1" value={d.volume} onChange={e => updateDetail(i, 'volume', e.target.value)} /></td>
                                    <td className="px-2 py-2"><button type="button" onClick={() => removeDetail(i)} className="text-red-600 hover:text-red-900">X</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Containers */}
            <div className="pt-8 space-y-6 sm:pt-10 sm:space-y-5">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Containers</h3>
                    <button type="button" onClick={addContainer} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                        Add Container
                    </button>
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Container No</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">BL NO</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Container Seal No</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Container Weight</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {containers.map((c, i) => (
                                <tr key={i}>
                                    <td className="px-2 py-2"><input type="text" className="w-full border-gray-300 rounded-md text-sm border p-1" value={c.containerNumber} onChange={e => updateContainer(i, 'containerNumber', e.target.value)} /></td>
                                    <td className="px-2 py-2">
                                        <select
                                            className="w-full border-gray-300 rounded-md text-sm border p-1"
                                            value={c.billNumber}
                                            onChange={e => updateContainer(i, 'billNumber', e.target.value)}
                                        >
                                            <option value="">Select BL No</option>
                                            {details.filter(d => d.billNumber.trim() !== "").map((d, dIdx) => (
                                                <option key={dIdx} value={d.billNumber}>{d.billNumber}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-2"><input type="text" className="w-full border-gray-300 rounded-md text-sm border p-1" value={c.sealNumber} onChange={e => updateContainer(i, 'sealNumber', e.target.value)} /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.01" className="w-full border-gray-300 rounded-md text-sm border p-1" value={c.containerWeight} onChange={e => updateContainer(i, 'containerWeight', e.target.value)} /></td>
                                    <td className="px-2 py-2"><button type="button" onClick={() => removeContainer(i)} className="text-red-600 hover:text-red-900">X</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Charges */}
            <div className="pt-8 space-y-6 sm:pt-10 sm:space-y-5">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Charges</h3>
                    <button type="button" onClick={addCharge} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                        Add Charge
                    </button>
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Charge Code</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sale Rate</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost Rate</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">VAT %</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {charges.map((c, i) => (
                                <tr key={i}>
                                    <td className="px-2 py-2"><input type="text" className="w-full border-gray-300 rounded-md text-sm border p-1" value={c.description} onChange={e => updateCharge(i, 'description', e.target.value)} required /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.01" className="w-16 border-gray-300 rounded-md text-sm border p-1" value={c.qty} onChange={e => updateCharge(i, 'qty', e.target.value)} required /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.01" className="w-20 border-gray-300 rounded-md text-sm border p-1" value={c.saleRate} onChange={e => updateCharge(i, 'saleRate', e.target.value)} required /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.01" className="w-20 border-gray-300 rounded-md text-sm border p-1" value={c.costRate} onChange={e => updateCharge(i, 'costRate', e.target.value)} required /></td>
                                    <td className="px-2 py-2"><input type="number" step="0.01" className="w-16 border-gray-300 rounded-md text-sm border p-1" value={c.vatPercent} onChange={e => updateCharge(i, 'vatPercent', e.target.value)} /></td>
                                    <td className="px-2 py-2">
                                        <select className="w-16 border-gray-300 rounded-md text-sm border p-1" value={c.currency} onChange={e => updateCharge(i, 'currency', e.target.value)}>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                            <option value="AED">AED</option>
                                        </select>
                                    </td>
                                    <td className="px-2 py-2"><button type="button" onClick={() => removeCharge(i)} className="text-red-600 hover:text-red-900">X</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="pt-5">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Order"}
                    </button>
                </div>
            </div>
        </form>
    );
}
