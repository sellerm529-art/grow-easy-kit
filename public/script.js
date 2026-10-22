const PRICE_PAISE = 9900;
const PRODUCT_NAME = "Grow Easy Kit — Small Business Marketing Bundle";
const buyButton = document.getElementById("buy-button");
const statusLine = document.getElementById("checkout-status");
const dialog = document.getElementById("result-dialog");
const dialogTitle = document.getElementById("dialog-title");
const dialogMessage = document.getElementById("dialog-message");
const downloadLink = document.getElementById("download-link");
const retryButton = document.getElementById("retry-button");

document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("dialog-close").addEventListener("click", () => dialog.close());
retryButton.addEventListener("click", () => { dialog.close(); startCheckout(); });

function showDialog(title, message, downloadUrl = "") {
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  downloadLink.classList.toggle("hidden", !downloadUrl);
  if (downloadUrl) downloadLink.href = downloadUrl;
  retryButton.classList.add("hidden");
  if (!dialog.open) dialog.showModal();
}

async function startCheckout() {
  if (!window.Razorpay) {
    statusLine.textContent = "Checkout library did not load. Check your connection and try again.";
    return;
  }
  buyButton.disabled = true;
  buyButton.textContent = "Preparing secure checkout…";
  statusLine.textContent = "Creating a secure order. Please wait.";
  try {
    const response = await fetch("/.netlify/functions/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: "grow-easy-kit-bundle" })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create an order.");
    const checkout = new Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "Grow Easy Kit",
      description: PRODUCT_NAME,
      order_id: data.orderId,
      image: "/product-cover.png",
      theme: { color: "#111b35" },
      handler: async function (paymentResponse) {
        statusLine.textContent = "Payment received by checkout. Verifying securely…";
        try {
          const verifyResponse = await fetch("/.netlify/functions/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            })
          });
          const result = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(result.error || "Payment verification failed.");
          statusLine.textContent = "Payment verified. Your download is ready.";
          showDialog("Payment verified!", "Your payment was verified successfully. Use the secure download button below. The link expires soon.", result.downloadUrl);
        } catch (err) {
          statusLine.textContent = "We couldn't verify the payment in this browser. Please contact support with your Razorpay payment ID.";
          showDialog("Verification pending", `${err.message} If money was deducted, do not pay again immediately; contact support and share your payment ID.`);
        }
      },
      modal: {
        ondismiss: () => {
          statusLine.textContent = "Checkout closed. You can try again whenever you're ready.";
          buyButton.disabled = false;
          buyButton.innerHTML = 'Get instant access — ₹99 <span>→</span>';
        }
      },
      retry: { enabled: true }
    });
    checkout.on("payment.failed", function (failure) {
      statusLine.textContent = failure.error?.description || "Payment failed. Please try another available payment method.";
      buyButton.disabled = false;
      buyButton.innerHTML = 'Get instant access — ₹99 <span>→</span>';
    });
    checkout.open();
  } catch (err) {
    statusLine.textContent = err.message || "Checkout setup is not complete yet.";
    buyButton.disabled = false;
    buyButton.innerHTML = 'Get instant access — ₹99 <span>→</span>';
  }
}
buyButton.addEventListener("click", startCheckout);
