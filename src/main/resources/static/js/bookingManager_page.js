const API_BASE_URL = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";
const BOOKINGS_ENDPOINT = "/api/bookings/manage";
const NOTIFICATIONS_ENDPOINT = "/api/notifications";

// Enforce role check
(function checkAuth() {
  const token = localStorage.getItem("jwtToken");
  const role = localStorage.getItem("userRole");
  if (!token || (role !== "BOOKING_MANAGER" && role !== "ADMIN")) {
    alert("Booking Manager privileges required. Please sign in with a Booking Manager account.");
    window.location.href = "signIn_page.html";
  }
})();

let bookings = [];
const tableBody = document.getElementById("bookingTableBody");
const search = document.getElementById("bookingSearch");
const filter = document.getElementById("bookingFilter");
const emptyState = document.getElementById("emptyState");

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function authHeaders(isJson = false) {
  const token = localStorage.getItem("jwtToken") || "";
  const headers = { Authorization: `Bearer ${token}` };
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
}

function handleAuthError(response) {
  if (response.status === 401 || response.status === 403) {
    alert("Session expired or unauthorized. Please sign in again.");
    window.location.href = "signIn_page.html";
    return true;
  }
  return false;
}

function value(item, keys, fallback = "—") {
  for (const key of keys) {
    if (item?.[key] !== undefined && item[key] !== null) return item[key];
  }
  return fallback;
}

function normalizeBooking(item) {
  const buyer = String(value(item, ["buyerName"], "Buyer") || "Buyer");
  const initials = buyer.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "B";
  const viewingTime = String(value(item, ["viewingTime"], "") || "");
  const advanceAmount = Number(value(item, ["advancePaymentAmount"], 5000)) || 5000;
  const paymentStatus = String(value(item, ["paymentStatus"], "PAID") || "PAID");
  const paymentMethod = String(value(item, ["paymentMethod"], "Card (Paddle)") || "Card (Paddle)");
  const txnRef = String(value(item, ["transactionReference"], "—") || "—");
  const refundAmount = Number(value(item, ["refundAmount"], 0)) || 0;
  const refundStatus = String(value(item, ["refundStatus"], "NONE") || "NONE");
  const cancelledAfterAccepted = Boolean(value(item, ["cancelledAfterAccepted"], false));

  // Dispute fields (UC - 06: Manage Booking Disputes)
  const isDisputed = Boolean(value(item, ["isDisputed", "disputed"], false));
  const disputeStatus = String(value(item, ["disputeStatus"], "NONE") || "NONE").toUpperCase();
  const disputeRaisedBy = String(value(item, ["disputeRaisedBy"], "") || "");
  const disputeReason = String(value(item, ["disputeReason"], "") || "");
  const disputeDetails = String(value(item, ["disputeDetails"], "") || "");
  const disputeDate = String(value(item, ["disputeDate"], "") || "");
  const resolutionDecision = String(value(item, ["resolutionDecision"], "") || "");
  const resolutionNotes = String(value(item, ["resolutionNotes"], "") || "");
  const resolutionDate = String(value(item, ["resolutionDate"], "") || "");
  const resolvedByManagerName = String(value(item, ["resolvedByManagerName"], "") || "");
  const buyerEmail = String(value(item, ["buyerEmail"], "") || "");
  const buyerPhone = String(value(item, ["buyerPhone"], "") || "");
  const ownerEmail = String(value(item, ["ownerEmail"], "") || "");
  const ownerType = String(value(item, ["ownerType"], "Owner") || "Owner");

  // Reschedule fields
  const isRescheduled = Boolean(value(item, ["isRescheduled", "rescheduled"], false));
  const rescheduledDate = String(value(item, ["rescheduledDate"], "") || "");
  const rescheduledTime = String(value(item, ["rescheduledTime"], "") || "");
  const originalViewingDate = String(value(item, ["originalViewingDate"], "") || "");
  const originalViewingTime = String(value(item, ["originalViewingTime"], "") || "");

  return {
    id: value(item, ["id"]),
    buyer,
    initials,
    buyerEmail,
    buyerPhone,
    property: String(value(item, ["listingTitle"], "Listing") || "Listing"),
    date: String(value(item, ["viewingDate"], "—") || "—"),
    time: viewingTime,
    owner: String(value(item, ["ownerName"], "Owner") || "Owner"),
    ownerEmail,
    ownerType,
    status: String(value(item, ["status"], "PENDING") || "PENDING").toUpperCase(),
    advanceAmount,
    paymentStatus,
    paymentMethod,
    txnRef,
    refundAmount,
    refundStatus,
    cancelledAfterAccepted,
    isDisputed,
    disputeStatus,
    disputeRaisedBy,
    disputeReason,
    disputeDetails,
    disputeDate,
    resolutionDecision,
    resolutionNotes,
    resolutionDate,
    resolvedByManagerName,
    isRescheduled,
    rescheduledDate,
    rescheduledTime,
    originalViewingDate,
    originalViewingTime
  };
}

function statusLabel(status) {
  return {
    CONFIRMED: "Confirmed",
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
  }[status] || status;
}

function updateStats() {
  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const accepted = bookings.filter((b) => b.status === "ACCEPTED" || b.status === "CONFIRMED").length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const disputedTotal = bookings.filter((b) => b.isDisputed).length;
  const disputedOpen = bookings.filter((b) => b.isDisputed && b.disputeStatus === "OPEN").length;

  const statTotal = document.getElementById("statTotalBookings");
  const statPending = document.getElementById("statPendingBookings");
  const statAccepted = document.getElementById("statAcceptedBookings");
  const statCompleted = document.getElementById("statCompletedBookings");
  const statDisputed = document.getElementById("statDisputedBookings");
  const statOpenDisputes = document.getElementById("statOpenDisputes");
  const quickDisputeBadge = document.getElementById("quickDisputeBadge");
  const navCount = document.getElementById("bookingCount");

  if (statTotal) statTotal.textContent = total;
  if (statPending) statPending.textContent = pending;
  if (statAccepted) statAccepted.textContent = accepted;
  if (statCompleted) statCompleted.textContent = completed;
  if (statDisputed) statDisputed.textContent = disputedTotal;
  if (statOpenDisputes) statOpenDisputes.textContent = disputedOpen;
  if (quickDisputeBadge) quickDisputeBadge.textContent = disputedOpen;
  if (navCount) navCount.textContent = total;
}

