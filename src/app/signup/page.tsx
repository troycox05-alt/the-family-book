import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-brass-light">The Family Book</h1>
          <p className="mt-1 text-sm text-cream-dim">Every new account starts with a $500 stake.</p>
        </div>
        <Card className="p-6">
          <SignupForm />
        </Card>
        <p className="mt-6 text-center text-sm text-cream-dim">
          Already have a tab?{" "}
          <Link href="/login" className="text-brass-light underline underline-offset-2 hover:text-brass">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
