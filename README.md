# Grow Easy Kit Store (Netlify + Razorpay)

A starter storefront with HTML/CSS/JS, Netlify Functions, Razorpay Checkout, server-side order creation, signature verification, a server-side payment status check, and a short-lived Supabase Storage download link.

## Before you start

- Razorpay account must be activated for the payment methods you want to accept.
- This starter's price is fixed on the server at **₹99 (9900 paise)**.
- Show ₹499 as a struck-through reference price only if it is a truthful, supportable original/reference price.
- This is starter code, not a substitute for a live test, policy review, and payment-provider approval.
- Never put Razorpay Secret Key or Supabase service-role key in `public/`, browser JS, Git, screenshots, or customer-facing code.

## Project files

- `public/index.html` — store homepage
- `public/styles.css` — responsive styling
- `public/script.js` — Razorpay Checkout browser flow
- `public/policies.html` — policy placeholders
- `netlify/functions/create-order.mjs` — server-side Razorpay order creation
- `netlify/functions/verify-payment.mjs` — signature and captured-payment verification + signed download URL
- `netlify.toml` — Netlify publish/functions paths and basic security headers

## 1. Prepare your digital bundle

Create a ZIP containing the actual deliverables (your PDFs, prompt packs, WhatsApp messages, and a `START-HERE.pdf` with your Canva template links). Don't put private Canva editing credentials or any secret keys inside. Keep the ZIP file on your computer; it will be uploaded to a **private** Supabase Storage bucket.

## 2. Create a Supabase private storage bucket

1. Sign in at https://supabase.com/ and create a project.
2. Open **Storage** → **New bucket**.
3. Name it `digital-deliveries` and leave **Public bucket OFF**.
4. Upload your ZIP into the bucket with this exact object path: `grow-easy-kit-bundle.zip`.
5. In Project Settings → API, copy the Project URL and the **service_role** key. Keep the service role key private. Never use it in browser code.

## 3. Check Razorpay status

1. Sign in at https://dashboard.razorpay.com/.
2. Check account activation / KYC and whether Live Mode is enabled.
3. Use Test Mode keys first. Test key IDs commonly begin `rzp_test_`; live keys commonly begin `rzp_live_`.
4. If the account is not activated, finish Razorpay's legitimate onboarding. Do not use live keys until the dashboard confirms activation and payment methods are enabled.
5. Test payments and live payments are different; never treat a test payment as real revenue.

## 4. Deploy to Netlify

1. Unzip this project.
2. Go to https://app.netlify.com/ and sign in.
3. For the easiest first deployment, drag the **whole project folder** into Netlify Drop at https://app.netlify.com/drop, or import the folder through a Git repository. If using a Git repo, keep the project root as the base directory.
4. Confirm the deployed site loads. The functions directory must remain `netlify/functions` and publish directory `public`.

## 5. Add environment variables in Netlify

Open your site → **Project configuration** → **Environment variables**. Add these variables, with scope including Functions where the UI asks:

- `RAZORPAY_KEY_ID` = your Razorpay test key ID
- `RAZORPAY_KEY_SECRET` = matching Razorpay test key secret
- `SUPABASE_URL` = your Supabase project URL, e.g. `https://YOURPROJECT.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service_role key
- `SUPABASE_BUCKET` = `digital-deliveries`
- `BUNDLE_OBJECT_PATH` = `grow-easy-kit-bundle.zip`

Do not add the Secret Key or service-role key to `script.js`, `index.html`, `netlify.toml`, or a public GitHub repository. Redeploy after adding/changing variables.

## 6. Test the functions and checkout

1. Redeploy after setting variables.
2. Open your site and click **Get instant access — ₹99**.
3. In Test Mode, use Razorpay's currently documented test payment methods/test cards. Do not use a real card or UPI payment for a test.
4. Check that the payment is captured in the test dashboard and that the secure download link works.
5. Test a failed/cancelled payment and ensure no download link is shown.
6. If checkout says account not configured, check Netlify function logs and environment variables.

## 7. Go live

Only after tests pass:
1. Confirm Razorpay KYC/account activation and live payment methods.
2. Replace `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Netlify with matching live credentials from Razorpay Dashboard.
3. Redeploy.
4. Make a small legitimate live purchase only if you are comfortable with the fees and refund process.
5. Confirm a captured live payment gives a short-lived download URL.

## 8. Policies and customer support

Edit `public/policies.html` and replace all example contact details before launching. Explain exactly what the digital product includes, how delivery works, what happens if a download fails, and how customers contact you. Make your refund/cancellation terms clear and consistent with applicable law and payment-provider rules. Do not publish placeholder contact details.

## Important technical notes

- The order amount is fixed on the server at ₹99, so a customer cannot change the price by editing the browser.
- The backend verifies the HMAC signature and separately checks Razorpay's payment status, order ID, amount, and currency before issuing a download link.
- The Supabase bucket must stay private. The signed URL expires after 10 minutes.
- This implementation does not include order database, email receipts, automated refunds, tax invoices, or webhook reconciliation. Add these before scaling. If a payment succeeds but download signing fails, the site tells the customer not to pay again and to contact support.
- If your browser or Netlify deployment reports an error, share the error text (never secrets) and we can debug it.