function renderBookings() {
  const query = (search?.value || "").toLowerCase().trim();
  const chosen = filter?.value || "ALL";
  const rows = bookings.filter((item) => {
    const searchTarget = `${item.buyer} ${item.property} ${item.owner} ${item.txnRef} ${item.disputeReason} ${item.disputeDetails}`.toLowerCase();
    const matchesQuery = !query || searchTarget.includes(query);
    if (!matchesQuery) return false;

    if (chosen === "ALL") return true;
    if (chosen === "DISPUTED") return item.isDisputed;
    if (chosen === "DISPUTED_OPEN") return item.isDisputed && item.disputeStatus === "OPEN";
    if (chosen === "ACCEPTED") return item.status === "ACCEPTED" || item.status === "CONFIRMED";
    return item.status === chosen;
  });

  tableBody.innerHTML = rows.map((item) => {
    let actionsHtml = "";
    if (item.isDisputed && item.disputeStatus === "OPEN") {
      actionsHtml = `
        <div style="display:flex; flex-direction:column; gap:5px;">
          <button class="resolve-dispute-btn primary-button" data-id="${item.id}" style="padding:6px 12px; font-size:11px; background:#ea580c; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:800; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 6px rgba(234,88,12,.3);">
            ⚖️ Resolve Dispute
          </button>
        </div>
      `;
    } else if (item.status === "PENDING") {
      actionsHtml = `
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <button class="accept-booking-btn primary-button" data-id="${item.id}" style="padding:5px 10px; font-size:10px; background:var(--green); color:white; border:none; border-radius:4px; cursor:pointer;">
            ✓ Accept
          </button>
          <button class="reject-booking-btn secondary-button" data-id="${item.id}" style="padding:5px 10px; font-size:10px; color:var(--coral); border:1px solid var(--line); border-radius:4px; cursor:pointer;">
            ✕ Reject
          </button>
          <button class="resolve-dispute-btn secondary-button" data-id="${item.id}" style="padding:4px 7px; font-size:9.5px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; cursor:pointer;" title="Open Dispute Mediation">
            ⚖️ Mediate
          </button>
        </div>
      `;
    } else if (item.status === "ACCEPTED" || item.status === "CONFIRMED") {
      actionsHtml = `
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <button class="complete-booking-btn primary-button" data-id="${item.id}" style="padding:5px 10px; font-size:10px; background:var(--ink); color:white; border:none; border-radius:4px; cursor:pointer;">
            Mark Completed
          </button>
          <button class="resolve-dispute-btn secondary-button" data-id="${item.id}" style="padding:4px 7px; font-size:9.5px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; cursor:pointer;" title="Open Dispute Mediation">
            ⚖️ Mediate
          </button>
        </div>
      `;
    } else if (item.status === "CANCELLED") {
      if (item.refundStatus === "PENDING") {
        const isFull = Number(item.refundAmount) >= (item.advanceAmount || 5000);
        actionsHtml = `
          <div style="display:flex; flex-direction:column; gap:4px;">
            <button class="refund-booking-btn primary-button" data-id="${item.id}" data-property="${item.property}" data-buyer="${item.buyer}" data-amount="${item.refundAmount || (isFull ? 5000 : 2500)}" style="padding:6px 10px; font-size:10px; background:#2563eb; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; white-space:nowrap;">
              💰 Authorize ${isFull ? '100% Full' : '50%'} Refund (LKR ${(item.refundAmount || (isFull ? 5000 : 2500)).toLocaleString()})
            </button>
            <button class="resolve-dispute-btn secondary-button" data-id="${item.id}" style="padding:3px 7px; font-size:9.5px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; cursor:pointer;">
              ⚖️ Mediate Dispute
            </button>
          </div>
        `;
      } else if (item.refundStatus === "PARTIALLY_REFUNDED") {
        actionsHtml = `
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span style="color:#065f46; font-size:10px; font-weight:700;">✓ Refunded LKR ${(item.refundAmount || 2500).toLocaleString()}</span>
            <button class="resolve-dispute-btn secondary-button" data-id="${item.id}" style="padding:2px 6px; font-size:9px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; cursor:pointer;">⚖️ Mediate</button>
          </div>
        `;
      } else if (item.refundStatus === "REFUNDED") {
        actionsHtml = `
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span style="color:#065f46; font-size:10px; font-weight:700;">✓ 100% Refunded LKR ${(item.advanceAmount || 5000).toLocaleString()}</span>
            <button class="resolve-dispute-btn secondary-button" data-id="${item.id}" style="padding:2px 6px; font-size:9px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; cursor:pointer;">⚖️ Mediate</button>
          </div>
        `;
      } else if (item.refundStatus === "FORFEITED") {
        actionsHtml = `
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span style="color:#b45309; font-size:10px; font-weight:700;">Deposit Forfeited</span>
            <button class="resolve-dispute-btn secondary-button" data-id="${item.id}" style="padding:2px 6px; font-size:9px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; cursor:pointer;">⚖️ Mediate</button>
          </div>
        `;
      } else {
        actionsHtml = `
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span style="color:var(--muted); font-size:11px;">Cancelled</span>
            <button class="resolve-dispute-btn secondary-button" data-id="${item.id}" style="padding:2px 6px; font-size:9px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; cursor:pointer;">⚖️ Mediate</button>
          </div>
        `;
      }
    } else {
      actionsHtml = `
        <button class="resolve-dispute-btn secondary-button" data-id="${item.id}" style="padding:3px 7px; font-size:9.5px; color:#c2410c; background:#fff7ed; border:1px solid #fed7aa; border-radius:4px; cursor:pointer;">⚖️ Mediate</button>
      `;
    }

    if (item.isDisputed && (item.disputeStatus === "RESOLVED" || item.disputeStatus === "ESCALATED_TO_ADMIN")) {
      actionsHtml += `
        <div style="margin-top:4px;">
          <button class="view-dispute-btn secondary-button" data-id="${item.id}" style="padding:3px 7px; font-size:9.5px; color:#475569; border:1px solid #cbd5e1; border-radius:4px; cursor:pointer;">
            ⚖️ Case Details
          </button>
        </div>
      `;
    }

    const cleanPaymentMethod = (item.paymentMethod || 'Card').replace(' (Paddle Sandbox)', '');
    const isDisputedOpen = item.isDisputed && item.disputeStatus === 'OPEN';
    const rowStyle = isDisputedOpen ? 'background:#fffbf7; border-left:4px solid #ea580c;' : '';

    return `
      <tr class="row-fade-in" style="${rowStyle}">
        <td>
          <div class="buyer-cell">
            <span class="buyer-avatar">${item.initials}</span>
            <div>${item.buyer}<span class="subtext">Buyer</span></div>
          </div>
        </td>
        <td>
          <strong>${item.property}</strong>
          ${item.isDisputed ? `<div style="font-size:9px; color:#c2410c; font-family:monospace; margin-top:2px;">#DSP-BK-${item.id}</div>` : ''}
        </td>
        <td>
          <div style="font-weight:600; color:var(--ink);">${item.date}</div>
          ${item.time ? `<div style="font-size:11px; color:var(--muted);">${item.time}</div>` : ''}
          ${(item.isRescheduled || item.resolutionDecision === 'RESCHEDULE') ? `
            <div style="font-size:9.5px; color:#6d28d9; background:#ede9fe; border:1px solid #ddd6fe; padding:2px 6px; border-radius:4px; margin-top:3px; display:inline-block; font-weight:700;">
              🔄 Rescheduled ${item.originalViewingDate ? `<span style="color:#7c3aed; font-weight:normal;">(Was: ${escapeHtml(item.originalViewingDate)})</span>` : ''}
            </div>
          ` : ''}
        </td>
        <td>${item.owner}</td>
        <td>
          <div style="font-weight:700; color:#102a2c;">LKR ${item.advanceAmount.toLocaleString()}</div>
          <div style="display:flex; align-items:center; gap:4px; margin-top:3px; flex-wrap:wrap;">
            <span style="font-size:9px; font-weight:800; padding:1px 6px; border-radius:10px; background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;">
              ${item.paymentStatus}
            </span>
            <span style="font-size:9px; color:#64748b;" title="Transaction: ${item.txnRef}">💳 ${cleanPaymentMethod}</span>
          </div>
          <div style="font-size:8px; color:#94a3b8; font-family:monospace; margin-top:2px;">${item.txnRef}</div>
        </td>
        <td>
          <span class="booking-status ${item.status}">${statusLabel(item.status)}</span>
          ${isDisputedOpen ? `
            <div style="font-size:10px; font-weight:800; color:#c2410c; background:#ffedd5; border:1px solid #fed7aa; padding:3px 7px; border-radius:6px; margin-top:4px; display:inline-flex; align-items:center; gap:4px;">
              <span>⚠️</span> Dispute: ${escapeHtml((item.disputeReason || 'Action Required').replace(/_/g, ' '))}
            </div>
            <div style="font-size:9.5px; color:#9a3412; margin-top:2px;">Raised by ${escapeHtml(item.disputeRaisedBy || 'Complainant')}</div>
          ` : (item.isDisputed && item.disputeStatus === 'RESOLVED' ? `
            <div style="font-size:9.5px; font-weight:700; color:#065f46; background:#ecfdf5; border:1px solid #a7f3d0; padding:2px 6px; border-radius:5px; margin-top:3px;" title="${escapeHtml(item.resolutionNotes || '')}">
              ✓ Resolved: ${escapeHtml((item.resolutionDecision || 'Settled').replace(/_/g, ' '))}
              ${(item.resolutionDecision === 'RESCHEDULE' || item.isRescheduled) ? `
                <div style="font-size:9px; color:#6d28d9; font-weight:700; margin-top:2px;">
                  📅 ${escapeHtml(item.rescheduledDate || item.date)} ${escapeHtml(item.rescheduledTime || item.time || '')}
                </div>
              ` : ''}
            </div>
          ` : (item.isDisputed && item.disputeStatus === 'ESCALATED_TO_ADMIN' ? `
            <div style="font-size:9.5px; font-weight:800; color:#b91c1c; background:#fef2f2; border:1px solid #fca5a5; padding:2px 6px; border-radius:5px; margin-top:3px;">
              🚨 Escalated to Admin
            </div>
          ` : ''))}
          ${item.cancelledAfterAccepted ? `
            <div style="font-size:9px; color:#b45309; font-weight:700; margin-top:3px; background:#fef3c7; padding:2px 6px; border-radius:6px;">
              ⚠️ Cancelled after accept
            </div>
          ` : ''}
          ${item.refundStatus === 'PARTIALLY_REFUNDED' && !item.isDisputed ? `
            <div style="font-size:9px; color:#2563eb; font-weight:700; margin-top:2px;">
              ✓ 50% Refunded
            </div>
          ` : (item.refundStatus === 'PENDING' && !item.isDisputed ? `
            <div style="font-size:9px; color:#dc2626; font-weight:700; margin-top:2px;">
              ⏳ Partial Refund Pending
            </div>
          ` : '')}
        </td>
        <td>${actionsHtml}</td>
      </tr>
    `;
  }).join("");

  emptyState.classList.toggle("hidden", rows.length > 0);
  updateStats();

  // Attach action button listeners
  tableBody.querySelectorAll(".accept-booking-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleAcceptBooking(btn.dataset.id));
  });

  tableBody.querySelectorAll(".reject-booking-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleRejectBooking(btn.dataset.id));
  });

  tableBody.querySelectorAll(".complete-booking-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleCompleteBooking(btn.dataset.id));
  });

  tableBody.querySelectorAll(".refund-booking-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleProcessRefund(btn.dataset.id, btn.dataset.property, btn.dataset.buyer, btn.dataset.amount));
  });

  tableBody.querySelectorAll(".resolve-dispute-btn").forEach((btn) => {
    btn.addEventListener("click", () => openDisputeModal(btn.dataset.id));
  });

  tableBody.querySelectorAll(".view-dispute-btn").forEach((btn) => {
    btn.addEventListener("click", () => openDisputeModal(btn.dataset.id));
  });
}

async function loadBookings(showLoading = false) {
  if (showLoading && tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:42px 20px; color:#475569;">
          <div style="display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; background:#f1f5f9; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <span style="display:inline-block; font-size:22px; color:#2563eb; animation:spin 0.75s linear infinite;">↻</span>
          </div>
          <div style="font-weight:700; font-size:14px; color:#1e293b;">Reloading booking requests...</div>
          <div style="font-size:11.5px; color:#64748b; margin-top:4px;">Fetching live buyer bookings, viewing dates, and payment records</div>
        </td>
      </tr>
    `;
    emptyState?.classList.add("hidden");
  }

  try {
    const fetchPromise = fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}?_=${Date.now()}`, { headers: authHeaders() });
    const [response] = await Promise.all([
      fetchPromise,
      showLoading ? new Promise((r) => setTimeout(r, 350)) : Promise.resolve()
    ]);

    if (handleAuthError(response)) return;
    if (!response.ok) throw new Error(`Unable to load bookings (${response.status}).`);

    bookings = (await response.json()).map(normalizeBooking);
    bookings.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    console.log(`[BookingManager] Loaded ${bookings.length} bookings successfully.`);
    renderBookings();
  } catch (error) {
    console.error("[BookingManager] Error loading bookings:", error);
    if (showLoading && tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:36px; color:#dc2626;">
            <strong style="font-size:14px;">⚠️ Failed to load bookings</strong>
            <p style="margin:6px 0 0; font-size:11.5px; color:#64748b;">${escapeHtml(error.message)}</p>
            <button onclick="loadBookings(true)" style="margin-top:12px; padding:6px 14px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; font-size:11px; cursor:pointer; font-weight:bold;">Try Again ↻</button>
          </td>
        </tr>
      `;
    } else {
      emptyState?.classList.remove("hidden");
      if (emptyState) emptyState.textContent = error.message;
    }
  }
}

