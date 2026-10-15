const API_BASE_URL = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";
const LISTINGS_ENDPOINT = "/api/listings";
const MY_LISTINGS_ENDPOINT = "/api/listings/my";
const USE_DEMO_DATA = false;

let listings = [];
const tableBody = document.getElementById("listingTableBody");
const searchInput = document.getElementById("listingSearch");
const statusFilter = document.getElementById("statusFilter");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("listingModal");
const listingForm = document.getElementById("listingForm");
const formMessage = document.getElementById("formMessage");

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAmenityIcon(name) {
  if (!name) return "✦";
  const s = String(name).toLowerCase();
  if (s.includes("pool") || s.includes("swim")) return "🏊";
  if (s.includes("gym") || s.includes("fit") || s.includes("workout")) return "🏋️";
  if (s.includes("park") || s.includes("garage")) return "🚗";
  if (s.includes("play") || s.includes("kids") || s.includes("child")) return "🛝";
  if (s.includes("security") || s.includes("guard") || s.includes("cctv")) return "🛡️";
  if (s.includes("lift") || s.includes("elevator")) return "🛗";
  if (s.includes("wifi") || s.includes("net")) return "📶";
  if (s.includes("view") || s.includes("balcony")) return "🌅";
  if (s.includes("garden") || s.includes("lawn") || s.includes("yard")) return "🌿";
  if (s.includes("pet")) return "🐾";
  if (s.includes("ac") || s.includes("air condition") || s.includes("cool")) return "❄️";
  if (s.includes("gen") || s.includes("power") || s.includes("electric")) return "⚡";
  if (s.includes("roof") || s.includes("terrace")) return "🏙️";
  if (s.includes("bbq") || s.includes("kitchen")) return "🍳";
  return "✦";
}

function parsePrice(value) {
  const str = String(value || "").trim();
  const isNegative = str.startsWith("-") || str.includes("-");
  const raw = str.toUpperCase().replace(/,/g, "");
  const number = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(number)) return 0;
  let finalVal = number;
  if (raw.includes("M")) finalVal = number * 1000000;
  else if (raw.includes("K")) finalVal = number * 1000;
  return isNegative ? -finalVal : finalVal;
}

function authHeaders(json = false) {
  const headers = { Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function showSuccessBanner(msg) {
  const existing = document.getElementById("nookGlobalSuccessBanner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "nookGlobalSuccessBanner";
  banner.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: #059669;
    color: white;
    padding: 13px 22px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 13px;
    z-index: 999999;
    box-shadow: 0 10px 30px rgba(0,0,0,0.18);
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    animation: fadeIn .3s ease;
  `;
  banner.innerHTML = `<span style="font-size:16px;">✓</span> <span>${msg}</span>`;
  document.body.appendChild(banner);
  setTimeout(() => {
    banner.style.opacity = "0";
    banner.style.transition = "opacity 0.3s ease";
    setTimeout(() => banner.remove(), 300);
  }, 4000);
}
window.showSuccessBanner = showSuccessBanner;

function value(item, keys, fallback = "—") {
  for (const key of keys) {
    if (item?.[key] !== undefined && item[key] !== null) return item[key];
  }
  return fallback;
}

function normalizeListing(item) {
  const rawStatus = String(value(item, ["status", "listingStatus"], "PENDING")).toUpperCase();
  const rawPrice = value(item, ["price", "askingPrice"], 0);
  return {
    id: value(item, ["id", "listingId"]),
    name: value(item, ["title", "name", "propertyName"], "Untitled apartment"),
    title: value(item, ["title", "name", "propertyName"], "Untitled apartment"),
    location: value(item, ["location", "address", "city"], "Location pending"),
    seller: value(item, ["sellerName", "ownerName", "seller"], "—"),
    price: value(item, ["price", "askingPrice"], "—"),
    rawPrice: typeof rawPrice === "number" ? rawPrice : Number(rawPrice) || 0,
    propertyType: value(item, ["propertyType"], "Apartment"),
    description: value(item, ["description"], ""),
    street: value(item, ["street"], ""),
    city: value(item, ["city"], ""),
    postalCode: value(item, ["postalCode"], ""),
    amenities: Array.isArray(item.amenities) ? item.amenities : [],
    ownerId: value(item, ["ownerId"], null),
    ownerType: value(item, ["ownerType"], "AGENT"),
    ownerName: value(item, ["ownerName", "sellerName"], ""),
    ownerEmail: value(item, ["ownerEmail"], ""),
    ownerPhone: value(item, ["ownerPhone"], ""),
    ownerLicenseNumber: value(item, ["ownerLicenseNumber"], ""),
    ownerRating: value(item, ["ownerRating"], null),
    ownerVerified: Boolean(item.ownerVerified),
    ownerPlan: value(item, ["ownerPlan"], "FREE"),
    inquiries: value(item, ["inquiries", "inquiryCount"], 0),
    status: rawStatus,
    documentRequestNote: value(item, ["documentRequestNote"], ""),
    rejectionReason: value(item, ["rejectionReason"], ""),
    documents: Array.isArray(item.documents) ? item.documents : [],
    availabilitySchedule: value(item, ["availabilitySchedule"], ""),
    updated: value(item, ["updatedAt", "createdAt", "submittedAt"], "Recently"),
    image: value(item, ["imageUrl", "coverImage"], "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80")
  };
}

function formatStatus(status) {
  return {
    PUBLISHED: "Published",
    PENDING: "Pending review",
    DOCUMENTS_REQUESTED: "Action Required: Docs Requested",
    DRAFT: "Draft",
    SOLD: "Sold",
    REJECTED: "Returned"
  }[status] || status;
}

function renderListings() {
  const query = (searchInput?.value || "").toLowerCase().trim();
  const status = statusFilter?.value || "ALL";
  const filtered = listings.filter((item) => (!query || `${item.name} ${item.location} ${item.seller}`.toLowerCase().includes(query)) && (status === "ALL" || item.status === status));

  tableBody.innerHTML = filtered.map((item) => `
    <tr>
      <td>
        <div class="property-cell">
          <img class="property-thumb" src="${item.image}" alt="${item.name}" />
          <div>
            ${item.name}
            <span class="subtext">${item.location}</span>
            ${item.status === "DOCUMENTS_REQUESTED" && item.documentRequestNote ? `<span style="display:block; font-size:10px; color:#b45309; font-weight:700; margin-top:3px; background:#fffbeb; padding:2px 6px; border-radius:4px; border:1px solid #fde68a;">⚠️ Officer: ${item.documentRequestNote}</span>` : ''}
          </div>
        </div>
      </td>
      <td>${item.seller}</td>
      <td>${typeof item.price === "number" ? `LKR ${item.price.toLocaleString()}` : item.price}</td>
      <td>${item.inquiries}</td>
      <td>
        <span class="status ${item.status}" style="${item.status === 'DOCUMENTS_REQUESTED' ? 'background:#fef3c7; color:#b45309; font-weight:bold; border:1px solid #fde68a;' : ''}">
          ${formatStatus(item.status)}
        </span>
      </td>
      <td>${item.updated}</td>
      <td>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <button class="btn-view-details" data-id="${item.id}" style="padding:4px 9px; font-size:10px; font-weight:bold; background:#f1f5f9; color:#102a2c; border:1px solid #cbd5e1; border-radius:6px; cursor:pointer;" title="View apartment details">🔍 Details</button>
          ${item.status === "PUBLISHED" ? `<button class="btn-availability" data-id="${item.id}" style="padding:4px 9px; font-size:10px; font-weight:bold; background:#f0fdfa; color:#0f766e; border:1px solid #99f6e4; border-radius:6px; cursor:pointer;" title="Configure Viewing Availability">🗓️ Availability</button>` : ''}
          ${item.status === "DOCUMENTS_REQUESTED" ? `<button class="btn-upload-more-docs" data-id="${item.id}" data-name="${item.name}" data-note="${item.documentRequestNote || ''}" style="padding:4px 9px; font-size:10px; font-weight:bold; background:#fffbeb; color:#b45309; border:1px solid #fde68a; border-radius:6px; cursor:pointer;" title="Upload the requested documents">📤 Upload Docs</button>` : ''}
          ${item.status === "PUBLISHED" ? `<button class="btn-mark-sold" data-id="${item.id}" style="padding:4px 9px; font-size:10px; font-weight:bold; background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; border-radius:6px; cursor:pointer;" title="Mark as Sold">🏠 Mark as Sold</button>` : ''}
          <button class="row-menu" data-id="${item.id}">•••</button>
        </div>
      </td>
    </tr>
  `).join("");

  tableBody.querySelectorAll(".btn-view-details").forEach((btn) => {
    btn.addEventListener("click", () => {
      openApartmentDetailsModal(btn.dataset.id);
    });
  });

  tableBody.querySelectorAll(".btn-availability").forEach((btn) => {
    btn.addEventListener("click", () => {
      openAvailabilityModal(btn.dataset.id);
    });
  });

  tableBody.querySelectorAll(".btn-upload-more-docs").forEach((btn) => {
    btn.addEventListener("click", () => {
      openUploadMoreDocsModal(btn.dataset.id, btn.dataset.name, btn.dataset.note);
    });
  });

  tableBody.querySelectorAll(".btn-mark-sold").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const listingId = btn.dataset.id;
      if (!confirm("Are you sure you want to mark this property as SOLD?")) return;
      btn.disabled = true;
      btn.textContent = "Updating...";
      try {
        const res = await fetch(`${API_BASE_URL}/api/listings/${listingId}/sold`, {
          method: "PATCH",
          headers: authHeaders()
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || "Failed to mark property as sold");
        }
        showSuccessBanner("Apartment marked as SOLD! Your available listing quota has been updated.");
        await loadListings();
        if (typeof syncSubscriptionStatus === "function") syncSubscriptionStatus();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = "🏠 Mark as Sold";
      }
    });
  });

  emptyState.classList.toggle("hidden", filtered.length > 0);
  const activeCountEl = document.getElementById("activeCount");
  if (activeCountEl) activeCountEl.textContent = listings.filter((item) => item.status === "PUBLISHED").length;
  const navListingCountEl = document.getElementById("navListingCount");
  if (navListingCountEl) navListingCountEl.textContent = listings.length;
  const summaryEl = document.getElementById("listingSummaryText");
  if (summaryEl) summaryEl.innerHTML = `<b>${listings.length} listings</b> in portfolio`;

  // Update agent quota bar fill
  const agentLimit = (typeof currentSubscriptionState !== "undefined" && currentSubscriptionState.listingLimit) ? currentSubscriptionState.listingLimit : 2;
  const agentUsed = listings.filter(l => l.status !== "WITHDRAWN").length;
  const quotaBar = document.getElementById("quotaBarFill");
  const quotaUsage = document.getElementById("quotaUsageText");
  const quotaRemaining = document.getElementById("quotaSlotsRemainingBadge");

  if (quotaBar) {
    const isElite = typeof currentSubscriptionState !== "undefined" && currentSubscriptionState.plan === "ELITE";
    if (isElite) {
      quotaBar.style.width = "100%";
      quotaBar.style.background = "linear-gradient(90deg, #10b981, #059669)";
    } else {
      const pct = Math.min(100, Math.round((agentUsed / agentLimit) * 100));
      quotaBar.style.width = `${pct}%`;
      if (pct >= 100) {
        quotaBar.style.background = "linear-gradient(90deg, #ef4444, #dc2626)";
      } else if (pct >= 75) {
        quotaBar.style.background = "linear-gradient(90deg, #f59e0b, #d97706)";
      } else {
        quotaBar.style.background = "linear-gradient(90deg, #10b981, #059669)";
      }
    }
  }

  if (quotaUsage) {
    const isElite = typeof currentSubscriptionState !== "undefined" && currentSubscriptionState.plan === "ELITE";
    if (!isElite) {
      quotaUsage.innerHTML = `Active listings: <strong>${agentUsed} / ${agentLimit}</strong> slots used`;
    }
  }

  if (quotaRemaining) {
    const isElite = typeof currentSubscriptionState !== "undefined" && currentSubscriptionState.plan === "ELITE";
    if (!isElite) {
      const rem = Math.max(0, agentLimit - agentUsed);
      quotaRemaining.textContent = `${rem} slot${rem === 1 ? '' : 's'} remaining`;
      quotaRemaining.style.background = rem > 0 ? "#f1f5f9" : "#fff1f2";
      quotaRemaining.style.color = rem > 0 ? "#475569" : "#be123c";
    }
  }
}

async function loadListings() {
  if (USE_DEMO_DATA) return renderListings();
  try {
    const response = await fetch(`${API_BASE_URL}${MY_LISTINGS_ENDPOINT}`, { headers: authHeaders() });
    if (!response.ok) {
      emptyState.classList.remove("hidden");
      emptyState.textContent = "No listings found in your portfolio.";
      return;
    }
    const payload = await response.json();
    listings = (Array.isArray(payload) ? payload : value(payload, ["content", "items", "listings"], [])).map(normalizeListing);
    renderListings();
  } catch (error) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = "No listings found. Click '+ Add listing' to create your first listing.";
  }
}

function openModal() {
  if (typeof checkListingQuotaBeforeAdd === "function" && !checkListingQuotaBeforeAdd()) {
    return;
  }
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  loadListingAmenities();
}

async function loadListingAmenities() {
  const container = document.getElementById("listingAmenityCheckboxes");
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/amenities`);
    if (!res.ok) throw new Error("Failed to load amenities");
    const amenities = await res.json();
    if (!amenities || amenities.length === 0) {
      container.innerHTML = `<span style="font-size:11px; color:#94a3b8;">No amenities configured in catalog yet.</span>`;
      return;
    }
    container.innerHTML = amenities.map(a => `
      <label style="display:inline-flex; align-items:center; gap:6px; background:white; border:1px solid #cbd5e1; padding:5px 11px; border-radius:20px; font-size:11px; cursor:pointer; font-weight:500; color:#102a2c; user-select:none;">
        <input type="checkbox" class="listing-amenity-cb" value="${a.id}" style="accent-color:#e8785a; width:auto; margin:0;" />
        <span>${escapeHtml(a.name)}</span>
      </label>
    `).join("");
  } catch (err) {
    container.innerHTML = `<span style="font-size:11px; color:#94a3b8;">Standard apartment amenities will apply.</span>`;
  }
}

let stagedDocumentsMap = {};

function getDocTypeInfo(type) {
  switch (String(type).toUpperCase()) {
    case "TITLE_DEED":
      return { label: "Deed of Transfer / Title Deed", icon: "📜", color: "#1e3a8a", bg: "#dbeafe", required: true };
    case "COC":
      return { label: "Certificate of Conformity (COC)", icon: "🏛️", color: "#065f46", bg: "#d1fae5", required: false };
    case "BUILDING_PLAN":
      return { label: "Approved Building / Floor Plan", icon: "📐", color: "#7c2d12", bg: "#ffedd5", required: false };
    case "RATES_TAX":
      return { label: "Local Authority Assessment & Rates", icon: "🧾", color: "#4c1d95", bg: "#ede9fe", required: false };
    case "SELLER_NIC":
      return { label: "Seller National Identity (NIC)", icon: "🆔", color: "#831843", bg: "#fce7f3", required: true };
    default:
      return { label: "Apartment Document", icon: "📄", color: "#1f2937", bg: "#f3f4f6", required: false };
  }
}

function updateDocumentUI(docType) {
  const doc = stagedDocumentsMap[docType];
  const boxEl = document.getElementById(`docBox_${docType}`);
  const statusEl = document.getElementById(`docStatus_${docType}`);
  const labelEl = document.getElementById(`docLabel_${docType}`);
  const removeBtn = boxEl ? boxEl.querySelector(".doc-remove-btn") : null;

  if (doc) {
    if (boxEl) {
      boxEl.style.borderColor = "#a7f3d0";
      boxEl.style.background = "#f0fdf4";
    }
    if (statusEl) {
      statusEl.innerHTML = `
        <span style="color:#047857; font-weight:700;">✓ Attached:</span> 
        <span style="color:#1e293b; font-weight:600;" title="${doc.fileName}">${doc.fileName}</span>
      `;
    }
    if (labelEl) {
      labelEl.innerHTML = `<span>🔄 Replace</span><input type="file" class="doc-box-input" data-doctype="${docType}" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style="display:none;" />`;
      const newInput = labelEl.querySelector("input");
      if (newInput) newInput.addEventListener("change", handleDocBoxFileChange);
    }
    if (removeBtn) removeBtn.classList.remove("hidden");
  } else {
    if (boxEl) {
      boxEl.style.borderColor = "#ded8cc";
      boxEl.style.background = "white";
    }
    if (statusEl) {
      statusEl.textContent = "No file attached yet";
      statusEl.style.color = "#94a3b8";
    }
    if (labelEl) {
      labelEl.innerHTML = `<span>📎 Attach</span><input type="file" class="doc-box-input" data-doctype="${docType}" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style="display:none;" />`;
      const newInput = labelEl.querySelector("input");
      if (newInput) newInput.addEventListener("change", handleDocBoxFileChange);
    }
    if (removeBtn) removeBtn.classList.add("hidden");
  }

  checkDocumentValidationAndToggleSubmit();
}

function checkDocumentValidationAndToggleSubmit() {
  const submitBtn = document.getElementById("submitListingBtn");
  const validationStatus = document.getElementById("docValidationStatus");
  const validationText = document.getElementById("docValidationStatusText");

  const hasTitleDeed = !!stagedDocumentsMap["TITLE_DEED"];
  const hasSellerNic = !!stagedDocumentsMap["SELLER_NIC"];
  const totalAttached = Object.keys(stagedDocumentsMap).length;

  if (!hasTitleDeed || !hasSellerNic) {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.55";
      submitBtn.style.cursor = "not-allowed";
      submitBtn.title = "Please attach mandatory documents (Title Deed & Seller NIC) to enable submission.";
    }
    if (validationStatus && validationText) {
      validationStatus.style.background = "#fef2f2";
      validationStatus.style.borderColor = "#fecaca";
      validationStatus.style.color = "#b91c1c";
      const missing = [];
      if (!hasTitleDeed) missing.push("Title Deed");
      if (!hasSellerNic) missing.push("Seller NIC/Passport");
      validationText.textContent = `Mandatory documents missing (${missing.join(" & ")}). Please attach them to enable submission.`;
    }
  } else {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
      submitBtn.title = "Submit listing and documents for verification";
    }
    if (validationStatus && validationText) {
      validationStatus.style.background = "#f0fdf4";
      validationStatus.style.borderColor = "#a7f3d0";
      validationStatus.style.color = "#047857";
      validationText.textContent = `✅ Ready for verification: Mandatory documents attached (Total ${totalAttached} document${totalAttached === 1 ? '' : 's'} included).`;
    }
  }
}

