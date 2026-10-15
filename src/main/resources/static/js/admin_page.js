const API_BASE_URL = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";
const ADMIN_STATS_ENDPOINT = "/api/admin/stats";
const ADMIN_USERS_ENDPOINT = "/api/admin/users";
const AMENITIES_ENDPOINT = "/api/amenities";
const ADMIN_AMENITIES_ENDPOINT = "/api/admin/amenities";
const USE_DEMO_DATA = false;

// Enforce admin authentication immediately
(function checkAdminAuth() {
  const token = localStorage.getItem("jwtToken");
  const role = localStorage.getItem("userRole");
  if (!token || role !== "ADMIN") {
    alert("Administrator privileges required. Please sign in as an Administrator.");
    window.location.href = "signIn_page.html";
  }
})();

function authHeaders(isJson = false) {
  const token = localStorage.getItem("jwtToken") || "";
  const headers = { Authorization: `Bearer ${token}` };
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
}

function handleAuthError(response) {
  if (response.status === 401 || response.status === 403) {
    console.warn("Session expired or unauthorized for admin endpoint:", response.status);
    return true;
  }
  return false;
}

let activities = [
  { id: 1, type: "LISTING", icon: "⌂", title: "New apartment listing submitted", detail: "The Fern House · Colombo 07", owner: "Amaya Perera", role: "Seller", status: "Pending review", statusClass: "pending", time: "12 min ago" },
  { id: 2, type: "USER", icon: "♙", title: "New agent account created", detail: "License verification in progress", owner: "Kasun Maduranga", role: "Agent", status: "Active", statusClass: "", time: "28 min ago" },
  { id: 3, type: "BOOKING", icon: "□", title: "Viewing booking completed", detail: "Aurelia Residences · Rajagiriya", owner: "Nimal Perera", role: "Buyer", status: "Completed", statusClass: "", time: "1 hr ago" },
  { id: 4, type: "VERIFICATION", icon: "✓", title: "Listing verification flagged", detail: "Canopy Court · Ownership certificate", owner: "Rashmi Silva", role: "Verification officer", status: "Flagged", statusClass: "review", time: "2 hrs ago" },
  { id: 5, type: "LISTING", icon: "⌂", title: "Listing published successfully", detail: "The Grove at Ward Place", owner: "Urban Nest Ltd.", role: "Seller", status: "Published", statusClass: "", time: "3 hrs ago" }
];

function formatRelativeTime(dateStr) {
  if (!dateStr) return "Recent";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "Upcoming";
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 5) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toISOString().split("T")[0];
}

async function loadPlatformActivities() {
  if (USE_DEMO_DATA) return;
  try {
    const [bookingsRes, queueRes, listingsRes, usersRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/bookings/manage`, { headers: authHeaders() }),
      fetch(`${API_BASE_URL}/api/verification/queue`, { headers: authHeaders() }),
      fetch(`${API_BASE_URL}/api/listings`, { headers: authHeaders() }),
      fetch(`${API_BASE_URL}${ADMIN_USERS_ENDPOINT}`, { headers: authHeaders() })
    ]);

    const liveItems = [];

    // 1. Live Bookings
    if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
      const bookings = await bookingsRes.value.json();
      bookings.slice(-6).reverse().forEach(b => {
        const isCompleted = b.status === "ACCEPTED" || b.paymentStatus === "PAID";
        const isPending = b.status === "PENDING";
        liveItems.push({
          id: `B-${b.id}`,
          type: "BOOKING",
          icon: "□",
          title: isCompleted ? "Viewing booking confirmed" : `Viewing booking ${b.status?.toLowerCase() || "scheduled"}`,
          detail: `${b.listingTitle || "Apartment"} · ${b.listingCity || "Colombo"}`,
          owner: b.buyerName || "Buyer",
          role: "Buyer",
          status: isCompleted ? "Completed" : (isPending ? "Pending review" : (b.status || "Pending")),
          statusClass: isCompleted ? "" : (isPending ? "pending" : "review"),
          time: b.paymentDate || b.requestDate ? formatRelativeTime(b.paymentDate || b.requestDate) : "Recent"
        });
      });
    }

    // 2. Verification Queue
    if (queueRes.status === "fulfilled" && queueRes.value.ok) {
      const queue = await queueRes.value.json();
      queue.slice(-6).reverse().forEach(q => {
        liveItems.push({
          id: `VQ-${q.id}`,
          type: "VERIFICATION",
          icon: "✓",
          title: q.status === "DOCUMENTS_REQUESTED" ? "Listing verification flagged" : "New listing awaiting review",
          detail: `${q.title || "Apartment"} · ${q.city || "Colombo"}`,
          owner: q.ownerName || "Seller",
          role: (q.ownerType === "AGENT" ? "Agent" : "Seller"),
          status: q.status === "DOCUMENTS_REQUESTED" ? "Flagged" : "Pending review",
          statusClass: q.status === "DOCUMENTS_REQUESTED" ? "review" : "pending",
          time: q.datePosted ? formatRelativeTime(q.datePosted) : "Recent"
        });
      });
    }

    // 3. Published Listings
    if (listingsRes.status === "fulfilled" && listingsRes.value.ok) {
      const listings = await listingsRes.value.json();
      listings.slice(-6).reverse().forEach(l => {
        liveItems.push({
          id: `L-${l.id}`,
          listingId: l.id,
          type: "LISTING",
          icon: "⌂",
          title: l.status === "PUBLISHED" ? "Listing published successfully" : `Listing ${l.status?.toLowerCase()}`,
          detail: `${l.title || "Apartment"} · ${l.city || "Colombo"}`,
          owner: l.ownerName || "Owner",
          role: (l.ownerType === "AGENT" ? "Agent" : "Seller"),
          status: l.status === "PUBLISHED" ? "Published" : (l.status || "Active"),
          statusClass: "",
          time: l.datePosted ? formatRelativeTime(l.datePosted) : "Recent"
        });
      });
    }

    // 4. User registrations
    if (usersRes.status === "fulfilled" && usersRes.value.ok) {
      const users = await usersRes.value.json();
      users.slice(-6).reverse().forEach(u => {
        const roleLabel = u.role ? (u.role.charAt(0) + u.role.slice(1).toLowerCase().replace(/_/g, " ")) : "User";
        liveItems.push({
          id: `U-${u.id}`,
          type: "USER",
          icon: "♙",
          title: `New ${roleLabel.toLowerCase()} account created`,
          detail: u.email || `${roleLabel} profile`,
          owner: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          role: roleLabel,
          status: u.status === "ACTIVE" ? "Active" : (u.status || "Active"),
          statusClass: u.status === "ACTIVE" ? "" : "pending",
          time: u.registrationDate ? formatRelativeTime(u.registrationDate) : "Recent"
        });
      });
    }

    if (liveItems.length > 0) {
      activities = liveItems.slice(0, 16);
    }
  } catch (err) {
    console.warn("Could not load dynamic platform activities:", err);
  } finally {
    renderActivity();
  }
}

function renderActivity() {
  const searchInput = document.getElementById("activitySearch");
  const query = (searchInput?.value || "").toLowerCase().trim();
  const filterEl = document.getElementById("activityFilter");
  const chosen = filterEl ? filterEl.value : "ALL";
  const rows = activities.filter((item) =>
    (!query || `${item.title} ${item.detail} ${item.owner} ${item.role}`.toLowerCase().includes(query)) &&
    (chosen === "ALL" || item.type === chosen)
  );

  const tableBody = document.getElementById("activityTableBody");
  const emptyState = document.getElementById("emptyState");
  if (!tableBody) return;

  tableBody.innerHTML = rows.map((item) => `
    <tr>
      <td>
        <div class="activity-cell">
          <span class="activity-icon ${item.type.toLowerCase()}">${escapeHtml(item.icon)}</span>
          <div>${escapeHtml(item.title)}<span class="subtext">${escapeHtml(item.detail)}</span></div>
        </div>
      </td>
      <td>${escapeHtml(item.owner)}</td>
      <td><span class="role-label">${escapeHtml(item.role)}</span></td>
      <td><span class="activity-status ${item.statusClass}">${escapeHtml(item.status)}</span></td>
      <td>${escapeHtml(item.time)}</td>
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          ${item.type === "LISTING" && (item.status === "Published" || item.status === "PUBLISHED") ? `
            <button class="btn-override-listing" data-id="${item.listingId || item.id.replace('L-','')}" data-title="${escapeHtml(item.detail)}" style="padding:4px 8px; font-size:10px; background:#fff1f2; color:#be123c; border:1px solid #fecdd3; border-radius:5px; font-weight:bold; cursor:pointer;" title="Revoke verification and unpublish">⚠️ Unpublish</button>
          ` : ""}
          <button class="row-action" data-id="${escapeHtml(item.id)}" title="View details">→</button>
        </div>
      </td>
    </tr>
  `).join("");

  if (emptyState) emptyState.classList.toggle("hidden", rows.length > 0);
  tableBody.querySelectorAll(".row-action").forEach((button) =>
    button.addEventListener("click", () => showToast("Activity Record", `Selected activity record: ${button.dataset.id}`, "success"))
  );
  tableBody.querySelectorAll(".btn-override-listing").forEach((button) => {
    button.addEventListener("click", () => {
      openAdminOverrideModal(button.dataset.id, button.dataset.title);
    });
  });
}

function openUserModal() {
  document.getElementById("userModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  loadUsers();
}

function closeUserModal() {
  document.getElementById("userModal").classList.add("hidden");
  document.body.style.overflow = "auto";
  const msg = document.getElementById("staffMessage");
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }
}

// Amenities Modal Controls
function openAmenityModal() {
  document.getElementById("amenityModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  loadAmenities();
}

function closeAmenityModal() {
  document.getElementById("amenityModal").classList.add("hidden");
  document.body.style.overflow = "auto";
  const msg = document.getElementById("amenityMessage");
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }
}

async function loadAdminSummary() {
  if (USE_DEMO_DATA) {
    renderActivity();
    return;
  }

  const response = await fetch(`${API_BASE_URL}${ADMIN_STATS_ENDPOINT}`, {
    headers: authHeaders()
  });
  if (handleAuthError(response)) return;
  if (!response.ok) throw new Error(`Unable to load admin stats (${response.status}).`);

  const data = await response.json();
  document.getElementById("totalUsers").textContent = data.totalUsers ?? 0;
  document.getElementById("activeListings").textContent = data.listingsByStatus?.PUBLISHED ?? data.totalListings ?? 0;
  document.getElementById("pendingVerification").textContent = String(data.listingsByStatus?.PENDING ?? 0).padStart(2, "0");
  const bookingsEl = document.querySelector(".stat-card:nth-child(4) strong");
  if (bookingsEl) bookingsEl.textContent = data.totalBookings ?? 0;

  const roles = data.usersByRole || {};
  document.querySelector(".donut strong").textContent = data.totalUsers ?? 0;
  document.querySelector(".donut small").textContent = "total users";

  const roleValues = document.querySelectorAll(".role-legend b");
  ["BUYER", "AGENT", "SELLER"].forEach((role, index) => {
    if (roleValues[index]) roleValues[index].textContent = roles[role] ?? 0;
  });

  const staffCount = (roles["VERIFICATION_OFFICER"] || 0) + (roles["BOOKING_MANAGER"] || 0) + (roles["ADMIN"] || 0);
  if (roleValues[3]) roleValues[3].textContent = staffCount;

  document.getElementById("userNavCount").textContent = data.totalUsers ?? 0;
  renderActivity();
  loadPlatformActivities();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let cachedUsers = [];

function renderUsersList(overrideQuery) {
  const tbody = document.getElementById("usersTableBody");
  const countLabel = document.getElementById("userCountLabel");
  const searchInput = document.getElementById("userSearchInput");
  const query = (overrideQuery !== undefined ? overrideQuery : (searchInput ? searchInput.value : "")).toLowerCase().trim();

  let filtered = cachedUsers.filter((user) => {
    if (!query) return true;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const phone = (user.phone || "").toLowerCase();
    const role = (user.role || "").toLowerCase();
    const status = (user.status || "").toLowerCase();
    const id = String(user.id || "");
    return fullName.includes(query) || email.includes(query) || phone.includes(query) || role.includes(query) || status.includes(query) || id.includes(query);
  });

  if (countLabel) {
    if (query) {
      countLabel.textContent = `${filtered.length} user(s) matching "${query}" (${cachedUsers.length} total)`;
    } else {
      countLabel.textContent = `${cachedUsers.length} total user(s) found`;
    }
  }

  if (filtered.length === 0) {
    if (query) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:32px 20px; color:var(--muted);">
            <p style="font-size:26px; margin:0 0 8px;">🔍</p>
            <strong style="display:block; color:var(--ink); font-size:14px; margin-bottom:4px;">No users found matching "${escapeHtml(query)}"</strong>
            <p style="margin:0 0 12px; font-size:11px;">Check your search term or select a different role filter.</p>
            <button type="button" class="secondary-button" onclick="clearUserSearch()" style="padding:6px 14px; font-size:11px; cursor:pointer;">Reset Search</button>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--muted);">No users found.</td></tr>`;
    }
    return;
  }

  const currentEmail = (localStorage.getItem("userEmail") || "").toLowerCase().trim();

  tbody.innerHTML = filtered.map((user) => {
    const isSuspended = user.status === "SUSPENDED";
    const initials = `${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(0)}`.toUpperCase() || "U";
    const isSelf = (user.email || "").toLowerCase().trim() === currentEmail;
    const isAdmin = user.role === "ADMIN";

    let actionHtml;
    if (isAdmin) {
      actionHtml = `<span style="font-size:10px; font-weight:bold; color:var(--coral);">${isSelf ? '(You)' : 'Protected Admin'}</span>`;
    } else {
      actionHtml = `<button class="row-action toggle-status-btn" data-id="${user.id}" data-current="${user.status}" style="font-size:11px; padding:4px 8px; border:1px solid var(--line); border-radius:4px; cursor:pointer;">
                      ${isSuspended ? 'Reactivate' : 'Suspend'}
                    </button>`;
    }

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="avatar" style="width:28px; height:28px; font-size:9px;">${initials}</span>
            <div>
              <strong>${escapeHtml(user.firstName || "")} ${escapeHtml(user.lastName || "")}</strong>
              <span class="subtext">${escapeHtml(user.email || "")}</span>
            </div>
          </div>
        </td>
        <td><span class="role-label" style="font-weight:bold; color:var(--ink);">${escapeHtml(user.role || "")}</span></td>
        <td>${escapeHtml(user.phone || "—")}</td>
        <td>${escapeHtml(user.registrationDate || "—")}</td>
        <td>
          <span class="activity-status ${isSuspended ? 'pending' : ''}">
            ${escapeHtml(user.status || "")}
          </span>
        </td>
        <td>${actionHtml}</td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".toggle-status-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleUserStatus(btn.dataset.id, btn.dataset.current));
  });
}