async function handleAcceptBooking(id) {
  if (!confirm(`Accept and confirm booking #${id}? Notifications will be sent immediately to the listing owner and the buyer.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/${id}/accept`, {
      method: "PATCH",
      headers: authHeaders()
    });
    if (handleAuthError(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `Could not accept booking (${response.status})`);
    }

    broadcastBookingUpdate("ACCEPT", id);
    alert(`Booking #${id} accepted! The seller/agent and buyer have been notified.`);
    await loadBookings();
  } catch (err) {
    alert("Action failed: " + err.message);
  }
}

async function handleRejectBooking(id) {
  if (!confirm(`Reject booking #${id}? An update notification will be sent to the buyer.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/${id}/reject`, {
      method: "PATCH",
      headers: authHeaders()
    });
    if (handleAuthError(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `Could not reject booking (${response.status})`);
    }

    broadcastBookingUpdate("REJECT", id);
    alert(`Booking #${id} rejected.`);
    await loadBookings();
  } catch (err) {
    alert("Action failed: " + err.message);
  }
}

async function handleCompleteBooking(id) {
  if (!confirm(`Mark viewing for booking #${id} as completed? This confirms that the apartment viewing took place.`)) {
    return;
  }

  const btn = document.querySelector(`.complete-booking-btn[data-id="${id}"]`);
  const origText = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ Completing...</span>`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/${id}/confirm-viewing`, {
      method: "PATCH",
      headers: authHeaders()
    });
    if (handleAuthError(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `Could not complete viewing (${response.status})`);
    }

    broadcastBookingUpdate("COMPLETE", id);
    showToast("Viewing Completed ✓", `Booking #${id} viewing marked as conducted and completed.`, "success");
    await loadBookings();
  } catch (err) {
    showToast("Action Failed", err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

async function handleProcessRefund(id, property, buyer, amount) {
  const numAmount = amount ? Number(amount) : 2500;
  const refundAmount = numAmount.toLocaleString();
  const isFull = numAmount >= 5000;
  const policyReason = isFull 
    ? "The viewing was cancelled by the property host (Seller/Agent). Per platform policy, the buyer receives a 100% FULL REFUND."
    : "The viewing was cancelled by the buyer after confirmation. Per policy, a 50% partial refund is issued to cover reservation coordination.";

  if (!confirm(`Confirm ${isFull ? '100% Full' : '50% Partial'} Refund of LKR ${refundAmount} for Booking #${id} (${property || 'Apartment'}) to buyer ${buyer || ''}?\n\nPolicy: ${policyReason}`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/${id}/refund-partial`, {
      method: "PATCH",
      headers: authHeaders()
    });
    if (handleAuthError(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `Could not process refund (${response.status})`);
    }

    broadcastBookingUpdate("REFUND", id);
    alert(`✓ ${isFull ? '100% Full' : '50% Partial'} refund of LKR ${refundAmount} processed successfully for Booking #${id}! The buyer has been notified.`);
    await loadBookings();
  } catch (err) {
    alert("Refund failed: " + err.message);
  }
}

// Notifications Handling
const managerNotifBtn = document.getElementById("managerNotifBtn");
const managerNotifModal = document.getElementById("managerNotifModal");
const closeManagerNotifModal = document.getElementById("closeManagerNotifModal");
const closeManagerNotifModalBtn = document.getElementById("closeManagerNotifModalBtn");
const refreshManagerNotifsBtn = document.getElementById("refreshManagerNotifsBtn");

async function loadNotifications() {
  const listEl = document.getElementById("managerNotifList");
  if (!listEl) return;

  listEl.innerHTML = `<p style="color:var(--muted); font-size:13px;">Loading notifications...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINT}`, {
      headers: authHeaders()
    });
    if (handleAuthError(response)) return;
    if (!response.ok) throw new Error("Could not load notifications");

    const notifs = await response.json();
    if (notifs.length === 0) {
      listEl.innerHTML = `<p style="color:var(--muted); font-size:13px; padding:15px 0;">No new notifications.</p>`;
      return;
    }

    listEl.innerHTML = notifs.map((n) => `
      <div style="padding:12px; border:1px solid var(--line); border-radius:8px; background:${n.read ? 'var(--cream)' : '#fff'}; display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="font-size:13px; color:var(--ink);">${n.title}</strong>
            ${!n.read ? '<span style="background:var(--coral); color:white; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:bold;">NEW</span>' : ''}
          </div>
          <p style="margin:5px 0 0; font-size:12px; color:var(--ink); line-height:1.4;">${n.message}</p>
          <small style="color:var(--muted); font-size:10px; margin-top:4px; display:block;">${new Date(n.createdAt).toLocaleString()}</small>
        </div>
        ${!n.read ? `<button class="mark-read-btn" data-id="${n.id}" style="border:none; background:transparent; color:var(--coral); font-size:11px; cursor:pointer; font-weight:bold; white-space:nowrap;">✓ Read</button>` : ''}
      </div>
    `).join("");

    listEl.querySelectorAll(".mark-read-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINT}/${btn.dataset.id}/read`, {
          method: "PATCH",
          headers: authHeaders()
        });
        loadNotifications();
        updateNotifBadge();
      });
    });

  } catch (err) {
    listEl.innerHTML = `<p style="color:var(--coral); font-size:13px;">${err.message}</p>`;
  }
}