async function handleDocBoxFileChange(e) {
  const input = e.target;
  const file = input.files?.[0];
  if (!file) return;

  const docType = input.dataset.doctype || input.closest(".doc-box")?.id?.replace("docBox_", "") || "OTHER";
  const token = localStorage.getItem("jwtToken");

  if (!token) {
    if (formMessage) {
      formMessage.className = "message error";
      formMessage.style.color = "#dc2626";
      formMessage.innerHTML = "Authentication required: Please <a href='signIn_page.html' style='color:#e8785a; font-weight:bold;'>sign in as an Agent</a> to upload documents.";
    }
    input.value = "";
    return;
  }

  const docUploadProgress = document.getElementById("docUploadProgress");
  const docUploadProgressText = document.getElementById("docUploadProgressText");

  if (docUploadProgress) {
    docUploadProgress.classList.remove("hidden");
    if (docUploadProgressText) {
      docUploadProgressText.textContent = `Uploading "${file.name}" to verification server... ⏳`;
    }
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", docType);

  try {
    const res = await fetch(`${API_BASE_URL}/api/listings/upload-document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (res.status === 403) {
      throw new Error("Access Denied (403 Forbidden): You must be signed in with an Agent or Seller account to upload verification documents.");
    }
    if (res.status === 401) {
      throw new Error("Session expired (401). Please sign in again.");
    }
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || errJson.error || `Upload failed with status ${res.status}`);
    }

    const savedDoc = await res.json();
    stagedDocumentsMap[docType] = {
      documentType: savedDoc.documentType || docType,
      fileName: savedDoc.fileName || file.name,
      fileUrl: savedDoc.fileUrl
    };

    updateDocumentUI(docType);

    if (formMessage) {
      formMessage.className = "message success";
      formMessage.style.color = "#059669";
      formMessage.textContent = `✓ Document "${savedDoc.fileName || file.name}" uploaded successfully.`;
    }
  } catch (err) {
    if (formMessage) {
      formMessage.className = "message error";
      formMessage.style.color = "#dc2626";
      formMessage.textContent = err.message;
    }
  } finally {
    if (docUploadProgress) docUploadProgress.classList.add("hidden");
    input.value = "";
  }
}

// Apartment Image Upload & Preview Handler
const DEFAULT_APARTMENT_PREVIEW = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=160&q=80";

function updateImagePreview(url, isCustom) {
  const previewImg = document.getElementById("propertyImagePreview");
  const badge = document.getElementById("imageStatusBadge");
  const clearBtn = document.getElementById("clearImageBtn");
  const hint = document.getElementById("imagePreviewHint");

  if (!previewImg) return;

  if (url && url.trim()) {
    previewImg.src = url.trim();
    if (badge) {
      badge.textContent = isCustom ? "Custom Photo Active" : "URL Preview Active";
      badge.style.color = "#047857";
      badge.style.background = "#ecfdf5";
      badge.style.borderColor = "#a7f3d0";
    }
    if (clearBtn) clearBtn.style.display = "inline";
    if (hint) hint.textContent = "Apartment cover photo loaded successfully.";
  } else {
    previewImg.src = DEFAULT_APARTMENT_PREVIEW;
    if (badge) {
      badge.textContent = "Default Preview";
      badge.style.color = "#047857";
      badge.style.background = "#ecfdf5";
      badge.style.borderColor = "#a7f3d0";
    }
    if (clearBtn) clearBtn.style.display = "none";
    if (hint) hint.textContent = "Default modern apartment image active.";
  }
}

function initListingModalUploads() {
  document.querySelectorAll(".doc-box-input").forEach(input => {
    input.addEventListener("change", handleDocBoxFileChange);
  });
  document.querySelectorAll(".doc-remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const docType = btn.dataset.doctype;
      delete stagedDocumentsMap[docType];
      updateDocumentUI(docType);
    });
  });

  const propertyImageUrlInput = document.getElementById("propertyImageUrl");
  const propertyImageFileInput = document.getElementById("propertyImageFileInput");
  const clearImageBtn = document.getElementById("clearImageBtn");

  propertyImageUrlInput?.addEventListener("input", (e) => {
    updateImagePreview(e.target.value.trim(), false);
  });

  clearImageBtn?.addEventListener("click", () => {
    if (propertyImageUrlInput) propertyImageUrlInput.value = "";
    if (propertyImageFileInput) propertyImageFileInput.value = "";
    updateImagePreview("", false);
  });

  propertyImageFileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Authentication required: Please sign in to upload images.");
      propertyImageFileInput.value = "";
      return;
    }

    const imageUploadProgress = document.getElementById("imageUploadProgress");
    const imageUploadProgressText = document.getElementById("imageUploadProgressText");

    if (imageUploadProgress) {
      imageUploadProgress.classList.remove("hidden");
      if (imageUploadProgressText) imageUploadProgressText.textContent = `Uploading "${file.name}" to server... ⏳`;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/listings/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Image upload failed (${res.status})`);
      }

      const data = await res.json();
      const uploadedUrl = data.imageUrl;
      if (propertyImageUrlInput) propertyImageUrlInput.value = uploadedUrl;
      updateImagePreview(uploadedUrl, true);
      if (formMessage) {
        formMessage.className = "message success";
        formMessage.style.color = "#059669";
        formMessage.textContent = `✓ Photo "${file.name}" uploaded successfully.`;
      }
    } catch (err) {
      alert(`Could not upload photo: ${err.message}`);
    } finally {
      if (imageUploadProgress) imageUploadProgress.classList.add("hidden");
      propertyImageFileInput.value = "";
    }
  });

  checkDocumentValidationAndToggleSubmit();
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  listingForm.reset();
  formMessage.textContent = "";
  stagedDocumentsMap = {};
  ["TITLE_DEED", "COC", "BUILDING_PLAN", "RATES_TAX", "SELLER_NIC"].forEach(dt => updateDocumentUI(dt));
  updateImagePreview("", false);
}