function triggerUserSearch() {
  const input = document.getElementById("userSearchInput");
  const container = document.getElementById("userSearchContainer");
  const errorEl = document.getElementById("userSearchValidationError");
  const errorText = document.getElementById("userSearchValidationText");
  const clearBtn = document.getElementById("clearUserSearchBtn");
  const query = (input?.value || "").trim();

  if (!query) {
    if (container) {
      container.style.borderColor = "#dc2626";
      container.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.15)";
    }
    if (errorEl) {
      errorEl.style.display = "flex";
      if (errorText) {
        errorText.textContent = "Please enter a search term (e.g. name, email, phone, or role) before searching.";
      }
    }
    input?.focus();
    return;
  }

  // Clear validation error styling
  if (container) {
    container.style.borderColor = "";
    container.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";
  if (clearBtn) clearBtn.style.display = "inline-block";

  renderUsersList();
}

function clearUserSearch() {
  const input = document.getElementById("userSearchInput");
  const container = document.getElementById("userSearchContainer");
  const errorEl = document.getElementById("userSearchValidationError");
  const clearBtn = document.getElementById("clearUserSearchBtn");

  if (input) input.value = "";
  if (clearBtn) clearBtn.style.display = "none";
  if (container) {
    container.style.borderColor = "";
    container.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";

  renderUsersList();
  input?.focus();
}

window.clearUserSearch = clearUserSearch;

function triggerActivitySearch() {
  const input = document.getElementById("activitySearch");
  const container = document.getElementById("activitySearchContainer");
  const errorEl = document.getElementById("activitySearchValidationError");
  const errorText = document.getElementById("activitySearchValidationText");
  const clearBtn = document.getElementById("clearActivitySearchBtn");
  const query = (input?.value || "").trim();

  if (!query) {
    if (container) {
      container.style.borderColor = "#dc2626";
      container.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.15)";
    }
    if (errorEl) {
      errorEl.style.display = "flex";
      if (errorText) {
        errorText.textContent = "Please enter a search term before searching.";
      }
    }
    input?.focus();
    return;
  }

  // Clear validation error styling
  if (container) {
    container.style.borderColor = "";
    container.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";
  if (clearBtn) clearBtn.style.display = "inline-block";

  renderActivity();
}

function clearActivitySearch() {
  const input = document.getElementById("activitySearch");
  const container = document.getElementById("activitySearchContainer");
  const errorEl = document.getElementById("activitySearchValidationError");
  const clearBtn = document.getElementById("clearActivitySearchBtn");

  if (input) input.value = "";
  if (clearBtn) clearBtn.style.display = "none";
  if (container) {
    container.style.borderColor = "";
    container.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";

  renderActivity();
  input?.focus();
}

window.clearActivitySearch = clearActivitySearch;

async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  const countLabel = document.getElementById("userCountLabel");
  const roleFilter = document.getElementById("userRoleFilter")?.value || "ALL";

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--muted);">Loading users...</td></tr>`;

  try {
    let url = `${API_BASE_URL}${ADMIN_USERS_ENDPOINT}`;
    if (roleFilter !== "ALL") {
      url += `?role=${encodeURIComponent(roleFilter)}`;
    }

    const response = await fetch(url, { headers: authHeaders() });
    if (handleAuthError(response)) return;
    if (!response.ok) throw new Error(`Failed to load users: ${response.status}`);

    cachedUsers = await response.json();
    renderUsersList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--coral);">Error: ${err.message}</td></tr>`;
    if (countLabel) countLabel.textContent = "Error loading users";
  }
}

async function toggleUserStatus(userId, currentStatus) {
  const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  if (!confirm(`Are you sure you want to change user #${userId} status to ${newStatus}?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${ADMIN_USERS_ENDPOINT}/${userId}/status`, {
      method: "PATCH",
      headers: authHeaders(true),
      body: JSON.stringify({ status: newStatus })
    });

    if (handleAuthError(response)) return;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `Could not update user status (${response.status})`);

    loadUsers();
    loadAdminSummary();
  } catch (err) {
    alert("Action failed: " + err.message);
  }
}

async function handleCreateStaff(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = document.getElementById("submitStaffButton");
  const msg = document.getElementById("staffMessage");

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";
  msg.textContent = "";
  msg.className = "message";

  const payload = {
    role: document.getElementById("staffRole").value,
    firstName: document.getElementById("staffFirstName").value.trim(),
    lastName: document.getElementById("staffLastName").value.trim(),
    email: document.getElementById("staffEmail").value.trim(),
    phone: document.getElementById("staffPhone").value.trim(),
    password: document.getElementById("staffPassword").value
  };

  try {
    const response = await fetch(`${API_BASE_URL}${ADMIN_USERS_ENDPOINT}/staff`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload)
    });

    if (handleAuthError(response)) return;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `Failed to create staff account (${response.status})`);
    }

    msg.className = "message success";
    msg.textContent = `Staff account created successfully for ${data.firstName} ${data.lastName} (${data.role})!`;

    form.reset();
    loadUsers();
    loadAdminSummary();
  } catch (err) {
    msg.className = "message";
    msg.style.color = "var(--coral)";
    msg.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Staff Account →";
  }
}

// Amenities Management Logic
async function loadAmenities() {
  const grid = document.getElementById("amenitiesGrid");
  const totalCount = document.getElementById("amenityTotalCount");
  const navCount = document.getElementById("amenityNavCount");

  try {
    const response = await fetch(`${API_BASE_URL}${AMENITIES_ENDPOINT}`);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const amenities = await response.json();

    if (totalCount) totalCount.textContent = amenities.length;
    if (navCount) navCount.textContent = amenities.length;

    if (!grid) return;

    if (amenities.length === 0) {
      grid.innerHTML = `<p style="color:var(--muted); font-size:12px; margin:10px 0;">No amenities added yet. Use the form above to add one.</p>`;
      return;
    }

    grid.innerHTML = amenities.map((a) => `
      <div style="display:inline-flex; align-items:center; gap:8px; padding:6px 12px; background:white; border:1px solid var(--line); border-radius:20px; font-size:12px; font-weight:500; color:var(--ink); box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <span>✦ ${escapeHtml(a.name)}</span>
        <div style="display:inline-flex; align-items:center; gap:4px; margin-left:4px;">
          <button class="edit-amenity-btn" data-id="${a.id}" data-name="${escapeHtml(a.name)}" title="Edit amenity name" style="border:none; background:transparent; color:#0284c7; cursor:pointer; font-size:12px; padding:0 2px; line-height:1;">✏️</button>
          <button class="delete-amenity-btn" data-id="${a.id}" data-name="${escapeHtml(a.name)}" title="Delete amenity" style="border:none; background:transparent; color:#dc2626; cursor:pointer; font-size:13px; padding:0 2px; line-height:1; font-weight:bold;">✕</button>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll(".edit-amenity-btn").forEach((btn) => {
      btn.addEventListener("click", () => editAmenity(btn.dataset.id, btn.dataset.name));
    });

    grid.querySelectorAll(".delete-amenity-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteAmenity(btn.dataset.id, btn.dataset.name));
    });

  } catch (err) {
    if (grid) grid.innerHTML = `<p style="color:var(--coral); font-size:12px;">Failed to load amenities: ${err.message}</p>`;
  }
}

async function handleAddAmenity(event) {
  event.preventDefault();
  const input = document.getElementById("newAmenityName");
  const btn = document.getElementById("addAmenitySubmitBtn");
  const msg = document.getElementById("amenityMessage");
  const name = input.value.trim();

  if (!name) return;

  btn.disabled = true;
  btn.textContent = "Adding...";
  msg.textContent = "";
  msg.className = "message";

  try {
    const response = await fetch(`${API_BASE_URL}${ADMIN_AMENITIES_ENDPOINT}`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ name })
    });

    if (handleAuthError(response)) return;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `Could not create amenity (${response.status})`);
    }

    msg.className = "message success";
    msg.textContent = `✓ Amenity "${data.name}" added successfully!`;
    input.value = "";
    loadAmenities();
  } catch (err) {
    msg.className = "message";
    msg.style.color = "var(--coral)";
    msg.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Add Amenity →";
  }
}

function editAmenity(id, currentName) {
  const modal = document.getElementById("editAmenityModal");
  const idInput = document.getElementById("editAmenityId");
  const nameInput = document.getElementById("editAmenityNameInput");
  const msg = document.getElementById("editAmenityMessage");
  const saveBtn = document.getElementById("saveEditAmenityBtn");

  if (!modal) return;
  if (idInput) idInput.value = id;
  if (nameInput) nameInput.value = currentName || "";
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }

  modal.classList.remove("hidden");
  setTimeout(() => {
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  }, 50);
}

function closeEditAmenityModal() {
  const modal = document.getElementById("editAmenityModal");
  if (modal) modal.classList.add("hidden");
}

async function handleEditAmenitySubmit(e) {
  e.preventDefault();
  const id = document.getElementById("editAmenityId")?.value;
  const nameInput = document.getElementById("editAmenityNameInput");
  const saveBtn = document.getElementById("saveEditAmenityBtn");
  const msg = document.getElementById("editAmenityMessage");
  const newName = nameInput ? nameInput.value.trim() : "";

  if (!id || !newName) return;

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }

  try {
    const response = await fetch(`${API_BASE_URL}${ADMIN_AMENITIES_ENDPOINT}/${id}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({ name: newName })
    });

    if (handleAuthError(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `Could not update amenity (${response.status})`);
    }

    closeEditAmenityModal();
    const globalMsg = document.getElementById("amenityMessage");
    if (globalMsg) {
      globalMsg.className = "message success";
      globalMsg.textContent = `✓ Amenity renamed to "${newName}" successfully!`;
    }
    loadAmenities();
  } catch (err) {
    if (msg) {
      msg.className = "message";
      msg.style.color = "var(--coral)";
      msg.textContent = err.message;
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }
  }
}

function deleteAmenity(id, name) {
  const modal = document.getElementById("deleteAmenityModal");
  const idInput = document.getElementById("deleteAmenityId");
  const nameTarget = document.getElementById("deleteAmenityNameTarget");
  const msg = document.getElementById("deleteAmenityMessage");
  const confirmBtn = document.getElementById("confirmDeleteAmenityBtn");

  if (!modal) return;
  if (idInput) idInput.value = id;
  if (nameTarget) nameTarget.textContent = name;
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Yes, Delete Amenity";
  }

  modal.classList.remove("hidden");
}