async function updateNotifBadge() {
  const badge = document.getElementById("managerNotifBadge");
  if (!badge) return;

  try {
    const response = await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINT}/unread-count`, {
      headers: authHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      const count = data.unreadCount || 0;
      if (count > 0) {
        badge.textContent = count > 9 ? "9+" : count;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  } catch (err) {
    // Ignore error
  }
}

if (managerNotifBtn) {
  managerNotifBtn.addEventListener("click", () => {
    managerNotifModal?.classList.remove("hidden");
    loadNotifications();
  });
}
if (closeManagerNotifModal) closeManagerNotifModal.addEventListener("click", () => managerNotifModal?.classList.add("hidden"));
if (closeManagerNotifModalBtn) closeManagerNotifModalBtn.addEventListener("click", () => managerNotifModal?.classList.add("hidden"));
if (refreshManagerNotifsBtn) refreshManagerNotifsBtn.addEventListener("click", loadNotifications);
if (managerNotifModal) {
  managerNotifModal.addEventListener("click", (e) => {
    if (e.target === managerNotifModal) managerNotifModal.classList.add("hidden");
  });
}

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

// User Profile Management & Edit
function updateProfileUI(profile) {
  const firstName = profile.firstName || "Booking";
  const lastName = profile.lastName || "Manager";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "BM";

  const greetingEl = document.getElementById("managerGreeting");
  if (greetingEl) greetingEl.innerHTML = `<em>${firstName}.</em>`;

  const fullNameEl = document.getElementById("userFullName");
  if (fullNameEl) fullNameEl.textContent = fullName;

  const avatarEl = document.getElementById("userAvatar");
  if (avatarEl) avatarEl.textContent = initials;

  const modalAvatar = document.getElementById("modalAvatar");
  if (modalAvatar) modalAvatar.textContent = initials;
  const modalFullName = document.getElementById("modalFullName");
  if (modalFullName) modalFullName.textContent = fullName;

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

async function loadUserProfile() {
  const token = localStorage.getItem("jwtToken");
  if (!token) return;

  const cached = {
    firstName: localStorage.getItem("userFirstName"),
    lastName: localStorage.getItem("userLastName"),
    email: localStorage.getItem("userEmail"),
    phone: localStorage.getItem("userPhone")
  };
  updateProfileUI(cached);

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
      updateProfileUI(data);
    }
  } catch (error) {
    console.warn("Could not sync profile:", error);
  }
}

// Profile Form Submit
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

      if (handleAuthError(response)) return;

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Could not update profile (${response.status})`);
      }

      localStorage.setItem("userFirstName", data.firstName);
      localStorage.setItem("userLastName", data.lastName);
      if (data.phone) localStorage.setItem("userPhone", data.phone);

      updateProfileUI(data);
      msg.className = "message success";
      msg.style.color = "var(--green, #2e7d32)";
      msg.style.fontWeight = "bold";
      msg.textContent = "✓ Profile updated successfully!";
      showToast("Profile Updated Successfully ✅", "Your details have been updated and applied in real-time.", "success");

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

