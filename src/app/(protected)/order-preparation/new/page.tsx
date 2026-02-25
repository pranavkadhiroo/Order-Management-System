import { CustomerRepository } from "@/repositories/CustomerRepository";
import { OrderForm } from "@/components/OrderForm";

const customerRepository = new CustomerRepository();

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
    const customers = await customerRepository.listCustomersForDropdown();

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Order</h1>
            <div className="bg-white shadow rounded-lg p-6">
                <OrderForm customers={customers} />
            </div>
        </div>
    );
}
