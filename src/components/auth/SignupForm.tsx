"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (pin !== confirmPin) {
      setError("PINs don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create an account.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm text-muted">
          Choose a username
        </label>
        <Input
          id="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={20}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pin" className="text-sm text-muted">
          Choose a PIN (4-8 digits)
        </label>
        <Input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          pattern="\d{4,8}"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPin" className="text-sm text-muted">
          Confirm PIN
        </label>
        <Input
          id="confirmPin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          pattern="\d{4,8}"
          required
        />
      </div>
      {error && <p className="text-sm text-loss">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Opening your tab…" : "Open a $500 tab"}
      </Button>
    </form>
  );
}