// Modal handling
const profileChip = document.getElementById("profileChip");
const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const modalLogoutButton = document.getElementById("modalLogoutButton");

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

// Profile Modal Tabs & Password Change Handling
const tabManagerProfileInfo = document.getElementById("tabManagerProfileInfo");
const tabManagerPassword = document.getElementById("tabManagerPassword");
const tabManagerContentProfile = document.getElementById("tabManagerContentProfile");
const tabManagerContentPassword = document.getElementById("tabManagerContentPassword");

if (tabManagerProfileInfo && tabManagerPassword && tabManagerContentProfile && tabManagerContentPassword) {
  tabManagerProfileInfo.addEventListener("click", () => {
    tabManagerProfileInfo.style.color = "var(--ink)";
    tabManagerProfileInfo.style.borderBottom = "2px solid var(--coral)";
    tabManagerPassword.style.color = "var(--muted)";
    tabManagerPassword.style.borderBottom = "2px solid transparent";
    tabManagerContentProfile.classList.remove("hidden");
    tabManagerContentPassword.classList.add("hidden");
  });

  tabManagerPassword.addEventListener("click", () => {
    tabManagerPassword.style.color = "var(--ink)";
    tabManagerPassword.style.borderBottom = "2px solid var(--coral)";
    tabManagerProfileInfo.style.color = "var(--muted)";
    tabManagerProfileInfo.style.borderBottom = "2px solid transparent";
    tabManagerContentPassword.classList.remove("hidden");
    tabManagerContentProfile.classList.add("hidden");
    const pwdMsg = document.getElementById("passwordChangeMessage");
    if (pwdMsg) pwdMsg.textContent = "";
    const targetEmailEl = document.getElementById("changePasswordTargetEmail");
    if (targetEmailEl) {
      targetEmailEl.textContent = localStorage.getItem("userEmail") || "your active account email";
    }
  });
}