function openSubmissionSuccessModal(listing, docs) {
  const modalEl = document.getElementById("submissionSuccessModal");
  if (!modalEl) return;

  const titleEl = document.getElementById("successModalPropertyTitle");
  const locEl = document.getElementById("successModalPropertyLocation");
  const priceEl = document.getElementById("successModalPropertyPrice");
  const docsListEl = document.getElementById("successModalDocumentsList");

  if (titleEl) titleEl.textContent = listing.title || "Apartment Listing";
  if (locEl) {
    const street = listing.street || listing.address?.street || "";
    const city = listing.city || listing.address?.city || "";
    locEl.textContent = [street, city].filter(Boolean).join(", ") || "Location provided";
  }
  if (priceEl) {
    const rawPrice = Number(listing.price || 0);
    priceEl.textContent = `LKR ${rawPrice.toLocaleString()}`;
  }

  if (docsListEl) {
    if (!docs || docs.length === 0) {
      docsListEl.innerHTML = `<span style="font-size:11px; color:#7a8681;">No legal documents attached</span>`;
    } else {
      docsListEl.innerHTML = docs.map(doc => {
        const info = getDocTypeInfo(doc.documentType);
        return `
          <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:10px; background:${info.bg}; color:${info.color}; font-size:10px; font-weight:700; border:1px solid rgba(0,0,0,0.06);">
            <span>${info.icon}</span>
            <span>${info.label}: ${doc.fileName}</span>
          </span>
        `;
      }).join("");
    }
  }

  modalEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeSubmissionSuccessModal() {
  const modalEl = document.getElementById("submissionSuccessModal");
  if (modalEl) modalEl.classList.add("hidden");
  document.body.style.overflow = "auto";
  const listingsSection = document.getElementById("listings");
  if (listingsSection) {
    listingsSection.scrollIntoView({ behavior: "smooth" });
  }
}

document.getElementById("closeSubmissionSuccessModalBtn")?.addEventListener("click", closeSubmissionSuccessModal);

listingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const street = document.getElementById("propertyStreet").value.trim();
  const city = document.getElementById("propertyCity").value.trim();
  const postalCode = document.getElementById("propertyPostalCode").value.trim();
  const priceInput = document.getElementById("propertyPrice");
  const price = parsePrice(priceInput ? priceInput.value : "");
  const submitBtn = document.getElementById("submitListingBtn");

  if (isNaN(price) || price <= 0) {
    formMessage.className = "message error";
    formMessage.style.color = "#dc2626";
    formMessage.textContent = "Validation Error: Price must be greater than 0. Zero (0) and negative values are strictly not allowed.";
    if (priceInput) {
      priceInput.style.borderColor = "#dc2626";
      priceInput.focus();
    }
    return;
  } else if (priceInput) {
    priceInput.style.borderColor = "#ded8cc";
  }

  const stagedDocsArray = Object.values(stagedDocumentsMap);
  if (!stagedDocumentsMap["TITLE_DEED"] || !stagedDocumentsMap["SELLER_NIC"]) {
    formMessage.className = "message error";
    formMessage.style.color = "#dc2626";
    formMessage.textContent = "Mandatory Documents Required: Please attach your Title Deed and Seller NIC/Passport before submitting for verification.";
    return;
  }

  const token = localStorage.getItem("jwtToken");
  if (!token) {
    formMessage.className = "message error";
    formMessage.style.color = "#dc2626";
    formMessage.innerHTML = "Authentication Error: You are not signed in. Please <a href='signIn_page.html' style='color:#e8785a; font-weight:bold;'>sign in as an Agent</a> to submit a listing.";
    return;
  }

  const imageUrl = document.getElementById("propertyImageUrl")?.value?.trim() || null;

  const requestBody = {
    title: document.getElementById("propertyName").value.trim(),
    description: document.getElementById("propertyDescription").value.trim() || "Apartment listing submitted for verification.",
    price: price,
    street,
    city,
    postalCode,
    propertyType: document.getElementById("propertyType").value,
    imageUrl: imageUrl,
    floorPlanUrl: null,
    amenityIds: Array.from(document.querySelectorAll("#listingAmenityCheckboxes input.listing-amenity-cb:checked"))
      .map(cb => Number(cb.value))
      .filter(id => !isNaN(id) && id > 0),
    documents: stagedDocsArray
  };

  const originalBtnText = submitBtn ? submitBtn.innerHTML : "Submit for Verification →";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Submitting for Verification... ⏳";
  }

  try {
    const response = await fetch(`${API_BASE_URL}${LISTINGS_ENDPOINT}`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(requestBody)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Access Denied (403 Forbidden): Only registered Agents and Sellers can submit apartment listings. Please check your account role.");
      } else if (response.status === 401) {
        throw new Error("Session expired (401). Please sign in again.");
      }
      throw new Error(data.message || data.error || `Could not submit listing (${response.status}).`);
    }

    // Capture submitted data before reset
    const submittedDocs = [...stagedDocsArray];
    const createdListing = data;

    // Reset form and staged documents
    closeModal();

    await loadListings();
    if (typeof syncSubscriptionStatus === "function") syncSubscriptionStatus();

    // Show the gorgeous confirmation modal!
    openSubmissionSuccessModal(createdListing, submittedDocs);

  } catch (error) {
    formMessage.className = "message error";
    formMessage.style.color = "#dc2626";
    if (error.message.includes("quota exceeded") || error.message.includes("Quota")) {
      formMessage.innerHTML = `${error.message}<br><button type="button" onclick="closeModal(); openPaddlePricingModal();" class="btn-quota-upgrade" style="margin-top:8px; display:inline-block;">⚡ Upgrade Subscription via Paddle</button>`;
    } else if (error.message.includes("Access Denied (403") || error.message.includes("Forbidden")) {
      formMessage.innerHTML = `${error.message}<br><a href="signIn_page.html" class="primary-button" style="margin-top:8px; display:inline-block; background:#e8785a; color:white; padding:6px 14px; border-radius:6px; font-weight:bold; text-decoration:none;">Sign In as Agent →</a>`;
    } else {
      formMessage.textContent = error.message;
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
});

// Upload More Documents Modal Logic for Agents
function openUploadMoreDocsModal(id, title, note) {
  document.getElementById("moreDocsListingId").value = id;
  document.getElementById("moreDocsListingTitle").textContent = `Upload Documents: ${title}`;
  document.getElementById("moreDocsOfficerNote").textContent = note ? `Officer Note: ${note}` : "Please attach the requested legal documents.";
  document.getElementById("moreDocsMessage").textContent = "";
  document.getElementById("moreDocsFileInput").value = "";
  document.getElementById("uploadMoreDocsModal").classList.remove("hidden");
}

function closeUploadMoreDocsModal() {
  document.getElementById("uploadMoreDocsModal").classList.add("hidden");
}