function closeDeleteAmenityModal() {
  const modal = document.getElementById("deleteAmenityModal");
  if (modal) modal.classList.add("hidden");
}

async function handleConfirmDeleteAmenity() {
  const id = document.getElementById("deleteAmenityId")?.value;
  const targetName = document.getElementById("deleteAmenityNameTarget")?.textContent || "Amenity";
  const confirmBtn = document.getElementById("confirmDeleteAmenityBtn");
  const msg = document.getElementById("deleteAmenityMessage");

  if (!id) return;

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Deleting...";
  }
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }

  try {
    const response = await fetch(`${API_BASE_URL}${ADMIN_AMENITIES_ENDPOINT}/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    if (handleAuthError(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `Could not delete amenity (${response.status})`);
    }

    closeDeleteAmenityModal();
    const globalMsg = document.getElementById("amenityMessage");
    if (globalMsg) {
      globalMsg.className = "message success";
      globalMsg.textContent = `✓ Amenity "${targetName}" removed successfully!`;
    }
    loadAmenities();
  } catch (err) {
    if (msg) {
      msg.className = "message";
      msg.style.color = "var(--coral)";
      msg.textContent = err.message;
    }
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Yes, Delete Amenity";
    }
  }
}

// Activity Toolbar Event Listeners
const activitySearchInput = document.getElementById("activitySearch");
const activityFilterSelect = document.getElementById("activityFilter");
const activitySearchBtn = document.getElementById("activitySearchBtn");
const clearActivitySearchBtn = document.getElementById("clearActivitySearchBtn");
const refreshActivityBtn = document.getElementById("refreshActivity");

if (activitySearchBtn) {
  activitySearchBtn.addEventListener("click", triggerActivitySearch);
}

if (clearActivitySearchBtn) {
  clearActivitySearchBtn.addEventListener("click", clearActivitySearch);
}

if (activitySearchInput) {
  activitySearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerActivitySearch();
    }
  });

  activitySearchInput.addEventListener("input", () => {
    const val = (activitySearchInput.value || "").trim();
    const container = document.getElementById("activitySearchContainer");
    const errorEl = document.getElementById("activitySearchValidationError");
    const clearBtn = document.getElementById("clearActivitySearchBtn");

    if (val) {
      if (container) {
        container.style.borderColor = "";
        container.style.boxShadow = "";
      }
      if (errorEl) errorEl.style.display = "none";
      if (clearBtn) clearBtn.style.display = "inline-block";
    } else {
      if (clearBtn) clearBtn.style.display = "none";
    }
    renderActivity();
  });
}

if (activityFilterSelect) {
  activityFilterSelect.addEventListener("change", renderActivity);
}

if (refreshActivityBtn) {
  refreshActivityBtn.addEventListener("click", async () => {
    refreshActivityBtn.disabled = true;
    const origHtml = refreshActivityBtn.innerHTML;
    refreshActivityBtn.innerHTML = `⟳ Refreshing...`;
    try {
      await Promise.all([loadAdminSummary(), loadPlatformActivities()]);
      showToast("Activity Refreshed ↻", "Recent platform oversight and live database metrics updated.", "success");
    } catch (e) {
      showToast("Refresh Warning", "Updated local activities, but some stats could not be reached.", "error");
    } finally {
      refreshActivityBtn.disabled = false;
      refreshActivityBtn.innerHTML = origHtml;
    }
  });
}

// User Modal Listeners
document.getElementById("manageUsers")?.addEventListener("click", openUserModal);
document.getElementById("closeUserModal")?.addEventListener("click", closeUserModal);
document.getElementById("closeUserModalButton")?.addEventListener("click", closeUserModal);

// Amenities Listeners
document.getElementById("manageAmenities")?.addEventListener("click", openAmenityModal);
document.getElementById("navAmenities")?.addEventListener("click", (e) => {
  e.preventDefault();
  openAmenityModal();
});
document.getElementById("closeAmenityModal")?.addEventListener("click", closeAmenityModal);
document.getElementById("closeAmenityModalBtn")?.addEventListener("click", closeAmenityModal);
document.getElementById("refreshAmenitiesBtn")?.addEventListener("click", loadAmenities);
document.getElementById("addAmenityForm")?.addEventListener("submit", handleAddAmenity);

document.getElementById("amenityModal")?.addEventListener("click", (e) => {
  if (e.target.id === "amenityModal") closeAmenityModal();
});

// Edit & Delete Amenity Modal Listeners
document.getElementById("closeEditAmenityModal")?.addEventListener("click", closeEditAmenityModal);
document.getElementById("cancelEditAmenityBtn")?.addEventListener("click", closeEditAmenityModal);
document.getElementById("editAmenityForm")?.addEventListener("submit", handleEditAmenitySubmit);
document.getElementById("editAmenityModal")?.addEventListener("click", (e) => {
  if (e.target.id === "editAmenityModal") closeEditAmenityModal();
});

document.getElementById("closeDeleteAmenityModal")?.addEventListener("click", closeDeleteAmenityModal);
document.getElementById("cancelDeleteAmenityBtn")?.addEventListener("click", closeDeleteAmenityModal);
document.getElementById("confirmDeleteAmenityBtn")?.addEventListener("click", handleConfirmDeleteAmenity);
document.getElementById("deleteAmenityModal")?.addEventListener("click", (e) => {
  if (e.target.id === "deleteAmenityModal") closeDeleteAmenityModal();
});

const staffForm = document.getElementById("createStaffForm");
if (staffForm) staffForm.addEventListener("submit", handleCreateStaff);

const userRoleFilter = document.getElementById("userRoleFilter");
if (userRoleFilter) userRoleFilter.addEventListener("change", loadUsers);

const refreshUsersList = document.getElementById("refreshUsersList");
if (refreshUsersList) refreshUsersList.addEventListener("click", loadUsers);

const userSearchBtn = document.getElementById("userSearchBtn");
const userSearchInput = document.getElementById("userSearchInput");
const clearUserSearchBtn = document.getElementById("clearUserSearchBtn");

if (userSearchBtn) userSearchBtn.addEventListener("click", triggerUserSearch);

if (userSearchInput) {
  userSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerUserSearch();
    }
  });

  userSearchInput.addEventListener("input", () => {
    const val = (userSearchInput.value || "").trim();
    const container = document.getElementById("userSearchContainer");
    const errorEl = document.getElementById("userSearchValidationError");
    const clearBtn = document.getElementById("clearUserSearchBtn");

    if (val) {
      if (container) {
        container.style.borderColor = "";
        container.style.boxShadow = "";
      }
      if (errorEl) errorEl.style.display = "none";
      if (clearBtn) clearBtn.style.display = "inline-block";
    } else {
      if (clearBtn) clearBtn.style.display = "none";
    }
    renderUsersList();
  });
}

if (clearUserSearchBtn) clearUserSearchBtn.addEventListener("click", clearUserSearch);

document.getElementById("navUsers")?.addEventListener("click", (e) => {
  e.preventDefault();
  openUserModal();
});
document.getElementById("quickManageUsersLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  openUserModal();
});

document.getElementById("userModal")?.addEventListener("click", (event) => {
  if (event.target.id === "userModal") closeUserModal();
});

// ============================================================================
// UC-05: GENERATE REPORTS SYSTEM
// ============================================================================
let reportRawData = {
  transactions: [],
  bookings: [],
  listings: [],
  queueListings: [],
  users: []
};
let currentAggregatedRecords = [];
let isReportDataLoaded = false;

function openReportModal() {
  const modal = document.getElementById("reportModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Pre-load data and aggregate
  loadReportDataAndAggregate();
}

function closeReportModal() {
  const modal = document.getElementById("reportModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
  document.body.style.overflow = "auto";
}

async function loadReportDataAndAggregate(forceReload = false) {
  const applyBtn = document.getElementById("applyReportFiltersBtn");
  if (applyBtn) {
    applyBtn.disabled = true;
    applyBtn.innerHTML = `<span>⏳ Aggregating...</span>`;
  }

  try {
    if (!isReportDataLoaded || forceReload) {
      const [bookingsRes, queueRes, listingsRes, usersRes, txnsRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/bookings/manage`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/verification/queue`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/listings`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}${ADMIN_USERS_ENDPOINT}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/transactions`, { headers: authHeaders() })
      ]);

      if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
        reportRawData.bookings = await bookingsRes.value.json();
      }
      if (queueRes.status === "fulfilled" && queueRes.value.ok) {
        reportRawData.queueListings = await queueRes.value.json();
      }
      if (listingsRes.status === "fulfilled" && listingsRes.value.ok) {
        reportRawData.listings = await listingsRes.value.json();
      }
      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        reportRawData.users = await usersRes.value.json();
      }
      if (txnsRes.status === "fulfilled" && txnsRes.value.ok) {
        reportRawData.transactions = await txnsRes.value.json();
      }
      isReportDataLoaded = true;
    }

    aggregateReportData();
    renderReportSummary();
  } catch (err) {
    console.error("Error loading report dataset:", err);
    aggregateReportData();
    renderReportSummary();
  } finally {
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.innerHTML = `<span>⚡ Aggregate Data</span>`;
    }
  }
}

function aggregateReportData() {
  const domainFilter = document.getElementById("reportDomainFilter")?.value || "ALL";
  const dateRangeFilter = document.getElementById("reportDateRangeFilter")?.value || "ALL_TIME";
  const statusFilter = document.getElementById("reportStatusFilter")?.value || "ALL";
  const customStart = document.getElementById("customStartDate")?.value;
  const customEnd = document.getElementById("customEndDate")?.value;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const normDomain = (domainFilter || "ALL").toUpperCase();
  const isAll = normDomain === "ALL";
  const isTxnOnly = normDomain === "TRANSACTIONS" || normDomain === "TRANSACTION";
  const isSubOnly = normDomain === "AGENT_SUBSCRIPTIONS" || normDomain === "SUBSCRIPTIONS";
  const isSlotOnly = normDomain === "PAY_PER_LISTING" || normDomain === "SLOTS";
  const isViewingOnly = normDomain === "VIEWING_DEPOSITS";
  const isPublishedOnly = normDomain === "PUBLISHED_LISTINGS";
  const isListingOnly = normDomain === "LISTING" || normDomain === "LISTINGS";
  const isUserOnly = normDomain.includes("USER");

  const matchTxn = isAll || isTxnOnly || isSubOnly || isSlotOnly || isViewingOnly;
  const matchListing = isAll || isListingOnly || isPublishedOnly;
  const matchUser = isAll || isUserOnly;

  const allRecords = [];

  // 1. Transaction / Monetization / Booking entries (UC-05 Step 2: Aggregate transaction data)
  if (matchTxn) {
    const seenTxnRefs = new Set();

    // Dedicated monetization & payment transactions (Agent Subscriptions, Listing Passes, Viewing Deposits)
    (reportRawData.transactions || []).forEach(t => {
      // Sub-domain filtering if user selected a specific transaction category
      if (isSubOnly && t.category !== "AGENT_SUBSCRIPTION") return;
      if (isSlotOnly && t.category !== "PAY_PER_LISTING") return;
      if (isViewingOnly && t.category !== "VIEWING_DEPOSIT") return;

      const isCompleted = t.paymentStatus === "PAID" || t.paymentStatus === "COMPLETED" || t.paymentStatus === "SUCCESS";
      const isPending = t.paymentStatus === "PENDING";
      const isCancelled = t.paymentStatus === "CANCELLED" || t.paymentStatus === "REFUNDED" || t.paymentStatus === "FAILED";
      const statusCategory = isCompleted ? "COMPLETED" : (isCancelled ? "CANCELLED" : "PENDING");
      const recDate = t.transactionDate ? String(t.transactionDate).split("T")[0] : todayStr;
      const ref = t.transactionReference || `TXN-${String(t.id).padStart(5, '0')}`;
      seenTxnRefs.add(ref);

      let itemDescription = t.itemDetails || t.transactionType || "Monetization Payment";
      let partyDescription = `${t.userName || "User"} (${t.userEmail || "N/A"})${t.userRole ? ' · ' + t.userRole : ''}`;

      allRecords.push({
        id: `TXN-${t.id}`,
        domain: "TRANSACTION",
        category: t.category || "TRANSACTION",
        ref: ref,
        date: recDate,
        item: itemDescription,
        party: partyDescription,
        value: Number(t.amount || 0),
        refundAmount: (t.paymentStatus === "REFUNDED") ? Number(t.amount || 0) : 0,
        statusCategory: statusCategory,
        rawStatus: `${t.paymentStatus || "PAID"} · ${t.paymentMethod || "CARD"}`
      });
    });

    // Fallback: Booking advance deposits if not already in payment_transactions table
    if (!isSubOnly && !isSlotOnly) {
      (reportRawData.bookings || []).forEach(b => {
        const ref = b.transactionReference || `TXN-${String(b.id).padStart(5, '0')}`;
        if (seenTxnRefs.has(ref)) return;
        seenTxnRefs.add(ref);

        const isCompleted = b.status === "ACCEPTED" || b.paymentStatus === "PAID";
        const isPending = b.status === "PENDING";
        const isCancelled = b.status === "CANCELLED" || b.status === "REJECTED";
        const statusCategory = isCompleted ? "COMPLETED" : (isCancelled ? "CANCELLED" : "PENDING");
        const recDate = b.paymentDate || b.requestDate || b.viewingDate || todayStr;

        allRecords.push({
          id: `BK-${b.id}`,
          domain: "TRANSACTION",
          category: "VIEWING_DEPOSIT",
          ref: ref,
          date: recDate,
          item: `Viewing Advance: ${b.listingTitle || "Apartment"} (${b.listingCity || "Colombo"}) · Method: ${b.paymentMethod || "CARD"}`,
          party: `${b.buyerName || "Buyer"} (${b.buyerEmail || ""})`,
          value: Number(b.advancePaymentAmount || 0),
          refundAmount: Number(b.refundAmount || 0),
          statusCategory: statusCategory,
          rawStatus: `${b.paymentStatus || "PAID"} · Booking: ${b.status || "PENDING"}`
        });
      });
    }
  }

  // 2. Listing entries (UC-05 Step 2: Aggregate listing data)
  if (matchListing) {
    const combinedListings = [
      ...(reportRawData.listings || []),
      ...(reportRawData.queueListings || [])
    ];
    const seenListingIds = new Set();
    combinedListings.forEach(l => {
      if (seenListingIds.has(l.id)) return;
      seenListingIds.add(l.id);

      // If user specifically requested PUBLISHED_LISTINGS, restrict to PUBLISHED only
      if (isPublishedOnly && l.status !== "PUBLISHED") {
        return;
      }

      const isCompleted = l.status === "PUBLISHED" || l.status === "SOLD";
      const isPending = l.status === "PENDING" || l.status === "DOCUMENTS_REQUESTED";
      const isCancelled = l.status === "REJECTED";
      const statusCategory = isCompleted ? "COMPLETED" : (isCancelled ? "CANCELLED" : "PENDING");
      const recDate = l.datePosted || todayStr;

      allRecords.push({
        id: `LST-${l.id}`,
        domain: isPublishedOnly ? "PUBLISHED_LISTING" : "LISTING",
        ref: `APT-${String(l.id).padStart(4, '0')}`,
        date: recDate,
        item: `${l.title || "Apartment"} · ${l.city || "Colombo"}${l.bedroomCount ? ` (${l.bedroomCount} Bed · ${l.bathroomCount || 0} Bath)` : ""}`,
        party: `${l.ownerName || "Owner"} (${l.ownerType || "SELLER"})`,
        value: Number(l.price || 0),
        refundAmount: 0,
        statusCategory: statusCategory,
        rawStatus: l.status || "PUBLISHED"
      });
    });
  }

  // 3. User entries (UC-05 Step 2: Aggregate user data)
  if (matchUser) {
    (reportRawData.users || []).forEach(u => {
      const isCompleted = u.status === "ACTIVE";
      const isCancelled = u.status === "INACTIVE" || u.status === "SUSPENDED";
      const statusCategory = isCompleted ? "COMPLETED" : (isCancelled ? "CANCELLED" : "PENDING");
      const recDate = u.registrationDate || todayStr;
      const rolePretty = u.role ? (u.role.charAt(0) + u.role.slice(1).toLowerCase().replace(/_/g, " ")) : "User";

      allRecords.push({
        id: `USR-${u.id}`,
        domain: "USER",
        ref: `USR-${String(u.id).padStart(4, '0')}`,
        date: recDate,
        item: `${rolePretty} Profile (${u.firstName || ""} ${u.lastName || ""})`.trim(),
        party: `${u.email} ${u.phone ? '· ' + u.phone : ''}`,
        value: 0,
        refundAmount: 0,
        statusCategory: statusCategory,
        rawStatus: u.status || "ACTIVE"
      });
    });
  }

  // Filter records by Status and Date Range
  currentAggregatedRecords = allRecords.filter(r => {
    // Status filter
    if (statusFilter !== "ALL" && r.statusCategory !== statusFilter) {
      return false;
    }

    // Date range filter
    if (!r.date || dateRangeFilter === "ALL_TIME") return true;

    const rDate = new Date(r.date);
    if (isNaN(rDate.getTime())) return true;

    if (dateRangeFilter === "TODAY") {
      const rDateStr = r.date.split("T")[0];
      return rDateStr === todayStr;
    } else if (dateRangeFilter === "LAST_7_DAYS") {
      const diffMs = now.getTime() - rDate.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);
      return diffDays >= -7 && diffDays <= 7;
    } else if (dateRangeFilter === "LAST_30_DAYS") {
      const diffMs = now.getTime() - rDate.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);
      return diffDays >= -30 && diffDays <= 30;
    } else if (dateRangeFilter === "THIS_MONTH") {
      return rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth;
    } else if (dateRangeFilter === "CUSTOM") {
      const rDateStr = r.date.split("T")[0];
      if (customStart && rDateStr < customStart) return false;
      if (customEnd && rDateStr > customEnd) return false;
      return true;
    }

    return true;
  });

  // Sort descending by date
  currentAggregatedRecords.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function renderReportSummary() {
  // UC-05 Step 3: System displays charts/summary
  const totalRecordsEl = document.getElementById("kpiTotalRecords");
  const totalVolumeEl = document.getElementById("kpiTotalVolume");
  const successRateEl = document.getElementById("kpiSuccessRate");
  const pendingCountEl = document.getElementById("kpiPendingCount");
  const recordCountBadge = document.getElementById("reportRecordCount");
  const filterPill = document.getElementById("reportFilterPill");
  const tableWrap = document.getElementById("reportTableWrap");
  const emptyState = document.getElementById("reportEmptyState");
  const tbody = document.getElementById("reportTableBody");
  const tfoot = document.getElementById("reportTableFoot");
  const barCompleted = document.getElementById("barCompleted");
  const barPending = document.getElementById("barPending");
  const barCancelled = document.getElementById("barCancelled");
  const legendEl = document.getElementById("reportDistributionLegend");

  const total = currentAggregatedRecords.length;
  if (recordCountBadge) recordCountBadge.textContent = total;

  // Update filter pill label
  const domainVal = document.getElementById("reportDomainFilter")?.value || "ALL";
  const dateVal = document.getElementById("reportDateRangeFilter")?.value || "ALL_TIME";
  const statusVal = document.getElementById("reportStatusFilter")?.value || "ALL";
  if (filterPill) {
    filterPill.textContent = `Filtered by: ${domainVal} · ${dateVal.replace(/_/g, " ")} · ${statusVal}`;
  }

  // UC-05 Extension 2a: No data matches filters -> system shows an empty report state
  if (total === 0) {
    if (tableWrap) tableWrap.style.display = "none";
    if (emptyState) emptyState.classList.remove("hidden");
    if (tfoot) tfoot.innerHTML = "";
    if (totalRecordsEl) totalRecordsEl.textContent = "0";
    if (totalVolumeEl) totalVolumeEl.textContent = "LKR 0";
    if (successRateEl) successRateEl.textContent = "0%";
    if (pendingCountEl) pendingCountEl.textContent = "0";
    if (barCompleted) barCompleted.style.width = "0%";
    if (barPending) barPending.style.width = "0%";
    if (barCancelled) barCancelled.style.width = "0%";
    if (legendEl) legendEl.textContent = "0% Completed · 0% Pending · 0% Inactive";
    return;
  }

  // Data matches: show table and hide empty state
  if (emptyState) emptyState.classList.add("hidden");
  if (tableWrap) tableWrap.style.display = "block";

  // Calculate Metrics
  const totalVolume = currentAggregatedRecords.reduce((acc, r) => acc + (r.value || 0), 0);
  const totalRefunds = currentAggregatedRecords.reduce((acc, r) => acc + (r.refundAmount || 0), 0);
  const netVolume = Math.max(0, totalVolume - totalRefunds);
  const completedCount = currentAggregatedRecords.filter(r => r.statusCategory === "COMPLETED").length;
  const pendingCount = currentAggregatedRecords.filter(r => r.statusCategory === "PENDING").length;
  const cancelledCount = currentAggregatedRecords.filter(r => r.statusCategory === "CANCELLED").length;

  const successPct = Math.round((completedCount / total) * 100);
  const pendingPct = Math.round((pendingCount / total) * 100);
  const cancelledPct = Math.round((cancelledCount / total) * 100);
  const avgVal = total > 0 ? Math.round(totalVolume / total) : 0;

  if (totalRecordsEl) totalRecordsEl.textContent = total.toLocaleString();
  if (totalVolumeEl) {
    totalVolumeEl.textContent = totalVolume > 0 ? `LKR ${totalVolume.toLocaleString()}` : "LKR 0";
  }
  if (successRateEl) successRateEl.textContent = `${successPct}%`;
  if (pendingCountEl) pendingCountEl.textContent = pendingCount;

  // Custom KPI tuning based on selected domain
  if (domainVal === "PUBLISHED_LISTINGS") {
    if (pendingCountEl) pendingCountEl.textContent = `Avg LKR ${avgVal.toLocaleString()}`;
    if (successRateEl) successRateEl.textContent = "100% Live";
  }

  // Update Status Distribution Bar
  if (barCompleted) barCompleted.style.width = `${successPct}%`;
  if (barPending) barPending.style.width = `${pendingPct}%`;
  if (barCancelled) barCancelled.style.width = `${cancelledPct}%`;
  if (legendEl) {
    legendEl.textContent = `${completedCount} Completed (${successPct}%) · ${pendingCount} Pending (${pendingPct}%) · ${cancelledCount} Inactive (${cancelledPct}%)`;
  }

  // Render Table Rows
  if (tbody) {
    tbody.innerHTML = currentAggregatedRecords.map(r => {
      let domainBadgeStyle = "background: #e0f2fe; color: #0284c7;";
      let domainLabel = r.domain;
      if (r.domain === "LISTING" || r.domain === "PUBLISHED_LISTING") {
        domainBadgeStyle = "background: #ffedd5; color: #c2410c;";
        domainLabel = r.domain === "PUBLISHED_LISTING" ? "PUBLISHED" : "LISTING";
      } else if (r.domain === "USER") {
        domainBadgeStyle = "background: #f3e8ff; color: #7e22ce;";
        domainLabel = "USER";
      } else if (r.domain === "TRANSACTION") {
        if (r.category === "AGENT_SUBSCRIPTION") {
          domainBadgeStyle = "background: #ede9fe; color: #6d28d9;";
          domainLabel = "SUBSCRIPTION";
        } else if (r.category === "PAY_PER_LISTING") {
          domainBadgeStyle = "background: #fef3c7; color: #b45309;";
          domainLabel = "SLOT PASS";
        } else {
          domainBadgeStyle = "background: #e0f2fe; color: #0284c7;";
          domainLabel = "VIEWING DEPOSIT";
        }
      }

      let statusBadgeStyle = "background: #dcfce7; color: #15803d;";
      if (r.statusCategory === "PENDING") statusBadgeStyle = "background: #fef3c7; color: #b45309;";
      if (r.statusCategory === "CANCELLED") statusBadgeStyle = "background: #fee2e2; color: #b91c1c;";

      return `
        <tr>
          <td style="white-space: nowrap; font-size: 11px;">${escapeHtml(r.date || "—")}</td>
          <td style="font-family: monospace; font-size: 11px; font-weight: 600; color: #475569;">${escapeHtml(r.ref)}</td>
          <td>
            <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; font-weight: 700; ${domainBadgeStyle}">
              ${escapeHtml(domainLabel)}
            </span>
          </td>
          <td>
            <strong style="color: var(--ink); font-size: 11.5px; display: block;">${escapeHtml(r.item)}</strong>
          </td>
          <td style="color: var(--muted); font-size: 11px;">${escapeHtml(r.party)}</td>
          <td style="font-weight: 700; color: var(--ink); font-size: 11px; text-align: right; white-space: nowrap;">
            ${r.value > 0 ? "LKR " + r.value.toLocaleString() : "—"}
          </td>
          <td>
            <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; ${statusBadgeStyle}">
              ${escapeHtml(r.rawStatus || r.statusCategory)}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Render Grand Totals in Table Footer (<tfoot>)
  if (tfoot) {
    const isFinancialDomain = domainVal === "TRANSACTIONS" || domainVal === "TRANSACTION" || 
                              domainVal === "AGENT_SUBSCRIPTIONS" || domainVal === "PAY_PER_LISTING" || 
                              domainVal === "VIEWING_DEPOSITS";
    if (isFinancialDomain) {
      tfoot.innerHTML = `
        <tr style="background: #f1f5f9; border-top: 2px solid #cbd5e1; font-weight: bold;">
          <td colspan="5" style="padding: 12px 14px; font-size: 11.5px; color: var(--ink);">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px;">💳</span>
              <div>
                <strong>FINANCIAL REVENUE & TRANSACTIONS GRAND TOTAL</strong>
                <div style="font-size:10.5px; color:var(--muted); font-weight:normal;">
                  ${total} processed records · ${completedCount} completed (${successPct}%) · ${pendingCount} pending · ${cancelledCount} refunded/cancelled
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 12px 14px; font-size: 13px; font-weight: 800; color: #0f172a; text-align: right; white-space: nowrap;">
            LKR ${totalVolume.toLocaleString()}
            ${totalRefunds > 0 ? `<div style="font-size:10px; color:#b91c1c; font-weight:600;">Refunds: -LKR ${totalRefunds.toLocaleString()}</div>` : ""}
          </td>
          <td style="padding: 12px 14px; font-size: 11px; color: #15803d; font-weight: 800; white-space: nowrap;">
            Net Inflow: LKR ${netVolume.toLocaleString()}
          </td>
        </tr>
      `;
    } else if (domainVal === "PUBLISHED_LISTINGS") {
      tfoot.innerHTML = `
        <tr style="background: #f1f5f9; border-top: 2px solid #cbd5e1; font-weight: bold;">
          <td colspan="5" style="padding: 12px 14px; font-size: 11.5px; color: var(--ink);">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px;">🏢</span>
              <div>
                <strong>ACTIVE PUBLISHED PROPERTIES GRAND TOTAL</strong>
                <div style="font-size:10.5px; color:var(--muted); font-weight:normal;">
                  ${total} verified apartments live on marketplace · Mean valuation: LKR ${avgVal.toLocaleString()}
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 12px 14px; font-size: 13px; font-weight: 800; color: #0f172a; text-align: right; white-space: nowrap;">
            LKR ${totalVolume.toLocaleString()}
          </td>
          <td style="padding: 12px 14px; font-size: 11px; color: #0369a1; font-weight: 800; white-space: nowrap;">
            100% Marketplace Live
          </td>
        </tr>
      `;
    } else {
      tfoot.innerHTML = `
        <tr style="background: #f1f5f9; border-top: 2px solid #cbd5e1; font-weight: bold;">
          <td colspan="5" style="padding: 12px 14px; font-size: 11.5px; color: var(--ink);">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px;">📈</span>
              <div>
                <strong>GRAND TOTAL SUMMARY</strong>
                <div style="font-size:10.5px; color:var(--muted); font-weight:normal;">
                  ${total} total records (${completedCount} completed, ${pendingCount} pending, ${cancelledCount} inactive)
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 12px 14px; font-size: 13px; font-weight: 800; color: #0f172a; text-align: right; white-space: nowrap;">
            ${totalVolume > 0 ? "LKR " + totalVolume.toLocaleString() : "—"}
          </td>
          <td style="padding: 12px 14px; font-size: 11px; color: #15803d; font-weight: 800; white-space: nowrap;">
            ${successPct}% Completed
          </td>
        </tr>
      `;
    }
  }
}

