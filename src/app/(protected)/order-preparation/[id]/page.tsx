import { CustomerRepository } from "@/repositories/CustomerRepository";
import { OrderService } from "@/services/OrderService";
import { OrderForm } from "@/components/OrderForm";
import { notFound } from "next/navigation";
import Link from "next/link";

const customerRepository = new CustomerRepository();
const orderService = new OrderService();

export const dynamic = "force-dynamic";

export default async function EditOrderPage({ params }: { params: { id: string } }) {
    const order = await orderService.getOrder(params.id);

    if (!order) {
        notFound();
    }

    const customers = await customerRepository.listCustomersForDropdown();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Edit Order: {order.orderNumber}</h1>
                <div className="flex gap-2">
                    <Link
                        href={`/orders/${order.id}/print`}
                        target="_blank"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        Print
                    </Link>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <OrderForm customers={customers} initialData={order} />
            </div>
        </div>
    );
}