const changePasswordForm = document.getElementById("changePasswordForm");
if (changePasswordForm) {
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById("savePasswordBtn");
    const msg = document.getElementById("passwordChangeMessage");
    const currentPassword = document.getElementById("changeCurrentPassword").value;
    const newPassword = document.getElementById("changeNewPassword").value;
    const confirmPassword = document.getElementById("changeConfirmPassword").value;

    msg.textContent = "";
    msg.className = "message";

    if (newPassword.length < 8) {
      msg.style.color = "var(--coral)";
      msg.textContent = "New password must be at least 8 characters long.";
      return;
    }

    if (newPassword !== confirmPassword) {
      msg.style.color = "var(--coral)";
      msg.textContent = "New password and confirmation password do not match.";
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Updating Password & Dispatching Email...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Could not change password (${response.status})`);
      }

      const targetMail = data.recipientEmail || localStorage.getItem('userEmail') || 'your account email';
      msg.className = "message success";
      msg.style.color = "var(--green)";
      msg.style.fontWeight = "bold";
      msg.innerHTML = `✓ Password changed successfully! A security confirmation email was dispatched directly to <u>${targetMail}</u>.`;

      document.getElementById("changeCurrentPassword").value = "";
      document.getElementById("changeNewPassword").value = "";
      document.getElementById("changeConfirmPassword").value = "";

      updateNotifBadge();
      showToast("Password Updated Successfully! 🔐", `Your account password has been changed. A security confirmation email was sent directly to ${targetMail}.`, "success");

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

if (closeProfileModal && profileModal) {
  closeProfileModal.addEventListener("click", () => {
    profileModal.classList.add("hidden");
  });
}

if (profileModal) {
  profileModal.addEventListener("click", (e) => {
    if (e.target === profileModal) profileModal.classList.add("hidden");
  });
}

// Search & Validation Functions
function triggerBookingSearch() {
  const input = document.getElementById("bookingSearch");
  const container = document.getElementById("bookingSearchContainer");
  const errorEl = document.getElementById("bookingSearchValidationError");
  const errorText = document.getElementById("bookingSearchValidationText");
  const clearBtn = document.getElementById("clearBookingSearchBtn");
  const query = (input?.value || "").trim();

  if (!query) {
    if (container) {
      container.style.borderColor = "#dc2626";
      container.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.15)";
      container.style.animation = "shake 0.3s ease-in-out";
      setTimeout(() => { container.style.animation = ""; }, 350);
    }
    if (errorEl) {
      errorEl.style.display = "flex";
      if (errorText) errorText.textContent = "Please enter a search term before searching.";
    }
    input?.focus();
    return;
  }

  if (container) {
    container.style.borderColor = "";
    container.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";
  if (clearBtn) clearBtn.style.display = "inline-block";

  renderBookings();
}

function clearBookingSearch() {
  const input = document.getElementById("bookingSearch");
  const container = document.getElementById("bookingSearchContainer");
  const errorEl = document.getElementById("bookingSearchValidationError");
  const clearBtn = document.getElementById("clearBookingSearchBtn");

  if (input) input.value = "";
  if (container) {
    container.style.borderColor = "";
    container.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";
  if (clearBtn) clearBtn.style.display = "none";

  renderBookings();
  input?.focus();
}

// Search & Filter Listeners
const bookingSearchInput = document.getElementById("bookingSearch");
const bookingSearchBtn = document.getElementById("bookingSearchBtn");
const clearBookingSearchBtn = document.getElementById("clearBookingSearchBtn");

if (bookingSearchBtn) {
  bookingSearchBtn.addEventListener("click", triggerBookingSearch);
}

if (clearBookingSearchBtn) {
  clearBookingSearchBtn.addEventListener("click", clearBookingSearch);
}

if (bookingSearchInput) {
  bookingSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerBookingSearch();
    }
  });

  bookingSearchInput.addEventListener("input", () => {
    const val = (bookingSearchInput.value || "").trim();
    const container = document.getElementById("bookingSearchContainer");
    const errorEl = document.getElementById("bookingSearchValidationError");
    const clearBtn = document.getElementById("clearBookingSearchBtn");

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
    renderBookings();
  });
}

filter?.addEventListener("change", renderBookings);

const refreshBookingsBtn = document.getElementById("refreshBookings");
if (refreshBookingsBtn) {
  refreshBookingsBtn.addEventListener("click", async () => {
    refreshBookingsBtn.disabled = true;
    const origHtml = refreshBookingsBtn.innerHTML;
    refreshBookingsBtn.innerHTML = `<span style="display:inline-block; animation:spin 0.75s linear infinite;">↻</span> Refreshing...`;

    // Clear search validation error if present
    const errorEl = document.getElementById("bookingSearchValidationError");
    const container = document.getElementById("bookingSearchContainer");
    if (errorEl) errorEl.style.display = "none";
    if (container) {
      container.style.borderColor = "";
      container.style.boxShadow = "";
    }

    try {
      await loadBookings(true);
      showToast("Bookings Refreshed ↻", "Booking requests table reloaded with live records.", "success");
    } catch (err) {
      showToast("Refresh Failed", err.message || "Could not reload bookings.", "error");
    } finally {
      refreshBookingsBtn.disabled = false;
      refreshBookingsBtn.innerHTML = origHtml;
    }
  });
}

function handleSignOut() {
  localStorage.clear();
  window.location.href = "signIn_page.html";
}

document.getElementById("logoutButton")?.addEventListener("click", handleSignOut);
modalLogoutButton?.addEventListener("click", handleSignOut);

function broadcastBookingUpdate(action, id) {
  try {
    localStorage.setItem("nook_booking_sync", JSON.stringify({
      action: action,
      id: id,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

// ==========================================
// UC - 06: Dispute Resolution & Investigation Modal
// ==========================================
const disputeModal = document.getElementById("disputeModal");
const closeDisputeModalBtn = document.getElementById("closeDisputeModal");
const cancelDisputeModalBtn = document.getElementById("cancelDisputeModalBtn");
const disputeResolutionForm = document.getElementById("disputeResolutionForm");

function openDisputeModal(bookingId) {
  const item = bookings.find((b) => String(b.id) === String(bookingId));
  if (!item) {
    alert("Booking not found");
    return;
  }

  document.getElementById("disputeBookingId").value = item.id;
  document.getElementById("disputeModalCaseId").textContent = `#DSP-BK-${item.id}`;

  const currentBadge = document.getElementById("disputeModalCurrentBadge");
  if (currentBadge) {
    const status = item.disputeStatus || (item.isDisputed ? "OPEN" : "MEDIATION");
    currentBadge.textContent = status;
    if (status === "OPEN" || status === "MEDIATION") {
      currentBadge.style.background = "#ffedd5";
      currentBadge.style.color = "#c2410c";
    } else if (status === "RESOLVED") {
      currentBadge.style.background = "#ecfdf5";
      currentBadge.style.color = "#065f46";
    } else {
      currentBadge.style.background = "#fef2f2";
      currentBadge.style.color = "#b91c1c";
    }
  }

  const complainantLabel = item.disputeRaisedBy === "BUYER" 
    ? `${item.buyer} (Buyer)` 
    : (item.disputeRaisedBy === "SELLER" || item.disputeRaisedBy === "AGENT"
      ? `${item.owner} (${item.ownerType || 'Owner'})` 
      : `${item.buyer} ↔ ${item.owner}`);
  document.getElementById("disputeModalRaisedBy").textContent = complainantLabel;
  document.getElementById("disputeModalRaisedDate").textContent = item.disputeDate ? `Flagged on ${item.disputeDate}` : "Active Mediation";
  document.getElementById("disputeModalReasonCategory").textContent = (item.disputeReason || "Viewing Dispute / Resolution Review").replace(/_/g, " ");

  document.getElementById("disputeModalProperty").textContent = item.property;
  document.getElementById("disputeModalSchedule").textContent = `Viewing: ${item.date} ${item.time ? '· ' + item.time : ''}`;
  document.getElementById("disputeModalAdvanceAmount").textContent = `LKR ${item.advanceAmount.toLocaleString()}`;
  document.getElementById("disputeModalTxnRef").textContent = `Ref: ${item.txnRef}`;

  document.getElementById("disputeModalBuyerName").textContent = item.buyer;
  document.getElementById("disputeModalBuyerContact").textContent = `${item.buyerEmail} ${item.buyerPhone ? '· ' + item.buyerPhone : ''}`;

  document.getElementById("disputeModalOwnerName").textContent = `${item.owner} (${item.ownerType || 'Owner'})`;
  document.getElementById("disputeModalOwnerContact").textContent = item.ownerEmail || '—';

  document.getElementById("disputeModalStatement").textContent = item.disputeDetails || "Mediation investigation conducted by Booking Manager.";

  // Past resolution details box
  const pastBox = document.getElementById("disputeModalPastResolutionBox");
  if (item.disputeStatus === "RESOLVED" || item.disputeStatus === "ESCALATED_TO_ADMIN") {
    if (pastBox) {
      pastBox.classList.remove("hidden");
      document.getElementById("disputeModalPastDecision").textContent = (item.resolutionDecision || item.disputeStatus).replace(/_/g, " ");
      document.getElementById("disputeModalPastDate").textContent = item.resolutionDate || "—";
      document.getElementById("disputeModalPastNotes").textContent = `"${item.resolutionNotes || 'Resolution documented by manager.'}"`;
      document.getElementById("disputeModalPastManager").textContent = item.resolvedByManagerName ? `Authorized by: ${item.resolvedByManagerName}` : "";

      // If rescheduled, show dedicated alert box inside past resolution box
      let reschedPastEl = document.getElementById("disputeModalPastRescheduleAlert");
      if (item.resolutionDecision === "RESCHEDULE" || item.isRescheduled) {
        if (!reschedPastEl) {
          reschedPastEl = document.createElement("div");
          reschedPastEl.id = "disputeModalPastRescheduleAlert";
          reschedPastEl.style = "margin-top:8px; padding:8px 10px; background:#ede9fe; border:1px solid #c4b5fd; border-radius:6px; font-size:11px; color:#4c1d95; font-weight:600;";
          pastBox.appendChild(reschedPastEl);
        }
        reschedPastEl.innerHTML = `
          🔄 <strong>Mutual Reschedule Confirmed:</strong> New Viewing: <u>${item.rescheduledDate || item.date}</u> ${item.rescheduledTime || item.time ? '· ' + (item.rescheduledTime || item.time) : ''}
          ${item.originalViewingDate ? `<div style="font-size:9.5px; color:#6d28d9; margin-top:2px; font-weight:normal;">Original Slot: ${item.originalViewingDate} ${item.originalViewingTime ? '· ' + item.originalViewingTime : ''}</div>` : ''}
        `;
      } else if (reschedPastEl) {
        reschedPastEl.remove();
      }
    }
  } else {
    if (pastBox) {
      pastBox.classList.add("hidden");
      const reschedPastEl = document.getElementById("disputeModalPastRescheduleAlert");
      if (reschedPastEl) reschedPastEl.remove();
    }
  }

  // Reset form inputs
  const defaultRadio = document.querySelector('input[name="disputeDecisionRadio"][value="FULL_REFUND"]');
  if (defaultRadio) defaultRadio.checked = true;
  document.getElementById("disputeResolutionNotes").value = "";
  document.getElementById("disputeRescheduleGroup")?.classList.add("hidden");
  document.getElementById("disputeRefundAmountGroup")?.classList.add("hidden");
  const msg = document.getElementById("disputeModalMessage");
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }

  disputeModal?.classList.remove("hidden");
}