// UC-05 Step 4: Admin exports the report (CSV)
function exportReportToCsv() {
  if (!currentAggregatedRecords || currentAggregatedRecords.length === 0) {
    showToast("No Data to Export", "There are no records matching your current filter criteria to export.", "error");
    return;
  }

  const domain = document.getElementById("reportDomainFilter")?.value || "ALL";

  const headers = ["Date", "Reference_ID", "Domain", "Item_Detail", "Party_User", "Value_LKR", "Status_Category", "Raw_Status"];
  const rows = currentAggregatedRecords.map(r => {
    let domainLabel = r.domain;
    if (r.domain === "TRANSACTION") {
      if (r.category === "AGENT_SUBSCRIPTION") domainLabel = "SUBSCRIPTION";
      else if (r.category === "PAY_PER_LISTING") domainLabel = "SLOT_PASS";
      else domainLabel = "VIEWING_DEPOSIT";
    }
    return [
      `"${(r.date || "").replace(/"/g, '""')}"`,
      `"${(r.ref || "").replace(/"/g, '""')}"`,
      `"${(domainLabel || "").replace(/"/g, '""')}"`,
      `"${(r.item || "").replace(/"/g, '""')}"`,
      `"${(r.party || "").replace(/"/g, '""')}"`,
      r.value || 0,
      `"${(r.statusCategory || "").replace(/"/g, '""')}"`,
      `"${(r.rawStatus || "").replace(/"/g, '""')}"`
    ];
  });

  const totalVolume = currentAggregatedRecords.reduce((acc, r) => acc + (r.value || 0), 0);
  const totalRefunds = currentAggregatedRecords.reduce((acc, r) => acc + (r.refundAmount || 0), 0);
  const netVolume = Math.max(0, totalVolume - totalRefunds);
  const avgVal = currentAggregatedRecords.length > 0 ? Math.round(totalVolume / currentAggregatedRecords.length) : 0;

  // Add Grand Totals rows to CSV
  rows.push([]);
  const isFinancialDomain = domain === "TRANSACTIONS" || domain === "TRANSACTION" || 
                            domain === "AGENT_SUBSCRIPTIONS" || domain === "PAY_PER_LISTING" || 
                            domain === "VIEWING_DEPOSITS";
  if (isFinancialDomain) {
    rows.push([`"--- GRAND TOTALS & FINANCIAL SUMMARY ---"`, `""`, `""`, `""`, `""`, `""`, `""`, `""`]);
    rows.push([`"Total Transactions"`, `"${currentAggregatedRecords.length}"`, `""`, `""`, `""`, `""`, `""`, `""`]);
    rows.push([`"Gross Processed Volume (LKR)"`, `""`, `""`, `""`, `""`, totalVolume, `"GROSS_TOTAL"`, `""`]);
    rows.push([`"Total Refunds (LKR)"`, `""`, `""`, `""`, `""`, totalRefunds, `"REFUNDS"`, `""`]);
    rows.push([`"Net Platform Volume (LKR)"`, `""`, `""`, `""`, `""`, netVolume, `"NET_TOTAL"`, `""`]);
  } else if (domain === "PUBLISHED_LISTINGS") {
    rows.push([`"--- GRAND TOTALS & PORTFOLIO SUMMARY ---"`, `""`, `""`, `""`, `""`, `""`, `""`, `""`]);
    rows.push([`"Total Published Properties"`, `"${currentAggregatedRecords.length}"`, `""`, `""`, `""`, `""`, `""`, `""`]);
    rows.push([`"Portfolio Grand Total Valuation (LKR)"`, `""`, `""`, `""`, `""`, totalVolume, `"PORTFOLIO_TOTAL"`, `""`]);
    rows.push([`"Average Property Price (LKR)"`, `""`, `""`, `""`, `""`, avgVal, `"MEAN_VALUATION"`, `""`]);
  } else {
    rows.push([`"--- GRAND TOTALS SUMMARY ---"`, `""`, `""`, `""`, `""`, `""`, `""`, `""`]);
    rows.push([`"Total Records"`, `"${currentAggregatedRecords.length}"`, `""`, `""`, `""`, `""`, `""`, `""`]);
    rows.push([`"Grand Total Volume (LKR)"`, `""`, `""`, `""`, `""`, totalVolume, `"GRAND_TOTAL"`, `""`]);
  }

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `NookAndKey_Business_Report_${domain}_${timestamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Report Exported ✅", `CSV report with Grand Totals downloaded successfully.`, "success");
}

// UC-05 Step 4: Admin exports the report (PDF / Print)
function exportReportToPdf() {
  if (!currentAggregatedRecords || currentAggregatedRecords.length === 0) {
    showToast("No Data to Export", "There are no records matching your current filter criteria to export.", "error");
    return;
  }

  const domain = document.getElementById("reportDomainFilter")?.value || "ALL";
  const dateRange = document.getElementById("reportDateRangeFilter")?.value || "ALL_TIME";
  const status = document.getElementById("reportStatusFilter")?.value || "ALL";
  const nowStr = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  const totalRecs = currentAggregatedRecords.length;
  const totalVol = currentAggregatedRecords.reduce((acc, r) => acc + (r.value || 0), 0);
  const totalRefunds = currentAggregatedRecords.reduce((acc, r) => acc + (r.refundAmount || 0), 0);
  const netVol = Math.max(0, totalVol - totalRefunds);
  const completedCount = currentAggregatedRecords.filter(r => r.statusCategory === "COMPLETED").length;
  const pendingCount = currentAggregatedRecords.filter(r => r.statusCategory === "PENDING").length;
  const successRate = totalRecs > 0 ? Math.round((completedCount / totalRecs) * 100) : 0;
  const avgVal = totalRecs > 0 ? Math.round(totalVol / totalRecs) : 0;

  const tableRowsHtml = currentAggregatedRecords.map((r, idx) => {
    let domainBadgeStyle = "background: #e0f2fe; color: #0369a1;";
    let domainLabel = r.domain;
    if (r.domain === "TRANSACTION") {
      if (r.category === "AGENT_SUBSCRIPTION") {
        domainBadgeStyle = "background: #ede9fe; color: #6d28d9;";
        domainLabel = "SUBSCRIPTION";
      } else if (r.category === "PAY_PER_LISTING") {
        domainBadgeStyle = "background: #fef3c7; color: #b45309;";
        domainLabel = "SLOT PASS";
      } else {
        domainBadgeStyle = "background: #e0f2fe; color: #0369a1;";
        domainLabel = "VIEWING DEPOSIT";
      }
    } else if (r.domain === "USER") {
      domainBadgeStyle = "background: #f3e8ff; color: #7e22ce;";
    } else if (r.domain === "LISTING" || r.domain === "PUBLISHED_LISTING") {
      domainBadgeStyle = "background: #ffedd5; color: #c2410c;";
    }

    return `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${escapeHtml(r.date || "—")}</td>
      <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-family: monospace; font-weight: 600; color: #475569;">${escapeHtml(r.ref || "—")}</td>
      <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;"><span style="display:inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; ${domainBadgeStyle}">${escapeHtml(domainLabel)}</span></td>
      <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #1e293b;">${escapeHtml(r.item)}</td>
      <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${escapeHtml(r.party)}</td>
      <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #0f172a; text-align: right;">${r.value > 0 ? 'LKR ' + r.value.toLocaleString() : '—'}</td>
      <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <span style="display:inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; ${
          r.statusCategory === 'COMPLETED' ? 'background: #dcfce7; color: #15803d;' :
          r.statusCategory === 'PENDING' ? 'background: #fef3c7; color: #b45309;' : 'background: #fee2e2; color: #b91c1c;'
        }">
          ${escapeHtml(r.rawStatus || r.statusCategory)}
        </span>
      </td>
    </tr>
  `}).join("");

  let tfootHtml = "";
  const isFinancialDomain = domain === "TRANSACTIONS" || domain === "TRANSACTION" || 
                            domain === "AGENT_SUBSCRIPTIONS" || domain === "PAY_PER_LISTING" || 
                            domain === "VIEWING_DEPOSITS";
  if (isFinancialDomain) {
    tfootHtml = `
      <tfoot>
        <tr style="background:#f1f5f9; font-weight:bold; border-top:2px solid #0f172a;">
          <td colspan="5" style="padding:10px; font-size:11px;">
            <strong>FINANCIAL REVENUES GRAND TOTAL</strong> (${totalRecs} transactions · ${completedCount} completed · ${pendingCount} pending)
          </td>
          <td style="padding:10px; font-size:11px; text-align:right; font-weight:800; color:#0f172a;">
            LKR ${totalVol.toLocaleString()}
            ${totalRefunds > 0 ? `<br><small style="color:#b91c1c; font-weight:normal;">Refunds: -LKR ${totalRefunds.toLocaleString()}</small>` : ""}
          </td>
          <td style="padding:10px; font-size:11px; color:#15803d; font-weight:800;">
            Net: LKR ${netVol.toLocaleString()}
          </td>
        </tr>
      </tfoot>
    `;
  } else if (domain === "PUBLISHED_LISTINGS") {
    tfootHtml = `
      <tfoot>
        <tr style="background:#f1f5f9; font-weight:bold; border-top:2px solid #0f172a;">
          <td colspan="5" style="padding:10px; font-size:11px;">
            <strong>PORTFOLIO GRAND TOTAL VALUATION</strong> (${totalRecs} active published apartments · Mean: LKR ${avgVal.toLocaleString()})
          </td>
          <td style="padding:10px; font-size:11px; text-align:right; font-weight:800; color:#0f172a;">
            LKR ${totalVol.toLocaleString()}
          </td>
          <td style="padding:10px; font-size:11px; color:#0369a1; font-weight:800;">
            100% Active Live
          </td>
        </tr>
      </tfoot>
    `;
  } else {
    tfootHtml = `
      <tfoot>
        <tr style="background:#f1f5f9; font-weight:bold; border-top:2px solid #0f172a;">
          <td colspan="5" style="padding:10px; font-size:11px;">
            <strong>GRAND TOTAL</strong> (${totalRecs} records)
          </td>
          <td style="padding:10px; font-size:11px; text-align:right; font-weight:800; color:#0f172a;">
            ${totalVol > 0 ? 'LKR ' + totalVol.toLocaleString() : '—'}
          </td>
          <td style="padding:10px; font-size:11px; color:#15803d; font-weight:800;">
            ${successRate}% Rate
          </td>
        </tr>
      </tfoot>
    `;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Nook & Key - Marketplace Business Report (UC-05)</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 30px; line-height: 1.5; background: #fff; }
        .no-print { position: sticky; top: 0; background: #102a2c; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #102a2c; }
        .brand span { color: #e8785a; font-style: italic; }
        .title { font-size: 18px; font-weight: 700; margin: 4px 0 0; color: #334155; }
        .meta { text-align: right; font-size: 11px; color: #64748b; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .kpi-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; background: #f8fafc; }
        .kpi-card .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; display: block; }
        .kpi-card .val { font-size: 20px; font-weight: bold; color: #0f172a; font-family: Georgia, serif; }
        .filters-pill { background: #f1f5f9; padding: 8px 14px; border-radius: 6px; font-size: 11.5px; margin-bottom: 20px; display: flex; gap: 20px; color: #475569; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
        @media print {
          body { margin: 12mm; }
          .no-print { display: none !important; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <span style="font-size: 13px;"><strong>Executive Report Generated</strong> · ${totalRecs} matching records analyzed</span>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.print()" style="background: #e8785a; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">🖨️ Print / Save as PDF</button>
          <button onclick="window.close()" style="background: rgba(255,255,255,0.15); color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; cursor: pointer;">✕ Close</button>
        </div>
      </div>
      <div class="header">
        <div>
          <div class="brand">nook<span>&</span>key</div>
          <div class="title">Marketplace Oversight & Executive Business Report</div>
          <small style="color: #64748b; font-size: 11px;">System Specification: UC-05 Generate Reports</small>
        </div>
        <div class="meta">
          <div><strong>Generated:</strong> ${nowStr}</div>
          <div><strong>Actor:</strong> Administrator (admin@nookandkey.com)</div>
          <div><strong>Records Included:</strong> ${totalRecs} items</div>
        </div>
      </div>

      <div class="filters-pill">
        <span><strong>Domain:</strong> ${escapeHtml(domain)}</span>
        <span><strong>Date Range:</strong> ${escapeHtml(dateRange)}</span>
        <span><strong>Status Criteria:</strong> ${escapeHtml(status)}</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="lbl">Total Records</span>
          <div class="val">${totalRecs}</div>
        </div>
        <div class="kpi-card">
          <span class="lbl">${domain === "PUBLISHED_LISTINGS" ? "Portfolio Valuation" : "Financial Volume"}</span>
          <div class="val" style="color: #c2410c;">LKR ${totalVol.toLocaleString()}</div>
        </div>
        <div class="kpi-card">
          <span class="lbl">${domain === "PUBLISHED_LISTINGS" ? "Listing Status" : "Completion Rate"}</span>
          <div class="val" style="color: #15803d;">${domain === "PUBLISHED_LISTINGS" ? "100% Live" : `${successRate}%`}</div>
        </div>
        <div class="kpi-card">
          <span class="lbl">${domain === "PUBLISHED_LISTINGS" ? "Mean Valuation" : "Pending Review"}</span>
          <div class="val" style="color: #b45309;">${domain === "PUBLISHED_LISTINGS" ? `LKR ${avgVal.toLocaleString()}` : pendingCount}</div>
        </div>
      </div>

      <h3 style="font-size: 13px; text-transform: uppercase; margin: 18px 0 8px; color: #334155;">Records Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Ref / ID</th>
            <th>Domain</th>
            <th>Item / Detail</th>
            <th>Party / User</th>
            <th style="text-align: right;">Value (LKR)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
        ${tfootHtml}
      </table>

      <div style="margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>Nook & Key Real Estate Management Information System</span>
        <span>Confidential - For Administrator Business Analysis Only</span>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWin = window.open("", "_blank");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(printHtml);
    printWin.document.close();
    showToast("Exporting PDF 🖨️", "Print dialog launched with Grand Totals.", "success");
  } else {
    // Popup was blocked, fallback to printable iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printHtml);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
    showToast("Exporting PDF 🖨️", "Print dialog launched.", "success");
  }
}

// Report Modal Triggers and Filter Listeners
document.getElementById("exportReport")?.addEventListener("click", openReportModal);
document.getElementById("navReports")?.addEventListener("click", (e) => {
  e.preventDefault();
  openReportModal();
});
document.getElementById("closeReportModal")?.addEventListener("click", closeReportModal);
document.getElementById("closeReportModalBtn")?.addEventListener("click", closeReportModal);
document.getElementById("reportModal")?.addEventListener("click", (e) => {
  if (e.target.id === "reportModal") closeReportModal();
});

document.getElementById("applyReportFiltersBtn")?.addEventListener("click", () => {
  aggregateReportData();
  renderReportSummary();
});

document.getElementById("reportDomainFilter")?.addEventListener("change", () => {
  aggregateReportData();
  renderReportSummary();
});

document.getElementById("reportDateRangeFilter")?.addEventListener("change", (e) => {
  const customBox = document.getElementById("customDateRangeBox");
  if (customBox) {
    customBox.style.display = e.target.value === "CUSTOM" ? "grid" : "none";
  }
  aggregateReportData();
  renderReportSummary();
});

document.getElementById("customStartDate")?.addEventListener("change", () => {
  aggregateReportData();
  renderReportSummary();
});
document.getElementById("customEndDate")?.addEventListener("change", () => {
  aggregateReportData();
  renderReportSummary();
});

document.getElementById("reportStatusFilter")?.addEventListener("change", () => {
  aggregateReportData();
  renderReportSummary();
});

document.getElementById("btnEmptyResetFilters")?.addEventListener("click", () => {
  const domainFilter = document.getElementById("reportDomainFilter");
  const dateRangeFilter = document.getElementById("reportDateRangeFilter");
  const statusFilter = document.getElementById("reportStatusFilter");
  const customBox = document.getElementById("customDateRangeBox");

  if (domainFilter) domainFilter.value = "ALL";
  if (dateRangeFilter) dateRangeFilter.value = "ALL_TIME";
  if (statusFilter) statusFilter.value = "ALL";
  if (customBox) customBox.style.display = "none";

  aggregateReportData();
  renderReportSummary();
});

document.getElementById("btnExportCsv")?.addEventListener("click", exportReportToCsv);
document.getElementById("btnExportPdf")?.addEventListener("click", exportReportToPdf);

// Window exports for debugging/testing
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.exportReportToCsv = exportReportToCsv;
window.exportReportToPdf = exportReportToPdf;
window.triggerActivitySearch = triggerActivitySearch;

document.querySelectorAll("[data-alert]").forEach((button) =>
  button.addEventListener("click", () => alert(`Opening ${button.dataset.alert} alert details.`))
);

document.getElementById("logoutButton").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "signIn_page.html";
});

loadAdminSummary().catch((error) => {
  emptyState.classList.remove("hidden");
  emptyState.textContent = error.message;
});

// Preload amenities count
loadAmenities();

// Sleek Floating Toast Notification
function showToast(title, message, type = "success") {
  if (!document.getElementById("nookToastStyles")) {
    const style = document.createElement("style");
    style.id = "nookToastStyles";
    style.textContent = `
      @keyframes nookToastSlideIn {
        from { opacity: 0; transform: translateY(-20px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .nook-toast-card {
        pointer-events: auto;
        background: #0f172a;
        color: #ffffff;
        border-radius: 12px;
        padding: 14px 18px;
        box-shadow: 0 20px 35px -10px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
        display: flex;
        align-items: flex-start;
        gap: 14px;
        animation: nookToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .nook-toast-card.success { border-left: 4px solid #22c55e; }
      .nook-toast-card.error { border-left: 4px solid #ef4444; }
    `;
    document.head.appendChild(style);
  }

  let container = document.getElementById("nookToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "nookToastContainer";
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `nook-toast-card ${type}`;
  const icon = type === "success" ? "✅" : "⚠️";
  toast.innerHTML = `
    <div style="font-size: 20px; line-height: 1; flex-shrink: 0; margin-top: 2px;">${icon}</div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-weight: 700; font-size: 13.5px; color: #f8fafc; margin-bottom: 3px; letter-spacing: -0.2px;">${title}</div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.45; word-break: break-word;">${message}</div>
    </div>
    <button type="button" style="background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; line-height: 1; padding: 0 0 0 6px;" aria-label="Close">×</button>
  `;

  const closeBtn = toast.querySelector("button");
  closeBtn.addEventListener("click", () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// Admin Profile Modal & Password Management
const profileChip = document.getElementById("profileChip");
const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const modalAdminLogoutButton = document.getElementById("modalAdminLogoutButton");
const tabAdminProfileInfo = document.getElementById("tabAdminProfileInfo");
const tabAdminPassword = document.getElementById("tabAdminPassword");
const tabAdminContentProfile = document.getElementById("tabAdminContentProfile");
const tabAdminContentPassword = document.getElementById("tabAdminContentPassword");

function updateAdminProfileUI(profile) {
  const firstName = profile.firstName || "System";
  const lastName = profile.lastName || "Admin";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "AD";

  const dateEl = document.getElementById("todayDate") || document.querySelector(".topbar .eyebrow");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  const greetingEl = document.getElementById("adminGreetingName");
  if (greetingEl) greetingEl.textContent = `${firstName}.`;

  const fullNameEl = document.getElementById("adminFullName");
  if (fullNameEl) fullNameEl.textContent = fullName;

  const avatarEl = document.getElementById("adminAvatar");
  if (avatarEl) avatarEl.textContent = initials;

  const modalName = document.getElementById("adminModalName");
  if (modalName) modalName.textContent = fullName;

  const editFirst = document.getElementById("editFirstName");
  if (editFirst) editFirst.value = profile.firstName || "";
  const editLast = document.getElementById("editLastName");
  if (editLast) editLast.value = profile.lastName || "";
  const editEmail = document.getElementById("editEmail");
  if (editEmail) editEmail.value = profile.email || localStorage.getItem("userEmail") || "";
  const editPhone = document.getElementById("editPhone");
  if (editPhone) editPhone.value = profile.phone || localStorage.getItem("userPhone") || "";

  const targetEmailEl = document.getElementById("changePasswordTargetEmail");
  if (targetEmailEl) {
    targetEmailEl.textContent = profile.email || localStorage.getItem("userEmail") || "your active account email";
  }
}

async function loadAdminProfile() {
  const token = localStorage.getItem("jwtToken");
  if (!token) return;

  const cached = {
    firstName: localStorage.getItem("userFirstName"),
    lastName: localStorage.getItem("userLastName"),
    email: localStorage.getItem("userEmail"),
    phone: localStorage.getItem("userPhone")
  };
  updateAdminProfileUI(cached);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.firstName) localStorage.setItem("userFirstName", data.firstName);
      if (data.lastName) localStorage.setItem("userLastName", data.lastName);
      if (data.email) localStorage.setItem("userEmail", data.email);
      if (data.phone) localStorage.setItem("userPhone", data.phone);
      updateAdminProfileUI(data);
    }
  } catch (error) {
    console.warn("Could not sync admin profile:", error);
  }
}

if (profileChip && profileModal) {
  profileChip.addEventListener("click", () => {
    profileModal.classList.remove("hidden");
    const msg = document.getElementById("profileMessage");
    if (msg) msg.textContent = "";
    const pwdMsg = document.getElementById("passwordChangeMessage");
    if (pwdMsg) pwdMsg.textContent = "";
    const targetEmailEl = document.getElementById("changePasswordTargetEmail");
    if (targetEmailEl) {
      targetEmailEl.textContent = localStorage.getItem("userEmail") || "your active account email";
    }
  });
}

function closeAdminProfileModal() {
  if (profileModal) profileModal.classList.add("hidden");
}

if (closeProfileModal) closeProfileModal.addEventListener("click", closeAdminProfileModal);

if (profileModal) {
  profileModal.addEventListener("click", (e) => {
    if (e.target === profileModal) closeAdminProfileModal();
  });
}

if (modalAdminLogoutButton) {
  modalAdminLogoutButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "signIn_page.html";
  });
}

if (tabAdminProfileInfo && tabAdminPassword) {
  tabAdminProfileInfo.addEventListener("click", () => {
    tabAdminProfileInfo.style.color = "var(--ink)";
    tabAdminProfileInfo.style.borderBottom = "2px solid var(--coral)";
    tabAdminPassword.style.color = "var(--muted)";
    tabAdminPassword.style.borderBottom = "2px solid transparent";
    tabAdminContentProfile?.classList.remove("hidden");
    tabAdminContentPassword?.classList.add("hidden");
  });

  tabAdminPassword.addEventListener("click", () => {
    tabAdminPassword.style.color = "var(--ink)";
    tabAdminPassword.style.borderBottom = "2px solid var(--coral)";
    tabAdminProfileInfo.style.color = "var(--muted)";
    tabAdminProfileInfo.style.borderBottom = "2px solid transparent";
    tabAdminContentPassword?.classList.remove("hidden");
    tabAdminContentProfile?.classList.add("hidden");
    const targetEmailEl = document.getElementById("changePasswordTargetEmail");
    if (targetEmailEl) {
      targetEmailEl.textContent = localStorage.getItem("userEmail") || "your active account email";
    }
  });
}

// Admin Profile Form Submit
const updateProfileForm = document.getElementById("updateProfileForm");
if (updateProfileForm) {
  updateProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById("saveProfileBtn");
    const msg = document.getElementById("profileMessage");
    const firstName = document.getElementById("editFirstName").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();
    const phone = document.getElementById("editPhone").value.trim();

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    msg.textContent = "";

    try {
      const payload = { firstName, lastName, phone };

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Could not update profile (${response.status})`);
      }

      localStorage.setItem("userFirstName", data.firstName);
      localStorage.setItem("userLastName", data.lastName);
      if (data.phone) localStorage.setItem("userPhone", data.phone);

      updateAdminProfileUI(data);
      msg.className = "message success";
      msg.style.color = "#2e7d32";
      msg.style.fontWeight = "bold";
      msg.textContent = "✓ Profile updated successfully!";
      showToast("Profile Updated Successfully ✅", "Admin details updated and applied in real-time.", "success");

    } catch (err) {
      msg.className = "message";
      msg.style.color = "var(--coral, #dc2626)";
      msg.textContent = "⚠️ " + err.message;
      showToast("Profile Update Failed", err.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes →";
    }
  });
}

// Admin Change Password Form Submit
const changePasswordForm = document.getElementById("changePasswordForm");
if (changePasswordForm) {
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById("savePasswordBtn");
    const msg = document.getElementById("passwordChangeMessage");
    const currentPassword = document.getElementById("changeCurrentPassword").value;
    const newPassword = document.getElementById("changeNewPassword").value;
    const confirmPassword = document.getElementById("changeConfirmPassword").value;

    if (newPassword !== confirmPassword) {
      msg.className = "message";
      msg.style.color = "var(--coral)";
      msg.textContent = "New password and confirmation do not match.";
      return;
    }

    if (newPassword.length < 8) {
      msg.className = "message";
      msg.style.color = "var(--coral)";
      msg.textContent = "Password must be at least 8 characters long.";
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Updating Password...";
    msg.textContent = "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Password change failed. Check your current password.");
      }

      const targetMail = data.recipientEmail || localStorage.getItem('userEmail') || 'your account email';
      msg.className = "message success";
      msg.style.color = "#2e7d32";
      msg.style.fontWeight = "bold";
      msg.innerHTML = `✓ Password changed! A security confirmation email was sent directly to <u>${targetMail}</u>.`;
      changePasswordForm.reset();
      showToast("Password Updated Successfully! 🔐", `Admin password has been updated. A security confirmation email was sent directly to ${targetMail}.`, "success");
    } catch (err) {
      msg.className = "message";
      msg.style.color = "var(--coral)";
      msg.textContent = "⚠️ " + err.message;
      showToast("Password Update Failed", err.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Update Password & Send Email Alert →";
    }
  });
}

