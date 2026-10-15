const API_BASE_URL = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";
const signinForm = document.getElementById("signinForm");
const signinMessage = document.getElementById("signinMessage");

function readJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch (_error) {
    return {};
  }
}

function dashboardForRole(role) {
  const routes = {
    ADMIN: "admin_page.html",
    AGENT: "agent_page.html",
    SELLER: "seller_page.html",
    BUYER: "buyer_page.html",
    VERIFICATION_OFFICER: "verificationOfficer_page.html",
    BOOKING_MANAGER: "bookingManager_page.html"
  };
  return routes[role] || "index.html";
}

signinForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const submitButton = signinForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Signing in...";
  signinMessage.textContent = "";

  const email = (document.getElementById("email").value || "").trim().toLowerCase();
  const password = (document.getElementById("password").value || "").trim();

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    let errorText = "Invalid email or password. Please verify and try again.";
    let data = {};
    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
        errorText = data.message || data.error || errorText;
      } catch (_jsonErr) {
        if (text && text.trim().length > 0) {
          errorText = text.trim();
        }
      }
    } catch (_readErr) {}

    if (!response.ok || !data.token) {
      throw new Error(errorText);
    }

    const claims = readJwtPayload(data.token);
    const authorities = claims.authorities || claims.roles || claims.role || [];
    const roleValue = data.role || (Array.isArray(authorities) ? authorities[0] : authorities);
    const role = String(roleValue || "").replace(/^ROLE_/, "").toUpperCase();
    localStorage.setItem("jwtToken", data.token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", data.email || claims.sub || email);
    if (data.firstName) localStorage.setItem("userFirstName", data.firstName);
    if (data.lastName) localStorage.setItem("userLastName", data.lastName);
    if (data.phone) localStorage.setItem("userPhone", data.phone);
    if (data.licenseNumber) localStorage.setItem("licenseNumber", data.licenseNumber);

    signinMessage.className = "message success";
    signinMessage.textContent = "Signed in successfully. Redirecting to your dashboard...";
    setTimeout(() => { window.location.href = dashboardForRole(role); }, 650);
  } catch (error) {
    signinMessage.className = "message error";
    signinMessage.textContent = error.message || "Could not connect to the server.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign in →";
  }
});

const togglePasswordBtn = document.getElementById("togglePasswordBtn");
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePasswordBtn.textContent = "🙈";
    } else {
      passwordInput.type = "password";
      togglePasswordBtn.textContent = "👁️";
    }
  });
}

document.getElementById("forgotPassword").addEventListener("click", function () {
  signinMessage.className = "message";
  signinMessage.textContent = "Please contact system administrator (admin@nookandkey.com) to reset your password.";
});
