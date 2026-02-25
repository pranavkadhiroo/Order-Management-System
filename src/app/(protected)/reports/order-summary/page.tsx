import { ReportService } from "@/services/ReportService";
import Link from "next/link";
import { redirect } from "next/navigation";

const reportService = new ReportService();

export const dynamic = "force-dynamic";

export default async function OrderSummaryReportPage({
    searchParams,
}: {
    searchParams: { startDate?: string; endDate?: string; currency?: string };
}) {
    const startDate = searchParams.startDate ? new Date(searchParams.startDate) : undefined;
    const endDate = searchParams.endDate ? new Date(searchParams.endDate) : undefined;
    const currency = (searchParams.currency as "USD" | "AED") || "USD";

    const data = await reportService.getOrderSummary(startDate, endDate, currency);

    // Calculate grand totals
    const grandTotal = data.reduce(
        (acc, row) => ({
            totalSale: acc.totalSale + row.totalSale,
            totalCost: acc.totalCost + row.totalCost,
            vatSale: acc.vatSale + row.vatSale,
            vatCost: acc.vatCost + row.vatCost,
            netAmount: acc.netAmount + row.netAmount,
        }),
        { totalSale: 0, totalCost: 0, vatSale: 0, vatCost: 0, netAmount: 0 }
    );

    const exportExcelUrl = `/api/reports/orders-export?startDate=${searchParams.startDate || ""}&endDate=${searchParams.endDate || ""}&currency=${currency}`;
    const exportXmlUrl = `/api/reports/orders-export-xml?startDate=${searchParams.startDate || ""}&endDate=${searchParams.endDate || ""}&currency=${currency}`;

    async function filter(formData: FormData) {
        "use server";
        const start = formData.get("startDate")?.toString();
        const end = formData.get("endDate")?.toString();
        const curr = formData.get("currency")?.toString();

        const params = new URLSearchParams();
        if (start) params.set("startDate", start);
        if (end) params.set("endDate", end);
        if (curr) params.set("currency", curr);

        redirect(`/reports/order-summary?${params.toString()}`);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Order Summary Report</h1>
                <div className="flex gap-2">
                    <Link
                        href="/reports"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Back
                    </Link>
                    <a
                        href={exportExcelUrl}
                        target="_blank"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                    >
                        Export Excel ({currency})
                    </a>
                    <a
                        href={exportXmlUrl}
                        target="_blank"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                        Export XML ({currency})
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <form action={filter} className="flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" name="startDate" defaultValue={searchParams.startDate} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" name="endDate" defaultValue={searchParams.endDate} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <select name="currency" defaultValue={currency} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2">
                            <option value="USD">USD</option>
                            <option value="AED">AED</option>
                        </select>
                    </div>
                    <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filter</button>
                    <Link href="/reports/order-summary" className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Clear</Link>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Order #</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Total Sale ({currency})</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Total Cost ({currency})</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">VAT Sale ({currency})</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">VAT Cost ({currency})</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Net Amount ({currency})</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr><td colSpan={8} className="px-6 py-4 text-center text-gray-500">No data found.</td></tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.orderNumber} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{row.orderNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.executionDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">{row.totalSale.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">{row.totalCost.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">{row.vatSale.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">{row.vatCost.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900">{row.netAmount.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-right">Totals:</td>
                            <td className="px-6 py-4 text-right">{grandTotal.totalSale.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">{grandTotal.totalCost.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">{grandTotal.vatSale.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">{grandTotal.vatCost.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">{grandTotal.netAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