// Initial Admin Profile Load
loadAdminProfile();

// ============================================================================
// SYSTEM SETTINGS & DYNAMIC PRICING CONTROLLER (ADMIN)
// ============================================================================
const ADMIN_SETTINGS_ENDPOINT = "/api/admin/settings";
const systemSettingsForm = document.getElementById("systemSettingsForm");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const btnResetSettings = document.getElementById("btnResetSettings");
const settingsAlertBanner = document.getElementById("settingsAlertBanner");
const navSettings = document.getElementById("navSettings");
const settingsSection = document.getElementById("settings");
const currencySelect = document.getElementById("setting_PLATFORM_CURRENCY");

function showSettingsBanner(msg, type = "success") {
  if (!settingsAlertBanner) return;
  settingsAlertBanner.style.display = "block";
  if (type === "success") {
    settingsAlertBanner.style.background = "#e4efe8";
    settingsAlertBanner.style.color = "#215d40";
    settingsAlertBanner.style.border = "1px solid #c2ded1";
    settingsAlertBanner.innerHTML = `✓ <strong>Success:</strong> ${msg}`;
  } else {
    settingsAlertBanner.style.background = "#fbe7dd";
    settingsAlertBanner.style.color = "#99321c";
    settingsAlertBanner.style.border = "1px solid #f4ad95";
    settingsAlertBanner.innerHTML = `⚠️ <strong>Error:</strong> ${msg}`;
  }
  setTimeout(() => {
    if (settingsAlertBanner) settingsAlertBanner.style.display = "none";
  }, 6000);
}

