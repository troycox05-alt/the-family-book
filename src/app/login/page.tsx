import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-brass-light">The Family Book</h1>
          <p className="mt-1 text-sm text-cream-dim">Est. this season &middot; fake money, real bragging rights</p>
        </div>
        <Card className="p-6">
          <LoginForm />
        </Card>
        <p className="mt-6 text-center text-sm text-cream-dim">
          New around here?{" "}
          <Link href="/signup" className="text-brass-light underline underline-offset-2 hover:text-brass">
            Open a tab
          </Link>
        </p>
      </div>
    </main>
  );
}
