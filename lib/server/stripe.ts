import { ProxyAgent, fetch as undiciFetch } from "undici";

const STRIPE_API = "https://api.stripe.com/v1";

function getProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy
  );
}

function encodeForm(obj: Record<string, any>, prefix = ""): string[] {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          pairs.push(...encodeForm(item, `${fullKey}[${i}]`));
        } else {
          pairs.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof value === "object") {
      pairs.push(...encodeForm(value, fullKey));
    } else {
      pairs.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
    }
  }
  return pairs;
}

async function stripeFetch(path: string, init: { method: string; body?: string }) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to your .env.local file.");
  }
  const proxyUrl = getProxyUrl();
  const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
  };
  if (init.body) headers["Content-Type"] = "application/x-www-form-urlencoded";

  const res = await undiciFetch(`${STRIPE_API}${path}`, {
    method: init.method,
    headers,
    body: init.body,
    ...(dispatcher ? { dispatcher } : {}),
  } as any);

  const data: any = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || `Stripe request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(params: {
  lineItems: { name: string; images: string[]; amount: number; qty: number }[];
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  shippingAmount: number;
  metadata: Record<string, string>;
}) {
  const line_items = params.lineItems.map((li) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: li.name,
        images: li.images.slice(0, 1),
      },
      unit_amount: li.amount,
    },
    quantity: li.qty,
  }));

  if (params.shippingAmount > 0) {
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Shipping" },
        unit_amount: params.shippingAmount,
      },
      quantity: 1,
    } as any);
  }

  return stripeFetch("/checkout/sessions", {
    method: "POST",
    body: encodeForm({
      mode: "payment",
      line_items,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: params.metadata,
    }).join("&"),
  });
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripeFetch(`/checkout/sessions/${encodeURIComponent(sessionId)}`, { method: "GET" });
}
