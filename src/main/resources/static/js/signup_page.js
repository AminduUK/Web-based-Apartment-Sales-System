const API_BASE_URL = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";

const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");
const roleSelect = document.getElementById("role");
const submitButton = document.getElementById("submitButton");

const agentFields = document.getElementById("agentFields");
const sellerFields = document.getElementById("sellerFields");
const buyerFields = document.getElementById("buyerFields");
const licenseNumberInput = document.getElementById("licenseNumber");

const brandEyebrow = document.getElementById("brandEyebrow");
const brandTitle = document.getElementById("brandTitle");
const brandDescription = document.getElementById("brandDescription");
const formTitle = document.getElementById("formTitle");
const formDescription = document.getElementById("formDescription");

function updateRoleUI() {
  const role = roleSelect.value;

  if (role === "AGENT") {
    agentFields.classList.remove("hidden");
    sellerFields.classList.add("hidden");
    buyerFields.classList.add("hidden");
    if (licenseNumberInput) licenseNumberInput.required = true;

    brandEyebrow.textContent = "Agent Network";
    brandTitle.innerHTML = "Showcase listings with <em>certified authority.</em>";
    brandDescription.textContent = "Connect buyers with premium properties, facilitate viewings, and grow your real estate portfolio.";
    formTitle.textContent = "Register as Certified Agent";
    formDescription.textContent = "Provide your real estate licensing details to access the agent workspace.";
    submitButton.textContent = "Register as Certified Agent →";

  } else if (role === "SELLER") {
    sellerFields.classList.remove("hidden");
    agentFields.classList.add("hidden");
    buyerFields.classList.add("hidden");
    if (licenseNumberInput) licenseNumberInput.required = false;

    brandEyebrow.textContent = "Seller Center";
    brandTitle.innerHTML = "Turn your space into someone’s <em>next home.</em>";
    brandDescription.textContent = "List your apartments, reach verified buyers and certified agents, and manage sales milestones.";
    formTitle.textContent = "Register as Property Seller";
    formDescription.textContent = "Connect directly with serious buyers and manage your properties with ease.";
    submitButton.textContent = "Register as Property Seller →";

  } else {
    // BUYER
    buyerFields.classList.remove("hidden");
    agentFields.classList.add("hidden");
    sellerFields.classList.add("hidden");
    if (licenseNumberInput) licenseNumberInput.required = false;

    brandEyebrow.textContent = "Buyer Portal";
    brandTitle.innerHTML = "Find the place that feels like <em>you.</em>";
    brandDescription.textContent = "Explore verified apartments, connect with trusted sellers and agents, and manage your next move.";
    formTitle.textContent = "Create Buyer Account";
    formDescription.textContent = "Search homes that match your lifestyle, budget, and plans.";
    submitButton.textContent = "Create Buyer Account →";
  }
}

roleSelect.addEventListener("change", updateRoleUI);
updateRoleUI();

function dashboardForRole(role) {
  const routes = {
    BUYER: "buyer_page.html",
    SELLER: "seller_page.html",
    AGENT: "agent_page.html",
    ADMIN: "admin_page.html",
    VERIFICATION_OFFICER: "verificationOfficer_page.html",
    BOOKING_MANAGER: "bookingManager_page.html"
  };
  return routes[role] || "index.html";
}

signupForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    signupMessage.className = "message error";
    signupMessage.textContent = "Passwords do not match. Please re-enter.";
    return;
  }

  const role = roleSelect.value.toUpperCase();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const phone = document.getElementById("phone").value.trim();
  const passwordVal = document.getElementById("password").value.trim();
  const licenseNumber = role === "AGENT" ? (licenseNumberInput?.value.trim() || "") : null;

  if (role === "AGENT" && !licenseNumber) {
    signupMessage.className = "message error";
    signupMessage.textContent = "Real estate license number is required for agents.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Creating account...";
  signupMessage.textContent = "";

  const requestBody = {
    firstName,
    lastName,
    email,
    password: passwordVal,
    phone,
    licenseNumber,
    role
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    let errorMsg = "Could not create account.";
    let data = {};
    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
        errorMsg = data.message || data.error || errorMsg;
      } catch (_jsonErr) {
        if (text && text.trim().length > 0) {
          errorMsg = text.trim();
        }
      }
    } catch (_readErr) {}

    if (!response.ok) {
      throw new Error(errorMsg);
    }

    // Save token and profile details
    if (data.token) localStorage.setItem("jwtToken", data.token);
    localStorage.setItem("userRole", data.role || role);
    localStorage.setItem("userEmail", data.email || email);
    localStorage.setItem("userFirstName", data.firstName || firstName);
    localStorage.setItem("userLastName", data.lastName || lastName);
    localStorage.setItem("userPhone", data.phone || phone);
    if (data.licenseNumber || licenseNumber) {
      localStorage.setItem("licenseNumber", data.licenseNumber || licenseNumber);
    }

    signupMessage.className = "message success";
    signupMessage.textContent = "Account created successfully! Taking you to your dashboard...";

    const targetUrl = dashboardForRole(data.role || role);
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 700);

  } catch (error) {
    signupMessage.className = "message error";
    signupMessage.textContent = error.message || "Could not connect to the server.";
    submitButton.disabled = false;
    updateRoleUI();
  }
});
