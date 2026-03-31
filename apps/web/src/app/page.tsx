import { Card, Button } from "@repo/ui";
import { formatDate } from "@repo/utils";

// Warn at startup if required environment variables are missing
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "[web] Warning: NEXT_PUBLIC_API_URL is not set. Some features may not work correctly."
  );
}

export default function Home() {
  const today = formatDate(new Date());

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-md w-full p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Web App</h1>
        <p className="text-gray-600">Today is {today}</p>
        <Button variant="primary">Get Started</Button>
      </Card>
    </main>
  );
}