function updateCurrencyLabels(curr) {
  document.querySelectorAll(".currency-tag").forEach(el => {
    el.textContent = curr || "LKR";
  });
}

if (currencySelect) {
  currencySelect.addEventListener("change", (e) => {
    updateCurrencyLabels(e.target.value);
  });
}

// Sidebar smooth navigation with glowing highlight
if (navSettings && settingsSection) {
  navSettings.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".side-nav a").forEach(a => a.classList.remove("active"));
    navSettings.classList.add("active");
    settingsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    settingsSection.style.borderColor = "var(--coral)";
    settingsSection.style.boxShadow = "0 0 0 3px rgba(232, 120, 90, 0.25)";
    setTimeout(() => {
      settingsSection.style.borderColor = "var(--line)";
      settingsSection.style.boxShadow = "";
    }, 2200);
  });
}

async function loadSystemSettings() {
  if (!systemSettingsForm) return;
  try {
    const res = await fetch(`${API_BASE_URL}${ADMIN_SETTINGS_ENDPOINT}`, {
      headers: authHeaders()
    });
    if (res.status === 401 || res.status === 403) {
      console.warn("Unauthorized to fetch admin system settings");
      return;
    }
    if (!res.ok) {
      throw new Error(`Failed to load system settings (${res.status})`);
    }
    const settingsList = await res.json();
    let loadedCount = 0;

    settingsList.forEach(item => {
      const fieldId = `setting_${item.settingKey}`;
      const input = document.getElementById(fieldId);
      if (input) {
        input.value = item.settingValue;
        loadedCount++;
      }
    });

    const curr = document.getElementById("setting_PLATFORM_CURRENCY")?.value;
    updateCurrencyLabels(curr);

    const tsEl = document.getElementById("settingsSyncTimestamp");
    if (tsEl) {
      const now = new Date();
      tsEl.textContent = `Synced at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (${loadedCount} parameters live)`;
    }
  } catch (err) {
    console.error("Error loading system settings:", err);
  }
}

