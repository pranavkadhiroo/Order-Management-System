import { OrderService } from "@/services/OrderService";
import { notFound } from "next/navigation";

const orderService = new OrderService();

export const dynamic = "force-dynamic";

export default async function PrintOrderPage({ params }: { params: { id: string } }) {
    const order = await orderService.getOrder(params.id);

    if (!order) {
        notFound();
    }

    // Calculate totals for display
    const totals = order.charges.reduce(
        (acc, charge) => ({
            totalSale: acc.totalSale + charge.totalSale,
            totalCost: acc.totalCost + charge.totalCost,
            // We usually only print Sales for customer, but internal sheet might show cost? 
            // Prompt says "Printable Order Sheet"
            // "Display: Order header, Bills, Containers, Charges"
            // Assuming internal document since it shows Charges (which include Cost).
        }),
        { totalSale: 0, totalCost: 0 }
    );

    return (
        <div className="bg-white p-8 max-w-4xl mx-auto print:p-0">
            <div className="mb-8 border-b pb-4 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Order Sheet</h1>
                    <p className="text-gray-500 mt-1">Internal Document</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
                    <p className="text-gray-600">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Details</h3>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <p><span className="font-medium">Name:</span> {order.customer.customerName}</p>
                    <p><span className="font-medium">Code:</span> {order.customer.customerCode}</p>
                    {order.customer.telephone && <p><span className="font-medium">Phone:</span> {order.customer.telephone}</p>}
                </div>
            </div>

            {/* Bills */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bills / Goods</h3>
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bill No</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Weight</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {order.details.map((d) => (
                            <tr key={d.id}>
                                <td className="px-4 py-2 text-sm text-gray-900">{d.billNumber}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{d.description}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-900">{d.qty}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-500">{d.weight}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Containers */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Containers</h3>
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Container No</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seal No</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ref Bill</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {order.containers.map((c) => (
                            <tr key={c.id}>
                                <td className="px-4 py-2 text-sm text-gray-900">{c.containerNumber}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{c.sealNumber}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{c.billNumber}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Charges */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Financials</h3>
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Values</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {order.charges.map((c) => (
                            <tr key={c.id}>
                                <td className="px-4 py-2 text-sm text-gray-900">{c.description}</td>
                                <td className="px-4 py-2 text-right text-sm text-gray-500">
                                    {c.qty} @ {c.saleRate} {c.currency}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                        <tr>
                            <td className="px-4 py-2 text-right text-sm text-gray-900">Total Sale:</td>
                            <td className="px-4 py-2 text-right text-sm text-gray-900">{totals.totalSale.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="print:hidden mt-8 text-center">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                    Print Sheet
                </button>
            </div>
        </div>
    );
}