document.getElementById("closeUploadMoreDocsModal")?.addEventListener("click", closeUploadMoreDocsModal);
document.getElementById("cancelUploadMoreDocsBtn")?.addEventListener("click", closeUploadMoreDocsModal);

document.getElementById("uploadMoreDocsForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const listingId = document.getElementById("moreDocsListingId").value;
  const docType = document.getElementById("moreDocsTypeSelect").value;
  const fileInput = document.getElementById("moreDocsFileInput");
  const file = fileInput.files?.[0];
  const msgEl = document.getElementById("moreDocsMessage");
  const submitBtn = document.getElementById("submitMoreDocsBtn");

  if (!file) {
    msgEl.className = "message error";
    msgEl.textContent = "Please select a file to upload.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Uploading...";
  msgEl.textContent = "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", docType);

  try {
    const res = await fetch(`${API_BASE_URL}/api/listings/${listingId}/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}` },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to upload document");
    }

    msgEl.className = "message success";
    msgEl.textContent = "Documents successfully submitted! Listing returned to verification officer review.";
    if (typeof showSuccessBanner === "function") {
      showSuccessBanner("Documents uploaded! Verification officer has been notified to re-inspect your listing.");
    }
    await loadListings();
    setTimeout(closeUploadMoreDocsModal, 1200);
  } catch (err) {
    msgEl.className = "message error";
    msgEl.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Upload & Resubmit →";
  }
});

document.getElementById("propertyPrice")?.addEventListener("input", (e) => {
  const p = parsePrice(e.target.value);
  if (e.target.value.trim() !== "" && (isNaN(p) || p <= 0)) {
    e.target.style.borderColor = "#dc2626";
    formMessage.className = "message error";
    formMessage.style.color = "#dc2626";
    formMessage.textContent = "Price must be greater than 0. Negative numbers and 0 are not allowed.";
  } else {
    e.target.style.borderColor = "#ded8cc";
    formMessage.textContent = "";
  }
});

document.getElementById("openAddListing")?.addEventListener("click", openModal);

const refreshListingsBtn = document.getElementById("refreshListings");
if (refreshListingsBtn) {
  refreshListingsBtn.addEventListener("click", async () => {
    refreshListingsBtn.disabled = true;
    const origText = refreshListingsBtn.innerHTML;
    refreshListingsBtn.innerHTML = "↻ Refreshing...";
    try {
      await Promise.all([
        loadListings(),
        typeof checkSubscriptionStatus === "function" ? checkSubscriptionStatus() : Promise.resolve()
      ]);
      showToast("Listings Refreshed ↻", "Your agent portfolio and listing slots have been updated.", "success");
    } catch (e) {
      showToast("Refresh Notice", "Updated local portfolio data.", "info");
    } finally {
      refreshListingsBtn.disabled = false;
      refreshListingsBtn.innerHTML = origText;
    }
  });
}

document.getElementById("closeListingModal")?.addEventListener("click", closeModal);
document.getElementById("cancelListing")?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.clientX >= modal.clientWidth || event.clientY >= modal.clientHeight) {
    return;
  }
  if (event.target === modal) closeModal();
});

const searchBtn = document.getElementById("searchBtn");
const searchContainer = document.getElementById("searchContainer");
const searchValidationError = document.getElementById("searchValidationError");
const searchValidationText = document.getElementById("searchValidationText");
const clearSearchBtn = document.getElementById("clearSearchBtn");

function triggerSearch() {
  const query = (searchInput?.value || "").trim();
  if (!query) {
    if (searchContainer) {
      searchContainer.style.borderColor = "#dc2626";
      searchContainer.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.15)";
    }
    if (searchValidationError) {
      searchValidationError.style.display = "flex";
      if (searchValidationText) {
        searchValidationText.textContent = "Please enter a search term (e.g. property name or city) before searching.";
      }
    }
    searchInput?.focus();
    return;
  }

  // Clear validation errors and perform search
  if (searchContainer) {
    searchContainer.style.borderColor = "";
    searchContainer.style.boxShadow = "";
  }
  if (searchValidationError) searchValidationError.style.display = "none";
  if (clearSearchBtn) clearSearchBtn.style.display = "inline-block";

  renderListings();
}

searchBtn?.addEventListener("click", triggerSearch);

searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    triggerSearch();
  }
});

searchInput?.addEventListener("input", () => {
  const val = (searchInput.value || "").trim();
  if (val) {
    if (searchContainer) {
      searchContainer.style.borderColor = "";
      searchContainer.style.boxShadow = "";
    }
    if (searchValidationError) searchValidationError.style.display = "none";
    if (clearSearchBtn) clearSearchBtn.style.display = "inline-block";
  } else {
    if (clearSearchBtn) clearSearchBtn.style.display = "none";
  }
  renderListings();
});

clearSearchBtn?.addEventListener("click", () => {
  if (searchInput) searchInput.value = "";
  if (clearSearchBtn) clearSearchBtn.style.display = "none";
  if (searchContainer) {
    searchContainer.style.borderColor = "";
    searchContainer.style.boxShadow = "";
  }
  if (searchValidationError) searchValidationError.style.display = "none";
  renderListings();
  searchInput?.focus();
});

statusFilter?.addEventListener("change", renderListings);

// Dynamic Profile Details
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
const initialAgentDateEl = document.getElementById("todayDate");
if (initialAgentDateEl) initialAgentDateEl.textContent = formatDate();

function updateProfileUI(profile) {
  const firstName = profile.firstName || "there";
  const lastName = profile.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || profile.email || "Real Estate Agent";
  const initials = ((firstName[0] || "") + (lastName[0] || (firstName[1] || ""))).toUpperCase() || "A";
  const licenseNumber = profile.licenseNumber || localStorage.getItem("licenseNumber") || "";

  const dateEl = document.getElementById("todayDate");
  if (dateEl) dateEl.textContent = formatDate();

  const greetingEl = document.getElementById("greetingHeading");
  if (greetingEl) greetingEl.innerHTML = `${getGreeting()}, <em>${firstName}.</em>`;

  const fullNameEl = document.getElementById("userFullName");
  const isVerified = Boolean(profile.verified);
  if (fullNameEl) {
    const badgeHtml = isVerified
      ? `<span id="verifiedBadge" class="badge-verified-agent" title="Official Verified Real Estate Agent">✓ Verified Agent</span>`
      : `<span id="verifiedBadge" class="badge-unverified" style="cursor:pointer;" onclick="window.openPaddleModal && window.openPaddleModal()" title="Upgrade to Pro or Elite to get Verified Agent badge">⚡ Unverified</span>`;
    fullNameEl.innerHTML = `${fullName} ${badgeHtml}`;
  }

  const profilePlanDesc = document.getElementById("profilePlanDesc");
  if (profilePlanDesc) {
    const plan = profile.subscriptionPlan || "FREE";
    const limit = profile.listingLimit || (plan === "PRO" ? 10 : (plan === "ELITE" ? 1000 : 2));
    const cycle = (profile.billingCycle || "MONTHLY").toLowerCase();
    profilePlanDesc.textContent = `${plan} Plan (${cycle}) · ${plan === 'ELITE' ? 'Unlimited' : 'Max ' + limit} active listings`;
  }

  const avatarEl = document.getElementById("userAvatar");
  if (avatarEl) avatarEl.textContent = initials;

  const roleEl = document.getElementById("userRoleBadge");
  if (roleEl) roleEl.textContent = licenseNumber ? `Lic: ${licenseNumber}` : "Property agent";

  const licenseStatusEl = document.getElementById("agentLicenseStatus");
  if (licenseStatusEl) {
    const plan = profile.subscriptionPlan || "FREE";
    licenseStatusEl.textContent = plan === "ELITE" ? "Elite Broker" : (plan === "PRO" ? "Pro Agent" : (isVerified ? "Verified" : "Unverified (Free)"));
  }

  const licenseSubEl = document.getElementById("agentLicenseSub");
  if (licenseSubEl) {
    licenseSubEl.textContent = isVerified ? (licenseNumber ? `License: ${licenseNumber}` : "Verified Agent") : "Upgrade to Pro/Elite to verify";
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

  // Modal elements
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
  const editLic = document.getElementById("editLicense");
  if (editLic) editLic.value = licenseNumber || "";

  const targetEmailEl = document.getElementById("changePasswordTargetEmail");
  if (targetEmailEl) {
    targetEmailEl.textContent = profile.email || localStorage.getItem("userEmail") || "your active account email";
  }
}

async function loadUserProfile() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    window.location.href = "signIn_page.html";
    return;
  }

  const cached = {
    firstName: localStorage.getItem("userFirstName"),
    lastName: localStorage.getItem("userLastName"),
    email: localStorage.getItem("userEmail"),
    phone: localStorage.getItem("userPhone"),
    role: localStorage.getItem("userRole"),
    licenseNumber: localStorage.getItem("licenseNumber")
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
      if (data.licenseNumber) localStorage.setItem("licenseNumber", data.licenseNumber);
      updateProfileUI(data);
    } else if (response.status === 401) {
      console.warn("Unauthorized profile access, keeping existing session intact.");
    }
  } catch (error) {
    console.warn("Could not sync profile from server:", error);
  }
}

// Profile Modal Tabs (Personal Info vs Change Password)
const tabAgentProfileInfo = document.getElementById("tabAgentProfileInfo");
const tabAgentPassword = document.getElementById("tabAgentPassword");
const tabAgentContentProfile = document.getElementById("tabAgentContentProfile");
const tabAgentContentPassword = document.getElementById("tabAgentContentPassword");

