import Link from "next/link";

export default function ReportsPage() {
  const reports = [
    {
      name: "Order Summary Report",
      description: "View and export aggregated order financial data.",
      href: "/reports/order-summary",
    },
    // Add more reports here
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Reports</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="block p-6 bg-white rounded-lg shadow hover:bg-gray-50 transition border border-gray-200"
          >
            <h2 className="text-lg font-medium text-gray-900">{report.name}</h2>
            <p className="mt-2 text-sm text-gray-500">{report.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
