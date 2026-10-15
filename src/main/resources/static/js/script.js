// Change this if your Spring Boot backend runs on another URL or port.
const API_BASE_URL = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";

let authMode = "signin";

function showAuth(mode) {
  authMode = mode;
  updateAuthModal();
  document.getElementById("authModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeAuth() {
  document.getElementById("authModal").classList.add("hidden");
  document.body.style.overflow = "auto";
  document.getElementById("authMessage").textContent = "";
}

function toggleAuthMode() {
  authMode = authMode === "signin" ? "signup" : "signin";
  updateAuthModal();
}

function updateAuthModal() {
  const isSignup = authMode === "signup";

  document.getElementById("authEyebrow").textContent = isSignup
    ? "Welcome to the neighborhood"
    : "Good to see you again";

  document.getElementById("authTitle").textContent = isSignup
    ? "Create your account"
    : "Sign in to Nook & Key";

  document.getElementById("authDescription").textContent = isSignup
    ? "Choose your role and let’s make the next move feel easy."
    : "Access your saved homes and apartment activity.";

  document.getElementById("nameFields").classList.toggle("hidden", !isSignup);
  document.getElementById("roleField").classList.toggle("hidden", !isSignup);
  document.getElementById("authSubmit").textContent = isSignup
    ? "Create my account →"
    : "Sign in →";
  document.getElementById("switchText").textContent = isSignup
    ? "Already have an account?"
    : "New to Nook & Key?";
  document.getElementById("switchButton").textContent = isSignup
    ? "Sign in"
    : "Create an account";

  document.getElementById("firstName").required = isSignup;
  document.getElementById("lastName").required = isSignup;
}

async function submitAuth(event) {
  event.preventDefault();

  const message = document.getElementById("authMessage");
  const submitButton = document.getElementById("authSubmit");
  const isSignup = authMode === "signup";

  const requestBody = isSignup
    ? {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value
      }
    : {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      };

  // These paths match the Spring Boot endpoints described in your backend notes.
  const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/signin";

  submitButton.disabled = true;
  submitButton.textContent = "Please wait...";
  message.textContent = "";

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || "Authentication failed.");
    }

    // Your AuthResponse currently returns a JWT token.
    if (data.token) {
      localStorage.setItem("jwtToken", data.token);
    }

    message.className = "message success";
    message.textContent = isSignup
      ? "Account created successfully. You can now sign in."
      : "Signed in successfully.";

    document.getElementById("authForm").reset();

    setTimeout(() => {
      closeAuth();
      if (!isSignup) {
        window.location.href = "index.html";
      }
    }, 900);
  } catch (error) {
    message.className = "message error";
    message.textContent = error.message || "Could not connect to the server.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = isSignup
      ? "Create my account →"
      : "Sign in →";
  }
}

function searchProperties(event) {
  event.preventDefault();

  const location = document.getElementById("locationInput").value.trim();
  const propertyType = document.getElementById("propertyType").value;
  const budget = document.getElementById("budget").value;
  const message = document.getElementById("propertyMessage");

  message.textContent = `Search ready${location ? ` for ${location}` : ""}${propertyType ? ` · ${propertyType.toLowerCase()}` : ""}${budget ? ` · ${budget}` : ""}. Connect this form to your property API.`;
}

// Close the modal when the user clicks outside the card.
document.getElementById("authModal").addEventListener("click", (event) => {
  if (event.target.id === "authModal") {
    closeAuth();
  }
});

// Close the modal with Escape.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAuth();
  }
});

updateAuthModal();
