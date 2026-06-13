import { Suspense } from "react";

import { AuthPage } from "@/features/auth/pages/auth-page";

export default function Register() {
  return (
    <Suspense>
      <AuthPage mode="register" />
    </Suspense>
  );
}