if (tabAgentProfileInfo && tabAgentPassword) {
  tabAgentProfileInfo.addEventListener("click", () => {
    tabAgentProfileInfo.style.color = "#102a2c";
    tabAgentProfileInfo.style.borderBottom = "2px solid #e8785a";
    tabAgentPassword.style.color = "#7a8681";
    tabAgentPassword.style.borderBottom = "2px solid transparent";
    tabAgentContentProfile?.classList.remove("hidden");
    tabAgentContentPassword?.classList.add("hidden");
  });

  tabAgentPassword.addEventListener("click", () => {
    tabAgentPassword.style.color = "#102a2c";
    tabAgentPassword.style.borderBottom = "2px solid #e8785a";
    tabAgentProfileInfo.style.color = "#7a8681";
    tabAgentProfileInfo.style.borderBottom = "2px solid transparent";
    tabAgentContentPassword?.classList.remove("hidden");
    tabAgentContentProfile?.classList.add("hidden");
    const targetEmailEl = document.getElementById("changePasswordTargetEmail");
    if (targetEmailEl) {
      targetEmailEl.textContent = localStorage.getItem("userEmail") || "your active account email";
    }
  });
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
    const licenseNumber = document.getElementById("editLicense")?.value.trim();

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    msg.textContent = "";

    try {
      const payload = { firstName, lastName, phone, licenseNumber };

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("jwtToken") || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Could not update profile (${response.status})`);
      }

      localStorage.setItem("userFirstName", data.firstName);
      localStorage.setItem("userLastName", data.lastName);
      if (data.phone) localStorage.setItem("userPhone", data.phone);
      if (data.licenseNumber) localStorage.setItem("licenseNumber", data.licenseNumber);

      updateProfileUI(data);
      msg.className = "message success";
      msg.style.color = "#2e7d32";
      msg.style.fontWeight = "bold";
      msg.textContent = "✓ Profile updated successfully!";
      showToast("Profile Updated Successfully ✅", "Your details have been updated and applied in real-time.", "success");

    } catch (err) {
      msg.className = "message";
      msg.style.color = "var(--coral, #c85b47)";
      msg.textContent = "⚠️ " + err.message;
      showToast("Profile Update Failed", err.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes →";
    }
  });
}

// Change Password Form Submit
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
      msg.style.color = "#c85b47";
      msg.textContent = "New password and confirmation do not match.";
      return;
    }

    if (newPassword.length < 8) {
      msg.className = "message";
      msg.style.color = "#c85b47";
      msg.textContent = "Password must be at least 8 characters long.";
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Updating Password...";
    msg.textContent = "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("jwtToken") || ""}`,
          "Content-Type": "application/json"
        },
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
      updateAgentNotifBadge();
      showToast("Password Updated Successfully! 🔐", `Your account password has been changed. A security confirmation email was sent directly to ${targetMail}.`, "success");
    } catch (err) {
      msg.className = "message";
      msg.style.color = "#c85b47";
      msg.textContent = "⚠️ " + err.message;
      showToast("Password Update Failed", err.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Update Password & Send Email Alert →";
    }
  });
}

// Notifications Handling
const agentNotifBtn = document.getElementById("agentNotifBtn");
const agentNotifModal = document.getElementById("agentNotifModal");
const closeAgentNotifModal = document.getElementById("closeAgentNotifModal");
const closeAgentNotifModalBtn = document.getElementById("closeAgentNotifModalBtn");
const refreshAgentNotifsBtn = document.getElementById("refreshAgentNotifsBtn");

async function loadAgentNotifications() {
  const listEl = document.getElementById("agentNotifList");
  if (!listEl) return;

  listEl.innerHTML = `<p style="color:#7a8681; font-size:13px;">Loading notifications...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}` }
    });
    if (!response.ok) throw new Error("Could not load notifications");

    const notifs = await response.json();
    if (notifs.length === 0) {
      listEl.innerHTML = `<p style="color:#7a8681; font-size:13px; padding:15px 0;">No notifications received yet.</p>`;
      return;
    }

    listEl.innerHTML = notifs.map((n) => `
      <div style="padding:12px; border:1px solid #ded8cc; border-radius:8px; background:${n.read ? '#fbfaf8' : '#fff'}; display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="font-size:13px; color:#102a2c;">${n.title}</strong>
            ${!n.read ? '<span style="background:#e8785a; color:white; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:bold;">NEW</span>' : ''}
          </div>
          <p style="margin:5px 0 0; font-size:12px; color:#405451; line-height:1.4;">${n.message}</p>
          <small style="color:#7a8681; font-size:10px; margin-top:4px; display:block;">${new Date(n.createdAt).toLocaleString()}</small>
        </div>
        ${!n.read ? `<button class="mark-read-btn" data-id="${n.id}" style="border:none; background:transparent; color:#c85b47; font-size:11px; cursor:pointer; font-weight:bold; white-space:nowrap;">✓ Read</button>` : ''}
      </div>
    `).join("");

    listEl.querySelectorAll(".mark-read-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await fetch(`${API_BASE_URL}/api/notifications/${btn.dataset.id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}` }
        });
        loadAgentNotifications();
        updateAgentNotifBadge();
      });
    });

  } catch (err) {
    listEl.innerHTML = `<p style="color:var(--coral); font-size:13px;">${err.message}</p>`;
  }
}

async function updateAgentNotifBadge() {
  const badge = document.getElementById("agentNotifBadge");
  if (!badge) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}` }
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

if (agentNotifBtn) {
  agentNotifBtn.addEventListener("click", () => {
    agentNotifModal?.classList.remove("hidden");
    loadAgentNotifications();
  });
}
if (closeAgentNotifModal) closeAgentNotifModal.addEventListener("click", () => agentNotifModal?.classList.add("hidden"));
if (closeAgentNotifModalBtn) closeAgentNotifModalBtn.addEventListener("click", () => agentNotifModal?.classList.add("hidden"));
if (refreshAgentNotifsBtn) refreshAgentNotifsBtn.addEventListener("click", loadAgentNotifications);
if (agentNotifModal) {
  agentNotifModal.addEventListener("click", (e) => {
    if (e.target === agentNotifModal) agentNotifModal.classList.add("hidden");
  });
}

// Profile Modal handling
const profileChip = document.getElementById("profileChip");
const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const modalLogoutButton = document.getElementById("modalLogoutButton");

if (profileChip && profileModal) {
  profileChip.addEventListener("click", () => {
    profileModal.classList.remove("hidden");
    const msg = document.getElementById("profileMessage");
    if (msg) msg.textContent = "";
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

function handleSignOut() {
  localStorage.clear();
  window.location.href = "signIn_page.html";
}

document.getElementById("logoutButton")?.addEventListener("click", handleSignOut);
modalLogoutButton?.addEventListener("click", handleSignOut);

document.getElementById("profileChangePlanBtn")?.addEventListener("click", () => {
  profileModal?.classList.add("hidden");
  if (typeof openPaddlePricingModal === "function") openPaddlePricingModal();
});

// --- Upcoming Viewing Bookings Implementation ---
const bookingsTableBody = document.getElementById("bookingsTableBody");
const bookingsEmptyState = document.getElementById("bookingsEmptyState");
const refreshBookingsBtn = document.getElementById("refreshBookingsBtn");
const agentUpcomingCount = document.getElementById("agentUpcomingCount");
const navUpcomingCount = document.getElementById("navUpcomingCount");
let cachedAgentBookings = [];

function formatBookingStatus(status) {
  const map = {
    PENDING: { label: "Awaiting Confirmation", style: "background:#fef3c7; color:#92400e; border:1px solid #fde68a;" },
    ACCEPTED: { label: "Confirmed Viewing ✓", style: "background:#dcfce7; color:#166534; border:1px solid #bbf7d0;" },
    COMPLETED: { label: "Viewing Completed", style: "background:#e0e7ff; color:#3730a3; border:1px solid #c7d2fe;" },
    REJECTED: { label: "Declined", style: "background:#fee2e2; color:#991b1b; border:1px solid #fecaca;" },
    CANCELLED: { label: "Cancelled", style: "background:#f1f5f9; color:#475569; border:1px solid #e2e8f0;" }
  };
  const s = map[status] || { label: status, style: "background:#f1f5f9; color:#475569;" };
  return `<span style="display:inline-block; padding:3px 9px; border-radius:12px; font-size:10px; font-weight:bold; ${s.style}">${s.label}</span>`;
}

async function loadIncomingBookings() {
  if (!bookingsTableBody) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/bookings/incoming`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      if (bookingsEmptyState) bookingsEmptyState.classList.remove("hidden");
      return;
    }
    const bookings = await res.json();
    cachedAgentBookings = bookings;
    const activeUpcoming = bookings.filter(b => b.status === "PENDING" || b.status === "ACCEPTED");
    if (agentUpcomingCount) agentUpcomingCount.textContent = activeUpcoming.length;
    if (navUpcomingCount) navUpcomingCount.textContent = activeUpcoming.length;

    if (!bookings || bookings.length === 0) {
      bookingsTableBody.innerHTML = "";
      if (bookingsEmptyState) bookingsEmptyState.classList.remove("hidden");
      return;
    }

    if (bookingsEmptyState) bookingsEmptyState.classList.add("hidden");

    bookingsTableBody.innerHTML = bookings.map((b) => {
      const advance = b.advancePaymentAmount ? `LKR ${Number(b.advancePaymentAmount).toLocaleString()}` : "LKR 5,000";
      const isPending = b.status === "PENDING";
      const timeDisplay = b.viewingTime ? ` at <strong>${b.viewingTime}</strong>` : "";

      return `
        <tr>
          <td>
            <strong style="color:#102a2c; font-size:12.5px; display:block;">${b.listingTitle || 'Apartment'}</strong>
            <span style="color:#64748b; font-size:11px;">📍 ${b.listingCity || 'Location'}</span>
          </td>
          <td>
            <strong style="color:#102a2c; font-size:12px; display:block;">${b.buyerName || 'Client'}</strong>
            <span style="color:#64748b; font-size:11px; display:block;">✉️ ${b.buyerEmail || '—'}</span>
            ${b.buyerPhone ? `<span style="color:#64748b; font-size:11px; display:block;">📞 ${b.buyerPhone}</span>` : ''}
          </td>
          <td>
            <div style="display:inline-flex; align-items:center; gap:6px; background:#f8fafc; padding:4px 8px; border-radius:6px; border:1px solid #e2e8f0;">
              <span>📅</span>
              <span style="font-size:11.5px; color:#1e293b;">${b.viewingDate}${timeDisplay}</span>
            </div>
          </td>
          <td>
            <span style="font-weight:bold; color:#102a2c; font-size:12px; display:block;">${advance}</span>
            <span style="display:inline-block; margin-top:2px; padding:1px 6px; border-radius:8px; font-size:9.5px; font-weight:bold; background:#dcfce7; color:#166534;">PAID (${b.paymentMethod || 'Deposit'})</span>
            ${b.transactionReference ? `<small style="display:block; color:#94a3b8; font-size:9px;">Ref: ${b.transactionReference}</small>` : ''}
          </td>
          <td>
            ${formatBookingStatus(b.status)}
            ${b.isDisputed && b.disputeStatus === 'OPEN' ? `
              <div style="font-size:9.5px; font-weight:800; color:#c2410c; background:#ffedd5; border:1px solid #fed7aa; padding:2px 6px; border-radius:5px; margin-top:3px;">
                ⚠️ Dispute: ${(b.disputeReason || 'Under Review').replace(/_/g, ' ')}
              </div>
            ` : (b.isDisputed && b.disputeStatus === 'RESOLVED' ? `
              <div style="font-size:9.5px; font-weight:700; color:#065f46; background:#ecfdf5; border:1px solid #a7f3d0; padding:2px 6px; border-radius:5px; margin-top:3px;">
                ✓ Resolved: ${(b.resolutionDecision || 'Documented').replace(/_/g, ' ')}
                ${(b.resolutionDecision === 'RESCHEDULE' || b.isRescheduled) ? `
                  <div style="color:#6d28d9; font-weight:700; margin-top:2px; font-size:9px;">
                    🔄 New Date: ${b.rescheduledDate || b.viewingDate} ${b.rescheduledTime || b.viewingTime ? '· ' + (b.rescheduledTime || b.viewingTime) : ''}
                  </div>
                ` : ''}
              </div>
            ` : '')}
          </td>
          <td style="text-align:right;">
            ${b.isDisputed && b.disputeStatus === 'OPEN' ? `
              <span style="font-size:10.5px; color:#ea580c; font-weight:bold; background:#fff7ed; padding:3px 8px; border-radius:6px; border:1px solid #fed7aa;">⚖️ Under Mediation</span>
            ` : (isPending ? `
              <div style="display:inline-flex; gap:6px;">
                <button class="btn-booking-action btn-accept-booking" data-id="${b.id}" style="padding:5px 10px; background:#10b981; color:white; border:none; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;" title="Confirm this viewing appointment">✓ Accept</button>
                <button class="btn-booking-action btn-reject-booking" data-id="${b.id}" style="padding:5px 10px; background:#ef4444; color:white; border:none; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;" title="Decline this viewing request">✕ Decline</button>
              </div>
            ` : (b.status === "ACCEPTED" || b.status === "COMPLETED" ? `
              <div style="display:inline-flex; align-items:center; gap:6px;">
                <span style="color:#166534; font-weight:bold; font-size:11px;">${b.status === 'COMPLETED' ? '✓ Completed' : '✓ Confirmed'}</span>
                ${b.status === 'ACCEPTED' ? `
                  <button class="btn-booking-action btn-owner-cancel-booking" data-id="${b.id}" style="padding:4px 8px; background:#fff1f2; color:#be123c; border:1px solid #fecdd3; border-radius:5px; font-size:10px; font-weight:bold; cursor:pointer;" title="Cancel confirmed viewing (Buyer receives 100% full refund)">✕ Cancel (100% Refund)</button>
                ` : ''}
                ${!b.isDisputed ? `<button class="btn-agent-dispute" data-id="${b.id}" style="padding:4px 8px; background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; border-radius:5px; font-size:10px; font-weight:bold; cursor:pointer;" title="Report issue to Booking Manager">⚠️ Report Issue</button>` : ''}
              </div>
            ` : `—`))}
          </td>
        </tr>
      `;
    }).join("");

    // Wire Accept & Reject & Cancel buttons
    bookingsTableBody.querySelectorAll(".btn-accept-booking").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        btn.disabled = true;
        btn.textContent = "...";
        try {
          const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/accept`, {
            method: "PATCH",
            headers: authHeaders()
          });
          if (!res.ok) throw new Error("Failed to accept booking");
          showSuccessBanner("Viewing booking accepted and confirmed!");
          loadIncomingBookings();
        } catch (e) {
          alert(e.message);
          btn.disabled = false;
          btn.textContent = "✓ Accept";
        }
      });
    });

    bookingsTableBody.querySelectorAll(".btn-reject-booking").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Are you sure you want to decline this viewing appointment? The buyer will receive a 100% FULL REFUND of their advance deposit.")) return;
        btn.disabled = true;
        btn.textContent = "...";
        try {
          const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/reject`, {
            method: "PATCH",
            headers: authHeaders()
          });
          if (!res.ok) throw new Error("Failed to decline booking");
          showSuccessBanner("Viewing booking request declined. 100% refund initiated for buyer.");
          loadIncomingBookings();
        } catch (e) {
          alert(e.message);
          btn.disabled = false;
          btn.textContent = "✕ Decline";
        }
      });
    });

    bookingsTableBody.querySelectorAll(".btn-owner-cancel-booking").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Are you sure you want to cancel this confirmed appointment? Since you (the agent) are cancelling, a 100% FULL REFUND will be returned to the buyer.")) return;
        btn.disabled = true;
        btn.textContent = "...";
        try {
          const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/owner-cancel`, {
            method: "PATCH",
            headers: authHeaders()
          });
          if (!res.ok) throw new Error("Failed to cancel booking");
          showSuccessBanner("Appointment cancelled. A 100% full refund has been initiated for the buyer.");
          loadIncomingBookings();
        } catch (e) {
          alert(e.message);
          btn.disabled = false;
          btn.textContent = "✕ Cancel (100% Refund)";
        }
      });
    });

    bookingsTableBody.querySelectorAll(".btn-agent-dispute").forEach((btn) => {
      btn.addEventListener("click", () => {
        openAgentDisputeModal(btn.dataset.id);
      });
    });

  } catch (err) {
    console.error("Error loading incoming bookings:", err);
  }
}

function openAgentDisputeModal(bookingId) {
  const b = cachedAgentBookings.find(item => String(item.id) === String(bookingId));
  if (!b) return;
  document.getElementById("agentDisputeBookingId").value = b.id;
  document.getElementById("agentDisputeBookingBadge").textContent = `#BK-${b.id}`;
  document.getElementById("agentDisputePropertyTitle").textContent = b.listingTitle || "Apartment";
  document.getElementById("agentDisputeBuyerName").textContent = `${b.buyerName || 'Buyer'} (${b.buyerEmail || '—'})`;
  document.getElementById("agentDisputeSchedule").textContent = `${b.viewingDate} ${b.viewingTime ? '· ' + b.viewingTime : ''}`;
  document.getElementById("agentDisputeReason").value = "BUYER_NO_SHOW";
  document.getElementById("agentDisputeDetails").value = "";
  const msg = document.getElementById("agentDisputeMessage");
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }
  document.getElementById("agentDisputeModal")?.classList.remove("hidden");
}