if (systemSettingsForm) {
  systemSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btnSaveSettings) {
      btnSaveSettings.disabled = true;
      btnSaveSettings.innerHTML = "⏳ Saving...";
    }

    const payload = {};
    const formData = new FormData(systemSettingsForm);
    for (const [key, value] of formData.entries()) {
      payload[key] = value.trim();
    }

    try {
      const res = await fetch(`${API_BASE_URL}${ADMIN_SETTINGS_ENDPOINT}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed to update settings (${res.status})`);
      }

      showSettingsBanner("All listing fees, subscription tiers, and platform rules have been updated and synced to the database.", "success");
      showToast("System Settings Saved ✅", "Platform pricing & quotas updated in real time.", "success");

      const curr = document.getElementById("setting_PLATFORM_CURRENCY")?.value;
      updateCurrencyLabels(curr);

      const tsEl = document.getElementById("settingsSyncTimestamp");
      if (tsEl) {
        const now = new Date();
        tsEl.textContent = `Updated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (Saved)`;
      }
    } catch (err) {
      showSettingsBanner(err.message, "error");
      showToast("Settings Update Failed", err.message, "error");
    } finally {
      if (btnSaveSettings) {
        btnSaveSettings.disabled = false;
        btnSaveSettings.innerHTML = "💾 Save Changes";
      }
    }
  });
}

