import { Card, Button } from "@repo/ui";
import { formatDate } from "@repo/utils";

// Warn at startup if required environment variables are missing
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "[dashboard] Warning: NEXT_PUBLIC_API_URL is not set. Some features may not work correctly."
  );
}

export default function Dashboard() {
  const today = formatDate(new Date());

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 space-y-2">
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">1,284</p>
          </Card>
          <Card className="p-6 space-y-2">
            <p className="text-sm font-medium text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-gray-900">$24,500</p>
          </Card>
          <Card className="p-6 space-y-2">
            <p className="text-sm font-medium text-gray-500">Active Sessions</p>
            <p className="text-2xl font-bold text-gray-900">42</p>
          </Card>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          <div className="flex gap-3">
            <Button variant="primary">New Report</Button>
            <Button variant="secondary">Export Data</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