function hideAgentDisputeModal() {
  document.getElementById("agentDisputeModal")?.classList.add("hidden");
}

const closeAgentDisputeModalBtn = document.getElementById("closeAgentDisputeModal");
const cancelAgentDisputeBtn = document.getElementById("cancelAgentDisputeBtn");
const agentDisputeModal = document.getElementById("agentDisputeModal");
const agentDisputeForm = document.getElementById("agentDisputeForm");

if (closeAgentDisputeModalBtn) closeAgentDisputeModalBtn.addEventListener("click", hideAgentDisputeModal);
if (cancelAgentDisputeBtn) cancelAgentDisputeBtn.addEventListener("click", hideAgentDisputeModal);
if (agentDisputeModal) {
  agentDisputeModal.addEventListener("click", (e) => {
    if (e.target === agentDisputeModal) hideAgentDisputeModal();
  });
}

if (agentDisputeForm) {
  agentDisputeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("agentDisputeBookingId").value;
    const reason = document.getElementById("agentDisputeReason").value;
    const details = document.getElementById("agentDisputeDetails").value.trim();
    const submitBtn = document.getElementById("submitAgentDisputeBtn");
    const msg = document.getElementById("agentDisputeMessage");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting Dispute...";
    }
    if (msg) msg.textContent = "";

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/dispute`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ reason: reason.trim(), details: details.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed to report dispute (${res.status})`);
      }

      hideAgentDisputeModal();
      showSuccessBanner(`Dispute on Booking #${id} reported! The Booking Manager has been assigned for mediation.`);
      loadIncomingBookings();
    } catch (err) {
      if (msg) {
        msg.className = "message";
        msg.style.color = "#dc2626";
        msg.textContent = "⚠️ " + err.message;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "⚠️ Submit Dispute to Manager →";
      }
    }
  });
}

if (refreshBookingsBtn) {
  refreshBookingsBtn.addEventListener("click", async () => {
    refreshBookingsBtn.disabled = true;
    const origText = refreshBookingsBtn.innerHTML;
    refreshBookingsBtn.innerHTML = "↻ Refreshing...";
    try {
      await loadIncomingBookings();
      showToast("Bookings Refreshed ↻", "Client tour reservations and viewing schedule updated.", "success");
    } catch (e) {
      showToast("Refresh Notice", "Bookings refreshed.", "info");
    } finally {
      refreshBookingsBtn.disabled = false;
      refreshBookingsBtn.innerHTML = origText;
    }
  });
}

// --- Marketplace & Full Apartment Details Modal Implementation ---
let marketplaceApartments = [];

async function loadMarketplaceApartments() {
  try {
    const res = await fetch(`${API_BASE_URL}${LISTINGS_ENDPOINT}`);
    if (!res.ok) throw new Error("Failed to load site apartments");
    const data = await res.json();
    marketplaceApartments = (Array.isArray(data) ? data : []).map(normalizeListing);
    
    // Update nav counter
    const navCount = document.getElementById("navMarketplaceCount");
    if (navCount) navCount.textContent = marketplaceApartments.length;

    populateMarketplaceCities();
    renderMarketplaceApartments();
  } catch (err) {
    console.error("Error loading marketplace apartments:", err);
    const grid = document.getElementById("marketplaceGrid");
    if (grid) grid.innerHTML = `<p style="color:#ef4444; font-size:12px; padding:12px;">Failed to load published apartments from server.</p>`;
  }
}

function populateMarketplaceCities() {
  const citySelect = document.getElementById("marketplaceCityFilter");
  if (!citySelect) return;
  const currentVal = citySelect.value;
  const cities = Array.from(new Set(marketplaceApartments.map(a => a.city).filter(Boolean))).sort();
  citySelect.innerHTML = `<option value="ALL">All Cities (${marketplaceApartments.length})</option>` +
    cities.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (cities.includes(currentVal)) {
    citySelect.value = currentVal;
  }
}

