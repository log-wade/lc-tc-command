import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-stone-400">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