function hideDisputeModal() {
  disputeModal?.classList.add("hidden");
}

if (closeDisputeModalBtn) closeDisputeModalBtn.addEventListener("click", hideDisputeModal);
if (cancelDisputeModalBtn) cancelDisputeModalBtn.addEventListener("click", hideDisputeModal);
if (disputeModal) {
  disputeModal.addEventListener("click", (e) => {
    if (e.target === disputeModal) hideDisputeModal();
  });
}

// Preset chips injection
document.querySelectorAll(".dispute-preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const textarea = document.getElementById("disputeResolutionNotes");
    if (textarea) {
      textarea.value = btn.dataset.text || "";
      textarea.focus();
    }
  });
});

// Radio button change listener for conditional inputs
document.querySelectorAll('input[name="disputeDecisionRadio"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const val = e.target.value;
    const rescheduleGrp = document.getElementById("disputeRescheduleGroup");
    const refundGrp = document.getElementById("disputeRefundAmountGroup");

    if (rescheduleGrp) {
      rescheduleGrp.classList.toggle("hidden", val !== "RESCHEDULE");
    }
    if (refundGrp) {
      refundGrp.classList.toggle("hidden", val !== "PARTIAL_REFUND");
    }
  });
});

// Submit dispute resolution form
if (disputeResolutionForm) {
  disputeResolutionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("disputeBookingId").value;
    const decision = document.querySelector('input[name="disputeDecisionRadio"]:checked')?.value || "FULL_REFUND";
    const notes = document.getElementById("disputeResolutionNotes").value.trim();
    const submitBtn = document.getElementById("submitDisputeResolutionBtn");
    const msg = document.getElementById("disputeModalMessage");

    const payload = {
      decision: decision,
      resolutionNotes: notes
    };

    if (decision === "PARTIAL_REFUND") {
      const customAmt = Number(document.getElementById("disputeCustomRefund")?.value);
      if (customAmt > 0) payload.customRefundAmount = customAmt;
    } else if (decision === "RESCHEDULE") {
      const newDate = document.getElementById("disputeNewDate")?.value;
      const newTime = document.getElementById("disputeNewTime")?.value;
      if (!newDate) {
        showToast("Missing Date", "Please select a valid new date for the rescheduled viewing.", "error");
        if (msg) {
          msg.textContent = "Please select a valid new date for the rescheduled viewing.";
          msg.className = "message";
        }
        return;
      }
      payload.rescheduledDate = newDate;
      if (newTime) payload.rescheduledTime = newTime;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing Resolution...";
    }

    try {
      const response = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/${id}/resolve-dispute`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      if (handleAuthError(response)) return;

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Failed to record dispute resolution (${response.status})`);
      }

      broadcastBookingUpdate("DISPUTE_RESOLVED", id);
      showToast(
        "Dispute Documented & Resolved ⚖️",
        `Booking #${id} dispute resolved as ${decision.replace(/_/g, ' ')}. Dual notifications dispatched.`,
        "success"
      );

      hideDisputeModal();
      await loadBookings(true);
    } catch (err) {
      if (msg) {
        msg.className = "message";
        msg.style.color = "#dc2626";
        msg.textContent = "⚠️ " + err.message;
      }
      showToast("Resolution Failed", err.message, "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "⚖️ Record Resolution Decision →";
      }
    }
  });
}

