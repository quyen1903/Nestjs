import { Suspense } from "react";

import { AuthPage } from "@/features/auth/pages/auth-page";

export default function Login() {
  return (
    <Suspense>
      <AuthPage mode="login" />
    </Suspense>
  );
}
