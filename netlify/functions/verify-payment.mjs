import { createHmac, timingSafeEqual } from "node:crypto";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || "digital-deliveries";
  const objectPath = process.env.BUNDLE_OBJECT_PATH || "grow-easy-kit-bundle.zip";

  if (!keyId || !keySecret) return json({ error: "Payment verification is not configured." }, 503);
  if (!supabaseUrl || !serviceKey) return json({ error: "Secure download delivery is not configured yet." }, 503);

  try {
    const body = await request.json();
    const orderId = String(body.razorpay_order_id || "");
    const paymentId = String(body.razorpay_payment_id || "");
    const signature = String(body.razorpay_signature || "");
    if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) {
      return json({ error: "Invalid payment details." }, 400);
    }

    const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest();
    const supplied = Buffer.from(signature, "hex");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      return json({ error: "Payment signature did not match." }, 400);
    }

    // Verify the payment against Razorpay itself as well as checking the checkout signature.
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { "Authorization": `Basic ${auth}` }
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok) return json({ error: "Could not confirm payment status with Razorpay." }, 502);
    if (payment.order_id !== orderId || payment.status !== "captured" || payment.amount !== 9900 || payment.currency !== "INR") {
      return json({ error: "Payment is not captured for the expected ₹99 order yet." }, 402);
    }

    // Create a short-lived signed URL only after verification; keep bucket private.
    const storageUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
    const storageResponse = await fetch(storageUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${serviceKey}`, "apikey": serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 600, download: "grow-easy-kit-bundle.zip" })
    });
    const storage = await storageResponse.json();
    if (!storageResponse.ok || !storage.signedURL) {
      console.error("Storage signed URL failed:", storageResponse.status);
      return json({ error: "Payment is verified, but download delivery is not ready. Contact support; do not pay again." }, 503);
    }
    const downloadUrl = storage.signedURL.startsWith("http") ? storage.signedURL : `${supabaseUrl.replace(/\/$/, "")}/storage/v1${storage.signedURL}`;
    return json({ verified: true, downloadUrl });
  } catch (error) {
    console.error("verify-payment error:", error?.message);
    return json({ error: "Could not verify this payment right now." }, 500);
  }
};

export const config = { path: "/.netlify/functions/verify-payment" };