// Quick Disputes Buttons Filter Integration
const statCardDisputes = document.getElementById("statCardDisputes");
if (statCardDisputes) {
  statCardDisputes.addEventListener("click", () => {
    if (filter) {
      filter.value = filter.value === "DISPUTED_OPEN" ? "ALL" : "DISPUTED_OPEN";
      renderBookings();
    }
  });
}

const quickDisputesBtn = document.getElementById("quickDisputesBtn");
if (quickDisputesBtn) {
  quickDisputesBtn.addEventListener("click", () => {
    if (filter) {
      filter.value = filter.value === "DISPUTED_OPEN" ? "ALL" : "DISPUTED_OPEN";
      renderBookings();
    }
  });
}

function updateCurrentDateDisplay() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const formatted = now.toLocaleDateString("en-US", options);

  const dateEl = document.getElementById("todayDate");
  if (dateEl) dateEl.textContent = formatted;

  const dayAbbr = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayNum = now.getDate();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cardDay = document.getElementById("dateCardDay");
  const cardNum = document.getElementById("dateCardNum");
  const cardMonthYear = document.getElementById("dateCardMonthYear");

  if (cardDay) cardDay.textContent = dayAbbr;
  if (cardNum) cardNum.textContent = dayNum;
  if (cardMonthYear) cardMonthYear.textContent = monthYear;
}

updateCurrentDateDisplay();
loadUserProfile();
loadBookings();
updateNotifBadge();

// Real-time synchronization: Poll bookings every 4s and listen for cross-tab events
setInterval(() => {
  if (!document.hidden) {
    loadBookings();
    updateNotifBadge();
  }
}, 4000);

window.addEventListener("storage", (e) => {
  if (e.key === "nook_booking_sync") {
    loadBookings();
    updateNotifBadge();
  }
});
window.addEventListener("focus", () => {
  loadBookings();
  updateNotifBadge();
});