function renderMarketplaceApartments() {
  const grid = document.getElementById("marketplaceGrid");
  const emptyState = document.getElementById("marketplaceEmptyState");
  const countEl = document.getElementById("marketplaceResultsCount");
  if (!grid) return;

  const query = (document.getElementById("marketplaceSearch")?.value || "").toLowerCase().trim();
  const selectedCity = document.getElementById("marketplaceCityFilter")?.value || "ALL";

  const filtered = marketplaceApartments.filter(item => {
    const matchesQuery = !query || 
      `${item.name} ${item.location} ${item.city} ${item.street} ${item.ownerName} ${item.propertyType}`.toLowerCase().includes(query);
    const matchesCity = selectedCity === "ALL" || (item.city && item.city.toLowerCase() === selectedCity.toLowerCase());
    return matchesQuery && matchesCity;
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${marketplaceApartments.length} apartments`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  grid.innerHTML = filtered.map(item => {
    const priceText = typeof item.price === "number" 
      ? `LKR ${item.price.toLocaleString()}` 
      : (typeof item.rawPrice === "number" && item.rawPrice > 0 ? `LKR ${item.rawPrice.toLocaleString()}` : (item.price || "Price on request"));
    const ownerLabel = item.ownerType === "SELLER" ? "Private Owner" : "Agent";
    const ownerDisplayName = item.ownerName || (item.ownerType === "SELLER" ? "Property Seller" : "Real Estate Agent");
    const amenitiesCount = item.amenities ? item.amenities.length : 0;
    
    return `
      <div class="marketplace-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; box-shadow:0 4px 14px rgba(16,42,44,0.05); transition:transform 0.2s, box-shadow 0.2s; display:flex; flex-direction:column; position:relative; cursor:pointer;" data-id="${item.id}">
        <!-- Image Container -->
        <div style="position:relative; width:100%; height:180px; background:#102a2c; overflow:hidden;">
          <img src="${item.image}" alt="${escapeHtml(item.name)}" style="width:100%; height:100%; object-fit:cover; transition:transform .3s ease;" onerror="this.src='https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80'" />
          <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%);"></div>
          
          <div style="position:absolute; top:10px; left:10px; display:flex; gap:6px; flex-wrap:wrap;">
            <span style="background:rgba(255,255,255,0.92); color:#065f46; font-size:9.5px; font-weight:800; padding:2px 8px; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">✓ Published</span>
            <span style="background:rgba(16,42,44,0.85); color:#ffd3c2; font-size:9.5px; font-weight:700; padding:2px 8px; border-radius:12px;">${escapeHtml(item.propertyType || 'Apartment')}</span>
          </div>
          
          <div style="position:absolute; bottom:10px; right:10px; background:rgba(16,42,44,0.85); backdrop-filter:blur(4px); color:#ffc5b0; font-family:Georgia,serif; font-size:15px; font-weight:bold; padding:4px 10px; border-radius:8px; border:1px solid rgba(232,120,90,0.3);">
            ${priceText}
          </div>
        </div>

        <!-- Body Details -->
        <div style="padding:16px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <h3 style="margin:0 0 6px; font-family:Georgia,serif; font-size:17px; color:#102a2c; line-height:1.25;">${escapeHtml(item.name)}</h3>
            <p style="margin:0 0 10px; font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:4px;">
              <span>📍</span> <span>${escapeHtml(item.street ? item.street + ', ' : '')}${escapeHtml(item.city || 'Colombo')}</span>
            </p>

            <!-- Amenities & Spec Chips -->
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
              <span style="background:#f1f5f9; color:#475569; font-size:10.5px; font-weight:600; padding:2px 8px; border-radius:6px;">🏢 ${escapeHtml(item.propertyType || 'Apartment')}</span>
              <span style="background:#f0fdf4; color:#166534; font-size:10.5px; font-weight:600; padding:2px 8px; border-radius:6px; border:1px solid #bbf7d0;">✦ ${amenitiesCount} Amenities</span>
            </div>
          </div>

          <!-- Owner / Agent Badge & Action Button -->
          <div style="border-top:1px solid #f1f5f9; padding-top:12px; margin-top:8px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:30px; height:30px; border-radius:50%; background:#102a2c; color:white; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:1px solid #e8785a;">
                ${(ownerDisplayName.trim()[0] || 'O').toUpperCase()}
              </div>
              <div>
                <span style="font-size:11px; font-weight:700; color:#102a2c; display:block; line-height:1.2;">${escapeHtml(ownerDisplayName)}</span>
                <small style="font-size:9.5px; color:#64748b;">${ownerLabel} ${item.ownerVerified ? '· ✓ Verified' : ''}</small>
              </div>
            </div>

            <button type="button" class="btn-marketplace-details primary-button" data-id="${item.id}" style="padding:7px 12px; font-size:11px; border-radius:6px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">
              <span>🔍 Details</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".marketplace-card").forEach(card => {
    card.addEventListener("click", () => {
      openApartmentDetailsModal(card.dataset.id);
    });
  });
  grid.querySelectorAll(".btn-marketplace-details").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openApartmentDetailsModal(btn.dataset.id);
    });
  });
}

// Search and filter listeners for marketplace
document.getElementById("marketplaceSearch")?.addEventListener("input", renderMarketplaceApartments);
document.getElementById("marketplaceCityFilter")?.addEventListener("change", renderMarketplaceApartments);
const refreshMarketplaceBtn = document.getElementById("refreshMarketplaceBtn");
if (refreshMarketplaceBtn) {
  refreshMarketplaceBtn.addEventListener("click", async () => {
    refreshMarketplaceBtn.disabled = true;
    const origText = refreshMarketplaceBtn.innerHTML;
    refreshMarketplaceBtn.innerHTML = "↻ Refreshing...";
    try {
      await loadMarketplaceApartments();
      showToast("Marketplace Refreshed ↻", "Live marketplace properties updated.", "success");
    } catch (e) {
      showToast("Refresh Notice", "Marketplace table refreshed.", "info");
    } finally {
      refreshMarketplaceBtn.disabled = false;
      refreshMarketplaceBtn.innerHTML = origText;
    }
  });
}

// Full Apartment Details Modal Logic
function openApartmentDetailsModal(listingId) {
  let item = marketplaceApartments.find(a => String(a.id) === String(listingId)) ||
             listings.find(a => String(a.id) === String(listingId));

  if (!item) {
    fetch(`${API_BASE_URL}${LISTINGS_ENDPOINT}/${listingId}`)
      .then(res => res.json())
      .then(data => {
        if (data) populateAndShowApartmentDetailsModal(normalizeListing(data));
      })
      .catch(err => {
        console.error("Could not load listing details:", err);
      });
    return;
  }

  populateAndShowApartmentDetailsModal(item);
}