if (btnResetSettings) {
  btnResetSettings.addEventListener("click", async () => {
    const ok = confirm("⚠️ Are you sure you want to reset all Pay-Per-Listing fees, agent subscription pricing, and platform policies back to factory defaults?");
    if (!ok) return;

    btnResetSettings.disabled = true;
    btnResetSettings.innerHTML = "⏳ Resetting...";

    try {
      const res = await fetch(`${API_BASE_URL}${ADMIN_SETTINGS_ENDPOINT}/reset`, {
        method: "POST",
        headers: authHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to reset settings");
      }

      await loadSystemSettings();
      showSettingsBanner("All platform settings have been restored to initial factory defaults.", "success");
      showToast("Factory Defaults Restored ↺", "System settings reset successfully.", "success");
    } catch (err) {
      showSettingsBanner(err.message, "error");
      showToast("Reset Failed", err.message, "error");
    } finally {
      btnResetSettings.disabled = false;
      btnResetSettings.innerHTML = "↺ Reset Defaults";
    }
  });
}

// Initial System Settings Load
loadSystemSettings();

// ============================================================================
// ADMIN VERIFICATION OVERRIDE & UNPUBLISH LOGIC (Requirement #3)
// ============================================================================
const adminOverrideModal = document.getElementById("adminOverrideModal");
const closeAdminOverrideModalBtn = document.getElementById("closeAdminOverrideModal");
const cancelOverrideBtn = document.getElementById("cancelOverrideBtn");
const btnOpenOverrideModal = document.getElementById("btnOpenOverrideModal");
const btnLookupOverrideListing = document.getElementById("btnLookupOverrideListing");
const adminOverrideForm = document.getElementById("adminOverrideForm");
const overrideListingIdInput = document.getElementById("overrideListingIdInput");
const overrideListingPreview = document.getElementById("overrideListingPreview");
const overridePreviewTitle = document.getElementById("overridePreviewTitle");
const overridePreviewMeta = document.getElementById("overridePreviewMeta");
const overrideActionSelect = document.getElementById("overrideActionSelect");
const overrideReasonInput = document.getElementById("overrideReasonInput");
const overrideMessage = document.getElementById("overrideMessage");
const submitOverrideBtn = document.getElementById("submitOverrideBtn");

function openAdminOverrideModal(listingId = null, listingTitle = null) {
  if (!adminOverrideModal) return;
  adminOverrideModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  if (overrideMessage) {
    overrideMessage.textContent = "";
    overrideMessage.className = "message";
  }

  if (listingId) {
    if (overrideListingIdInput) overrideListingIdInput.value = listingId;
    lookupListingForOverride(listingId, listingTitle);
  } else {
    if (overrideListingIdInput) overrideListingIdInput.value = "";
    if (overrideListingPreview) overrideListingPreview.style.display = "none";
    if (overrideReasonInput) overrideReasonInput.value = "";
  }
}

function closeAdminOverrideModal() {
  if (!adminOverrideModal) return;
  adminOverrideModal.classList.add("hidden");
  document.body.style.overflow = "auto";
  if (adminOverrideForm) adminOverrideForm.reset();
  if (overrideListingPreview) overrideListingPreview.style.display = "none";
  if (overrideMessage) {
    overrideMessage.textContent = "";
    overrideMessage.className = "message";
  }
}

async function lookupListingForOverride(idToLookup = null, fallbackTitle = null) {
  const id = idToLookup || overrideListingIdInput?.value?.trim();
  if (!id) {
    if (overrideMessage) {
      overrideMessage.textContent = "Please specify a Listing ID to lookup.";
      overrideMessage.className = "message error";
    }
    return;
  }

  if (btnLookupOverrideListing) {
    btnLookupOverrideListing.disabled = true;
    btnLookupOverrideListing.textContent = "Looking up...";
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/listings/${id}`, { headers: authHeaders() });
    if (!res.ok) {
      if (overrideListingPreview) overrideListingPreview.style.display = "block";
      if (overridePreviewTitle) overridePreviewTitle.textContent = fallbackTitle || `Listing ID #${id}`;
      if (overridePreviewMeta) {
        overridePreviewMeta.innerHTML = `<span style="color:#b91c1c;">Listing details not available from public index (HTTP ${res.status}). You may still proceed with executive override.</span>`;
      }
      return;
    }
    const data = await res.json();
    if (overrideListingPreview) overrideListingPreview.style.display = "block";
    if (overridePreviewTitle) {
      overridePreviewTitle.textContent = `${data.title || "Apartment"} (${data.city || "Colombo"})`;
    }
    if (overridePreviewMeta) {
      const priceFmt = data.price ? `LKR ${Number(data.price).toLocaleString()}` : "Price not set";
      const ownerFmt = data.ownerName || (data.ownerType === "AGENT" ? "Agent" : "Seller");
      overridePreviewMeta.innerHTML = `<strong>Status:</strong> ${data.status} &nbsp;|&nbsp; <strong>Price:</strong> ${priceFmt} &nbsp;|&nbsp; <strong>Owner:</strong> ${ownerFmt}`;
    }
    if (overrideMessage) {
      overrideMessage.textContent = "";
      overrideMessage.className = "message";
    }
  } catch (err) {
    console.warn("Error looking up listing:", err);
    if (overrideListingPreview) overrideListingPreview.style.display = "block";
    if (overridePreviewTitle) overridePreviewTitle.textContent = fallbackTitle || `Listing ID #${id}`;
    if (overridePreviewMeta) overridePreviewMeta.textContent = "Unable to fetch live preview, but override can still be applied.";
  } finally {
    if (btnLookupOverrideListing) {
      btnLookupOverrideListing.disabled = false;
      btnLookupOverrideListing.textContent = "Lookup";
    }
  }
}

async function handleAdminOverrideSubmit(e) {
  if (e) e.preventDefault();
  const listingId = overrideListingIdInput?.value?.trim();
  const action = overrideActionSelect?.value || "UNPUBLISH";
  const reason = overrideReasonInput?.value?.trim();

  if (!listingId) {
    if (overrideMessage) {
      overrideMessage.textContent = "Please enter a valid Listing ID.";
      overrideMessage.className = "message error";
    }
    return;
  }

  if (!reason || reason.length < 5) {
    if (overrideMessage) {
      overrideMessage.textContent = "Please provide an explanatory reason for this administrative override (at least 5 characters).";
      overrideMessage.className = "message error";
    }
    return;
  }

  if (submitOverrideBtn) {
    submitOverrideBtn.disabled = true;
    submitOverrideBtn.textContent = "Revoking & Unpublishing...";
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/verification/${listingId}/admin-override`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ action, reason })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || `Override failed with status ${res.status}`);
    }

    if (overrideMessage) {
      overrideMessage.textContent = `✅ Success: Listing #${listingId} verification revoked and status set to ${data.status || 'UNPUBLISHED'}.`;
      overrideMessage.className = "message success";
    }

    showToast(
      "Verification Revoked 🚫",
      `Listing #${listingId} has been unpublished from the public marketplace. Owner and verification team notified.`,
      "success"
    );

    // Refresh platform activities & dashboard
    loadPlatformActivities();
    loadAdminSummary();
    isReportDataLoaded = false; // Invalidate cached report data

    setTimeout(() => {
      closeAdminOverrideModal();
    }, 1500);
  } catch (err) {
    console.error("Admin override error:", err);
    if (overrideMessage) {
      overrideMessage.textContent = `Error: ${err.message}`;
      overrideMessage.className = "message error";
    }
    showToast("Override Failed", err.message, "error");
  } finally {
    if (submitOverrideBtn) {
      submitOverrideBtn.disabled = false;
      submitOverrideBtn.textContent = "Confirm Override & Revoke Publication";
    }
  }
}

// Wire up Verification Override Listeners
if (btnOpenOverrideModal) btnOpenOverrideModal.addEventListener("click", () => openAdminOverrideModal());
if (closeAdminOverrideModalBtn) closeAdminOverrideModalBtn.addEventListener("click", closeAdminOverrideModal);
if (cancelOverrideBtn) cancelOverrideBtn.addEventListener("click", closeAdminOverrideModal);
if (btnLookupOverrideListing) btnLookupOverrideListing.addEventListener("click", () => lookupListingForOverride());
if (adminOverrideForm) adminOverrideForm.addEventListener("submit", handleAdminOverrideSubmit);
if (adminOverrideModal) {
  adminOverrideModal.addEventListener("click", (e) => {
    if (e.target.id === "adminOverrideModal") closeAdminOverrideModal();
  });
}

// ============================================================================
// ADMIN NOTIFICATIONS LOGIC (Requirement #4)
// ============================================================================
const adminNotifBtn = document.getElementById("adminNotifBtn");
const adminNotifBadge = document.getElementById("adminNotifBadge");
const adminNotifModal = document.getElementById("adminNotifModal");
const closeAdminNotifModal = document.getElementById("closeAdminNotifModal");
const closeAdminNotifModalBtn = document.getElementById("closeAdminNotifModalBtn");
const markAllAdminNotifsReadBtn = document.getElementById("markAllAdminNotifsReadBtn");
const refreshAdminNotifsBtn = document.getElementById("refreshAdminNotifsBtn");
const adminNotifList = document.getElementById("adminNotifList");

function openAdminNotifModal() {
  if (!adminNotifModal) return;
  adminNotifModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  loadAdminNotifications();
}

function closeAdminNotifModalDialog() {
  if (!adminNotifModal) return;
  adminNotifModal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

async function updateAdminNotifBadge() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const count = Number(data.unreadCount || 0);

    if (adminNotifBadge) {
      if (count > 0) {
        adminNotifBadge.textContent = count > 99 ? "99+" : String(count);
        adminNotifBadge.classList.remove("hidden");
        adminNotifBadge.style.display = "inline-flex";
      } else {
        adminNotifBadge.classList.add("hidden");
        adminNotifBadge.style.display = "none";
      }
    }
  } catch (err) {
    console.warn("Could not update admin notification count:", err);
  }
}

async function loadAdminNotifications() {
  if (!adminNotifList) return;
  adminNotifList.innerHTML = `<div style="text-align:center; padding:24px; color:var(--muted); font-size:12px;">⏳ Loading notifications...</div>`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, { headers: authHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to load notifications (HTTP ${res.status})`);
    }
    const notifications = await res.json();

    if (!Array.isArray(notifications) || notifications.length === 0) {
      adminNotifList.innerHTML = `
        <div style="text-align: center; padding: 36px 20px; color: var(--muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🔔</div>
          <strong style="color: var(--ink); font-size: 13px; display: block; margin-bottom: 4px;">No Administrative Notifications</strong>
          <p style="font-size: 11.5px; margin: 0;">You're all caught up! New registrations, upgrades, and listings will appear here in real-time.</p>
        </div>
      `;
      return;
    }

    adminNotifList.innerHTML = notifications.map(n => {
      const isUnread = !n.read;
      let icon = "🔔";
      let iconBg = "#f1f5f9";
      let iconColor = "#475569";

      const titleLower = (n.title || "").toLowerCase();
      if (titleLower.includes("user") || titleLower.includes("account") || titleLower.includes("registration")) {
        icon = "👤";
        iconBg = "#f3e8ff";
        iconColor = "#7e22ce";
      } else if (titleLower.includes("subscription") || titleLower.includes("upgrade") || titleLower.includes("slot")) {
        icon = "💎";
        iconBg = "#fef3c7";
        iconColor = "#b45309";
      } else if (titleLower.includes("listing") || titleLower.includes("apartment")) {
        icon = "🏢";
        iconBg = "#e0f2fe";
        iconColor = "#0369a1";
      } else if (titleLower.includes("booking") || titleLower.includes("deposit") || titleLower.includes("dispute")) {
        icon = "📅";
        iconBg = "#dcfce7";
        iconColor = "#15803d";
      }

      const timeStr = formatRelativeTime(n.createdAt);

      return `
        <div class="admin-notif-item" data-id="${n.id}" style="display:flex; gap:12px; padding:12px 14px; border-radius:8px; border:1px solid ${isUnread ? 'rgba(232,120,90,0.3)' : 'var(--line)'}; background:${isUnread ? '#fffdfa' : '#ffffff'}; transition:all 0.2s ease;">
          <div style="width:36px; height:36px; border-radius:50%; background:${iconBg}; color:${iconColor}; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;">
            ${icon}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <strong style="font-size:12px; color:var(--ink); line-height:1.3;">${escapeHtml(n.title)}</strong>
              <span style="font-size:10.5px; color:var(--muted); white-space:nowrap;">${timeStr}</span>
            </div>
            <p style="margin:4px 0 0; font-size:11.5px; color:#475569; line-height:1.4;">${escapeHtml(n.message)}</p>
            ${isUnread ? `
              <div style="margin-top:6px; display:flex; justify-content:flex-end;">
                <button class="btn-mark-single-read" data-id="${n.id}" style="border:none; background:transparent; color:var(--coral); font-size:10.5px; font-weight:bold; cursor:pointer; padding:0;">Mark as read ✓</button>
              </div>
            ` : ""}
          </div>
        </div>
      `;
    }).join("");

    adminNotifList.querySelectorAll(".btn-mark-single-read").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        try {
          await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
            method: "PATCH",
            headers: authHeaders()
          });
          loadAdminNotifications();
          updateAdminNotifBadge();
        } catch (err) {
          console.warn("Could not mark notification as read:", err);
        }
      });
    });
  } catch (err) {
    console.error("Error loading admin notifications:", err);
    adminNotifList.innerHTML = `<div style="text-align:center; padding:20px; color:#b91c1c; font-size:12px;">Failed to load notifications: ${err.message}</div>`;
  }
}

async function markAllAdminNotifsRead() {
  if (markAllAdminNotifsReadBtn) {
    markAllAdminNotifsReadBtn.disabled = true;
    markAllAdminNotifsReadBtn.textContent = "Marking...";
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: "PATCH",
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("Failed to mark all as read");
    showToast("Notifications Cleared", "All notifications marked as read.", "success");
    await loadAdminNotifications();
    await updateAdminNotifBadge();
  } catch (err) {
    console.error("Error marking all read:", err);
    showToast("Action Failed", err.message, "error");
  } finally {
    if (markAllAdminNotifsReadBtn) {
      markAllAdminNotifsReadBtn.disabled = false;
      markAllAdminNotifsReadBtn.textContent = "Mark all read";
    }
  }
}

// Wire up Admin Notification Listeners
if (adminNotifBtn) adminNotifBtn.addEventListener("click", openAdminNotifModal);
if (closeAdminNotifModal) closeAdminNotifModal.addEventListener("click", closeAdminNotifModalDialog);
if (closeAdminNotifModalBtn) closeAdminNotifModalBtn.addEventListener("click", closeAdminNotifModalDialog);
if (refreshAdminNotifsBtn) refreshAdminNotifsBtn.addEventListener("click", loadAdminNotifications);
if (markAllAdminNotifsReadBtn) markAllAdminNotifsReadBtn.addEventListener("click", markAllAdminNotifsRead);
if (adminNotifModal) {
  adminNotifModal.addEventListener("click", (e) => {
    if (e.target.id === "adminNotifModal") closeAdminNotifModalDialog();
  });
}

// Initial Admin Notification Badge Fetch & Periodic Polling
updateAdminNotifBadge();
setInterval(updateAdminNotifBadge, 25000);

