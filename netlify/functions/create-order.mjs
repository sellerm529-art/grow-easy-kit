import { randomUUID } from "node:crypto";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return json({ error: "Payments are not configured yet. Please try again later." }, 503);

  try {
    const body = await request.json().catch(() => ({}));
    if (body.product !== "grow-easy-kit-bundle") return json({ error: "Invalid product." }, 400);

    // Price is fixed server-side; never trust a price sent by the browser.
    const amount = 100; // ₹99.00 in paise
    const receipt = `gek_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "INR", receipt, notes: { product: "grow-easy-kit-bundle" } })
    });
    const order = await response.json();
    if (!response.ok) {
      console.error("Razorpay order creation failed:", response.status, order?.error?.code);
      return json({ error: "Razorpay could not create the order. Check account activation and API keys." }, 502);
    }
    return json({ keyId, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error("create-order error:", error?.message);
    return json({ error: "Unable to start checkout right now." }, 500);
  }
};

export const config = { path: "/.netlify/functions/create-order" };