function populateAndShowApartmentDetailsModal(home) {
  const modal = document.getElementById("apartmentDetailsModal");
  if (!modal) return;

  const imgEl = document.getElementById("detailModalImage");
  if (imgEl) imgEl.src = home.image || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80";

  const verifiedBadge = document.getElementById("detailModalVerifiedBadge");
  if (verifiedBadge) {
    if (home.ownerVerified) {
      verifiedBadge.style.display = "inline-flex";
      verifiedBadge.textContent = home.ownerType === "SELLER" ? "✓ Verified Seller Listing" : "✓ Verified Agent Listing";
    } else {
      verifiedBadge.style.display = "none";
    }
  }

  const propTypeBadge = document.getElementById("detailModalPropertyType");
  if (propTypeBadge) propTypeBadge.textContent = home.propertyType || "Apartment";

  const eyebrowEl = document.getElementById("detailModalEyebrow");
  if (eyebrowEl) {
    eyebrowEl.textContent = `${(home.propertyType || "APARTMENT").toUpperCase()} · ${(home.city || "COLOMBO").toUpperCase()}`;
  }

  const titleEl = document.getElementById("detailModalTitle");
  if (titleEl) titleEl.textContent = home.name || home.title || "Apartment Title";

  const addrEl = document.getElementById("detailModalAddress");
  if (addrEl) addrEl.textContent = `📍 ${[home.street, home.city].filter(Boolean).join(", ") || home.location || "Sri Lanka"}`;

  const priceEl = document.getElementById("detailModalPrice");
  if (priceEl) {
    priceEl.textContent = typeof home.price === "number" ? `LKR ${home.price.toLocaleString()}` : (home.price || "Price on request");
  }

  const descEl = document.getElementById("detailModalDescription");
  if (descEl) {
    descEl.textContent = home.description || "Exquisite apartment featuring premium finishes, expansive living spaces, excellent ventilation, and prime urban accessibility.";
  }

  const specType = document.getElementById("detailModalSpecType");
  if (specType) specType.textContent = home.propertyType || "Apartment";

  const specCity = document.getElementById("detailModalSpecCity");
  if (specCity) specCity.textContent = home.city || (home.location ? home.location.split("·")[0].trim() : "Colombo");

  const specPostal = document.getElementById("detailModalSpecPostal");
  if (specPostal) specPostal.textContent = home.postalCode || "00100";

  const specStatus = document.getElementById("detailModalSpecStatus");
  if (specStatus) {
    specStatus.textContent = home.status === "PUBLISHED" ? "✓ Published" : (home.status || "Ready");
    specStatus.style.color = home.status === "PUBLISHED" ? "#047857" : "#b45309";
  }

  const amenGrid = document.getElementById("detailModalAmenitiesGrid");
  const amenCountBadge = document.getElementById("detailModalAmenityCountBadge");
  const amenities = Array.isArray(home.amenities) ? home.amenities : [];

  if (amenCountBadge) {
    amenCountBadge.textContent = `${amenities.length} ${amenities.length === 1 ? 'Amenity' : 'Amenities'}`;
  }

  if (amenGrid) {
    if (amenities.length > 0) {
      amenGrid.innerHTML = amenities.map(a => `
        <span class="amenity-chip" style="display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; padding:6px 12px; background:white; color:#14532d; border:1px solid #86efac; border-radius:20px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <span style="font-size:14px;">${getAmenityIcon(a)}</span>
          <span>${escapeHtml(a)}</span>
        </span>
      `).join("");
    } else {
      amenGrid.innerHTML = `<span style="font-size:12px; color:#64748b; font-style:italic;">No specific amenities listed for this apartment yet.</span>`;
    }
  }

  const ownerName = home.ownerName || (home.ownerType === "SELLER" ? "Private Property Owner" : "Authorized Real Estate Agent");
  const ownerInitial = (ownerName.trim()[0] || "A").toUpperCase();
  const agentAvatar = document.getElementById("detailModalAgentAvatar");
  if (agentAvatar) agentAvatar.textContent = ownerInitial;

  const agentNameEl = document.getElementById("detailModalAgentName");
  if (agentNameEl) agentNameEl.textContent = ownerName;

  const agentVerifiedBadge = document.getElementById("detailModalAgentVerifiedBadge");
  if (agentVerifiedBadge) {
    if (home.ownerVerified) {
      agentVerifiedBadge.style.display = "inline-flex";
      agentVerifiedBadge.textContent = home.ownerType === "SELLER" ? "✓ Verified Seller" : "✓ Certified Agent";
    } else {
      agentVerifiedBadge.style.display = "none";
    }
  }

  const roleSubtitle = document.getElementById("detailModalAgentRoleSubtitle");
  if (roleSubtitle) {
    roleSubtitle.textContent = home.ownerType === "SELLER"
      ? "Direct Property Owner · Verified Titleholder"
      : "Licensed Real Estate Specialist · Nook & Key Partner";
  }

  const ratingEl = document.getElementById("detailModalAgentRating");
  if (ratingEl) {
    const r = home.ownerRating ? Number(home.ownerRating).toFixed(1) : "4.9";
    ratingEl.textContent = `★ ${r}`;
  }

  const licenseEl = document.getElementById("detailModalAgentLicense");
  if (licenseEl) {
    licenseEl.textContent = home.ownerLicenseNumber || (home.ownerType === "SELLER" ? "Verified Private Seller" : "AGT-2026-0042");
  }

  const planEl = document.getElementById("detailModalAgentPlan");
  if (planEl) {
    planEl.textContent = `${home.ownerPlan || "STANDARD"} ${home.ownerType === "SELLER" ? "SELLER" : "AGENT"}`;
  }

  const phoneEl = document.getElementById("detailModalAgentPhone");
  if (phoneEl) {
    const rawPhone = home.ownerPhone || "+94 77 123 4567";
    phoneEl.textContent = `📞 ${rawPhone}`;
    phoneEl.href = `tel:${rawPhone.replace(/[^0-9+]/g, '')}`;
  }

  const emailEl = document.getElementById("detailModalAgentEmail");
  if (emailEl) {
    const rawEmail = home.ownerEmail || "support@nookandkey.com";
    emailEl.textContent = `✉️ ${rawEmail}`;
    emailEl.href = `mailto:${rawEmail}`;
  }

  const directBtn = document.getElementById("detailModalDirectContactBtn");
  if (directBtn) {
    const rawPhone = home.ownerPhone || "+94 77 123 4567";
    directBtn.href = `tel:${rawPhone.replace(/[^0-9+]/g, '')}`;
  }

  const footerNote = document.getElementById("detailModalFooterOwnerNote");
  const isMyListing = listings.some(l => String(l.id) === String(home.id));
  if (footerNote) {
    if (isMyListing) {
      footerNote.innerHTML = `<span style="background:#f0fdf4; color:#166534; font-weight:700; padding:4px 10px; border-radius:6px; border:1px solid #bbf7d0;">✦ Your Listed Property (Public Preview)</span>`;
    } else {
      footerNote.innerHTML = `<span style="color:#64748b;">Listed by <strong>${escapeHtml(ownerName)}</strong> (${home.ownerType === "SELLER" ? "Seller" : "Agent"})</span>`;
    }
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeApartmentDetailsModal() {
  const modal = document.getElementById("apartmentDetailsModal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}

document.getElementById("closeApartmentDetailsModal")?.addEventListener("click", closeApartmentDetailsModal);
document.getElementById("closeApartmentDetailsModalBtn")?.addEventListener("click", closeApartmentDetailsModal);

const apartmentDetailsModal = document.getElementById("apartmentDetailsModal");
if (apartmentDetailsModal) {
  apartmentDetailsModal.addEventListener("click", (e) => {
    if (e.target === apartmentDetailsModal) closeApartmentDetailsModal();
  });
}

// --- Viewing Availability Modal Logic ---
let selectedAvailDates = [];

function renderSelectedAvailDateBadges() {
  const container = document.getElementById("availSelectedDatesContainer");
  if (!container) return;

  if (selectedAvailDates.length === 0) {
    container.innerHTML = `<span style="font-size:11px; color:#94a3b8; align-self:center;" id="noDatesPlaceholder">No calendar dates selected yet. Pick a date above or click "+ Next 7 Days".</span>`;
    return;
  }

  // Sort dates ascending
  selectedAvailDates.sort();

  const dayAbbrs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  container.innerHTML = selectedAvailDates.map(dateStr => {
    const d = new Date(dateStr + "T00:00:00");
    const dayName = isNaN(d.getTime()) ? "" : ` (${dayAbbrs[d.getDay()]})`;
    return `
      <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 9px; background:#0f766e; color:white; border-radius:16px; font-size:11px; font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <span>📅 ${escapeHtml(dateStr)}${dayName}</span>
        <button type="button" class="remove-avail-date-btn" data-date="${dateStr}" style="border:none; background:transparent; color:#ccfbf1; cursor:pointer; font-size:12px; padding:0 2px; line-height:1; font-weight:bold;" title="Remove date">✕</button>
      </span>
    `;
  }).join("");

  container.querySelectorAll(".remove-avail-date-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dateToRemove = btn.dataset.date;
      selectedAvailDates = selectedAvailDates.filter(d => d !== dateToRemove);
      renderSelectedAvailDateBadges();
    });
  });
}

function addAvailDate(dateStr) {
  if (!dateStr) return;
  if (!selectedAvailDates.includes(dateStr)) {
    selectedAvailDates.push(dateStr);
    renderSelectedAvailDateBadges();
  }
}

function openAvailabilityModal(listingId) {
  const listing = listings.find(l => String(l.id) === String(listingId));
  if (!listing) return;

  const modal = document.getElementById("availabilityModal");
  if (!modal) return;

  const idInput = document.getElementById("availListingId");
  if (idInput) idInput.value = listing.id;

  const titleEl = document.getElementById("availListingTitle");
  if (titleEl) {
    titleEl.textContent = `${listing.name} (${listing.location})`;
  }

  // Set today min for date picker
  const datePicker = document.getElementById("availDatePicker");
  const todayIso = new Date().toISOString().split("T")[0];
  if (datePicker) {
    datePicker.min = todayIso;
    datePicker.value = todayIso;
  }

  // Parse schedule or use defaults
  let days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  let slots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM"
  ];
  selectedAvailDates = [];

  if (listing.availabilitySchedule) {
    try {
      const parsed = typeof listing.availabilitySchedule === "object"
        ? listing.availabilitySchedule
        : JSON.parse(listing.availabilitySchedule);
      if (Array.isArray(parsed.availableDates) && parsed.availableDates.length > 0) {
        selectedAvailDates = [...parsed.availableDates];
      }
      if (Array.isArray(parsed.availableDays) && parsed.availableDays.length > 0) {
        days = parsed.availableDays.map(d => String(d).toUpperCase());
      }
      if (Array.isArray(parsed.availableSlots) && parsed.availableSlots.length > 0) {
        slots = parsed.availableSlots;
      }
    } catch (e) {
      console.warn("Could not parse availabilitySchedule:", e);
    }
  }

  // If no specific dates yet, pre-populate upcoming 3 business days for convenience
  if (selectedAvailDates.length === 0) {
    const d = new Date();
    for (let i = 0; i < 3; i++) {
      const nextDate = new Date();
      nextDate.setDate(d.getDate() + i);
      selectedAvailDates.push(nextDate.toISOString().split("T")[0]);
    }
  }

  renderSelectedAvailDateBadges();

  // Update day checkboxes
  document.querySelectorAll(".avail-day-cb").forEach(cb => {
    cb.checked = days.includes(cb.value.toUpperCase());
  });

  // Update slot checkboxes
  document.querySelectorAll(".avail-slot-cb").forEach(cb => {
    cb.checked = slots.includes(cb.value);
  });

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeAvailabilityModalFn() {
  const modal = document.getElementById("availabilityModal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

function initAvailabilityModalEvents() {
  const closeBtn = document.getElementById("closeAvailabilityModal");
  const cancelBtn = document.getElementById("cancelAvailabilityModal");
  const saveBtn = document.getElementById("saveAvailabilityBtn");
  const modal = document.getElementById("availabilityModal");

  if (closeBtn) closeBtn.addEventListener("click", closeAvailabilityModalFn);
  if (cancelBtn) cancelBtn.addEventListener("click", closeAvailabilityModalFn);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeAvailabilityModalFn();
    });
  }

  // Add date button
  const addDateBtn = document.getElementById("addAvailDateBtn");
  const datePicker = document.getElementById("availDatePicker");
  if (addDateBtn && datePicker) {
    addDateBtn.addEventListener("click", () => {
      const val = datePicker.value;
      if (val) addAvailDate(val);
    });
  }

  // Quick preset buttons
  document.querySelectorAll(".avail-quick-date-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const offsetDays = parseInt(btn.dataset.days || "0", 10);
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      addAvailDate(d.toISOString().split("T")[0]);
    });
  });

  const next7Btn = document.getElementById("addNext7DaysBtn");
  if (next7Btn) {
    next7Btn.addEventListener("click", () => {
      const base = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(base.getDate() + i);
        addAvailDate(d.toISOString().split("T")[0]);
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const listingId = document.getElementById("availListingId")?.value;
      if (!listingId) return;

      const selectedDays = Array.from(document.querySelectorAll(".avail-day-cb:checked")).map(cb => cb.value);
      const selectedSlots = Array.from(document.querySelectorAll(".avail-slot-cb:checked")).map(cb => cb.value);

      if (selectedAvailDates.length === 0 && selectedDays.length === 0) {
        alert("Please select at least one calendar date or available day of the week.");
        return;
      }
      if (selectedSlots.length === 0) {
        alert("Please select at least one available viewing time slot.");
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const scheduleData = {
        availableDates: selectedAvailDates,
        availableDays: selectedDays,
        availableSlots: selectedSlots
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/listings/${listingId}/availability`, {
          method: "PATCH",
          headers: authHeaders(true),
          body: JSON.stringify({
            availabilitySchedule: JSON.stringify(scheduleData)
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || "Failed to update viewing availability");
        }

        if (typeof showSuccessBanner === "function") {
          showSuccessBanner("Viewing availability schedule saved! Buyers will only see your selected dates and time slots.");
        } else {
          alert("Viewing availability schedule saved successfully!");
        }
        closeAvailabilityModalFn();
        await loadListings();
      } catch (err) {
        alert(err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "✓ Save Availability";
      }
    });
  }
}

// Initialize Listing Modal image and document upload components
initListingModalUploads();

// --- Start Dashboard Initialization ---
async function initDashboard() {
  loadUserProfile();
  loadListings();
  loadMarketplaceApartments();
  loadIncomingBookings();
  initAvailabilityModalEvents();
  if (typeof initPaddleBilling === "function") {
    initPaddleBilling("AGENT", (updatedProfile) => {
      loadListings();
      updateProfileUI(updatedProfile);
    });
  }
  updateAgentNotifBadge();
  setInterval(updateAgentNotifBadge, 30000);
  setInterval(loadIncomingBookings, 30000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}


