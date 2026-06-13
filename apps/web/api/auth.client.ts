import { apiConfig } from "@/api/config";
import { apiRequest } from "@/api/http";
import type { ActorRole, AuthSession } from "@/types/domain";

type LoginInput = {
  email: string;
  password: string;
  role: "user" | "shop";
};

type RegisterInput = LoginInput & {
  name: string;
  businessName?: string;
  businessType?: string;
};

export async function login(input: LoginInput): Promise<AuthSession> {
  if (apiConfig.mode === "live") {
    try {
      const payload = await apiRequest<Record<string, any>>(input.role === "shop" ? "/login" : "/loginManual", {
        method: "POST",
        body: {
          email: input.email,
          password: input.password,
          deviceName: "Next.js web",
          deviceId: `web-${crypto.randomUUID()}`
        }
      });
      return toSession(payload, input.role === "shop" ? "SHOP" : "USER");
    } catch {
      // TODO: replace mock fallback with HTTP-only cookie based auth once backend session routes are ready.
    }
  }

  return simulate({
    actorId: input.role === "shop" ? "shop-northstar" : "user-demo",
    role: input.role === "shop" ? "SHOP" : "USER",
    email: input.email,
    displayName: input.role === "shop" ? "Northstar Supply" : "Demo Customer",
    organizationId: input.role === "shop" ? "shop-northstar" : undefined
  });
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  if (apiConfig.mode === "live") {
    try {
      const endpoint = input.role === "shop" ? "/register" : "/user/registerManual";
      const body =
        input.role === "shop"
          ? {
              email: input.email,
              password: input.password,
              name: input.name,
              businessName: input.businessName ?? input.name,
              businessType: input.businessType ?? "Retail",
              currency: "USD",
              theme: "light",
              language: "en"
            }
          : {
              email: input.email,
              password: input.password,
              name: input.name,
              currency: "USD",
              theme: "light",
              language: "en"
            };
      const payload = await apiRequest<Record<string, any>>(endpoint, { method: "POST", body });
      return toSession(payload, input.role === "shop" ? "SHOP" : "USER");
    } catch {
      // TODO: show backend validation codes directly once auth responses are consistent.
    }
  }

  return simulate({
    actorId: input.role === "shop" ? "shop-northstar" : "user-demo",
    role: input.role === "shop" ? "SHOP" : "USER",
    email: input.email,
    displayName: input.name,
    organizationId: input.role === "shop" ? "shop-northstar" : undefined
  });
}

export async function logout(session: AuthSession | null): Promise<void> {
  if (apiConfig.mode === "live" && session?.accessToken) {
    try {
      await apiRequest("/logout", { method: "POST", token: session.accessToken });
    } catch {
      // Local session teardown still proceeds.
    }
  }
}

function toSession(payload: Record<string, any>, fallbackRole: ActorRole): AuthSession {
  const account = payload.user ?? payload.shop ?? payload.account ?? {};
  return {
    actorId: String(account.id ?? payload.userId ?? payload.shopId ?? payload.accountId ?? ""),
    role: (payload.role ?? fallbackRole) as ActorRole,
    email: String(payload.email ?? account.email ?? ""),
    displayName: String(account.name ?? payload.shopName ?? payload.name ?? "Account"),
    organizationId: fallbackRole === "SHOP" ? String(account.id ?? payload.shopId ?? payload.accountId ?? "") : undefined,
    accessToken: payload.accessToken
  };
}

function simulate<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 180);
  });
}
