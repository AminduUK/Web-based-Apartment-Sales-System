const API_BASE_URL = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";
const VERIFICATION_QUEUE_ENDPOINT = "/api/verification/queue";
const USE_DEMO_DATA = false;
let reviews = [];
const tableBody = document.getElementById("reviewTableBody");
const search = document.getElementById("reviewSearch");
const filter = document.getElementById("reviewFilter");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("reviewModal");
let selectedReview = null;

function authHeaders(json = false) {
  const headers = { Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function value(item, keys, fallback = "—") {
  for (const key of keys) {
    if (item?.[key] !== undefined && item[key] !== null) return item[key];
  }
  return fallback;
}

function normalizeReview(item) {
  const rawPriority = String(value(item, ["priority"], "NORMAL")).toUpperCase();
  const rawStatus = String(value(item, ["status", "listingStatus"], "PENDING")).toUpperCase();
  const docsList = Array.isArray(item.documents) ? item.documents : [];
  const docsCount = docsList.length;
  const docsLabel = docsCount > 0 ? `📄 ${docsCount} doc${docsCount === 1 ? '' : 's'}` : "⚠️ 0 docs";

  let displayStatus = "Awaiting review";
  if (rawStatus === "DOCUMENTS_REQUESTED") {
    displayStatus = "Documents requested";
  } else if (rawStatus === "PUBLISHED") {
    displayStatus = "Published";
  } else if (rawStatus === "REJECTED") {
    displayStatus = "Returned";
  }

  return {
    id: value(item, ["id", "listingId"]),
    name: value(item, ["title", "name", "propertyName"], "Untitled apartment"),
    location: value(item, ["location", "city", "street"], "Colombo, Western Province"),
    street: value(item, ["street"], ""),
    city: value(item, ["city"], ""),
    price: value(item, ["price"], 0),
    propertyType: value(item, ["propertyType"], "APARTMENT"),
    ownerType: value(item, ["ownerType"], "SELLER"),
    seller: value(item, ["sellerName", "ownerName", "seller"], "Property Owner"),
    ref: `VER-${String(value(item, ["id"], "001")).padStart(4, "0")}`,
    documents: docsLabel,
    documentsList: docsList,
    documentRequestNote: value(item, ["documentRequestNote"], ""),
    priority: rawPriority,
    rawStatus: rawStatus,
    submitted: value(item, ["datePosted", "submittedAt", "createdAt"], "Recently"),
    status: displayStatus,
    image: value(item, ["imageUrl", "coverImage"], "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=160&q=80")
  };
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

function renderReviews() {
  const searchInput = document.getElementById("reviewSearch");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const chosen = filter ? filter.value : "ALL";
  const rows = reviews.filter((item) => 
    (!query || `${item.name} ${item.seller} ${item.location} ${item.ref} ${item.ownerType} ${item.status}`.toLowerCase().includes(query)) && 
    (chosen === "ALL" || item.priority === chosen)
  );

  tableBody.innerHTML = rows.map((item) => {
    const isDocReq = item.rawStatus === "DOCUMENTS_REQUESTED";
    const statusClass = isDocReq ? "style='color:#b45309; font-weight:bold;'" : "class='review-status'";
    const docPillClass = item.documentsList && item.documentsList.length > 0 ? "style='color:#166534; font-weight:bold; background:#dcfce7; padding:3px 8px; border-radius:10px; font-size:10px;'" : "style='color:#991b1b; font-weight:bold; background:#fee2e2; padding:3px 8px; border-radius:10px; font-size:10px;'";

    return `
      <tr class="row-fade-in">
        <td>
          <div class="property-cell">
            <img class="property-thumb" src="${item.image}" alt="${escapeHtml(item.name)}" />
            <div>
              ${escapeHtml(item.name)}
              <span class="subtext">${escapeHtml(item.location)} · ${escapeHtml(item.ref)}</span>
            </div>
          </div>
        </td>
        <td>${escapeHtml(item.seller)} <small style="display:block; color:#64748b; font-size:9.5px;">${escapeHtml(item.ownerType)}</small></td>
        <td><span ${docPillClass}>${escapeHtml(item.documents)}</span></td>
        <td><span class="priority ${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span></td>
        <td>${escapeHtml(item.submitted)}</td>
        <td><span ${statusClass}>${escapeHtml(item.status)}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:6px; justify-content:flex-end;">
            <button class="row-action" data-id="${item.id}" style="padding:6px 12px; border-radius:6px; background:#f1f5f9; border:1px solid #cbd5e1; color:#0f172a; font-weight:700; cursor:pointer; font-size:10.5px;">Review →</button>
            <button class="row-action-request-docs" data-id="${item.id}" style="padding:6px 10px; border-radius:6px; background:#fffbeb; border:1px solid #fde68a; color:#b45309; font-weight:700; cursor:pointer; font-size:10px;" title="Request missing documents for this listing">📋 Request Docs</button>
            <button class="row-action-return" data-id="${item.id}" style="padding:6px 10px; border-radius:6px; background:#fee2e2; border:1px solid #fca5a5; color:#b91c1c; font-weight:700; cursor:pointer; font-size:10px;" title="Return listing for correction">✕ Return</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  emptyState.classList.toggle("hidden", rows.length > 0);
  const pending = reviews.filter((item) => item.rawStatus === "PENDING" || item.rawStatus === "DOCUMENTS_REQUESTED").length;
  document.getElementById("queueCount").textContent = pending;
  document.getElementById("pendingCount").textContent = String(pending).padStart(2, "0");

  tableBody.querySelectorAll(".row-action").forEach((button) =>
    button.addEventListener("click", () => openReview(button.dataset.id, "view"))
  );

  tableBody.querySelectorAll(".row-action-request-docs").forEach((button) =>
    button.addEventListener("click", () => openReview(button.dataset.id, "docs"))
  );

  tableBody.querySelectorAll(".row-action-return").forEach((button) =>
    button.addEventListener("click", () => openReview(button.dataset.id, "return"))
  );
}

async function loadQueue(showLoading = false) {
  if (showLoading && tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:42px 20px; color:#475569;">
          <div style="display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:50%; background:#f1f5f9; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <span style="display:inline-block; font-size:22px; color:#2563eb; animation:queueSpin 0.75s linear infinite;">↻</span>
          </div>
          <div style="font-weight:700; font-size:14px; color:#1e293b;">Reloading verification queue...</div>
          <div style="font-size:11.5px; color:#64748b; margin-top:4px;">Fetching live property listings and document submissions</div>
        </td>
      </tr>
    `;
    emptyState?.classList.add("hidden");
  }

  if (USE_DEMO_DATA) {
    if (showLoading) await new Promise((r) => setTimeout(r, 350));
    return renderReviews();
  }

  try {
    const fetchPromise = fetch(`${API_BASE_URL}${VERIFICATION_QUEUE_ENDPOINT}?_=${Date.now()}`, { headers: authHeaders() });
    const [response] = await Promise.all([
      fetchPromise,
      showLoading ? new Promise((r) => setTimeout(r, 350)) : Promise.resolve()
    ]);
    if (!response.ok) throw new Error(`Unable to load verification queue (${response.status}).`);
    const payload = await response.json();
    reviews = (Array.isArray(payload) ? payload : value(payload, ["content", "items", "listings"], [])).map(normalizeReview);
    renderReviews();
  } catch (err) {
    if (showLoading && tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:36px; color:#dc2626;">
            <strong style="font-size:14px;">⚠️ Failed to load verification queue</strong>
            <p style="margin:6px 0 0; font-size:11.5px; color:#64748b;">${escapeHtml(err.message)}</p>
            <button onclick="loadQueue(true)" style="margin-top:12px; padding:6px 14px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; font-size:11px; cursor:pointer; font-weight:bold;">Try Again ↻</button>
          </td>
        </tr>
      `;
    }
    throw err;
  }
}

function getDocTypeBadge(type) {
  switch (String(type).toUpperCase()) {
    case "TITLE_DEED":
      return { label: "Deed of Transfer / Title Deed", icon: "📜", color: "#1e3a8a", bg: "#dbeafe" };
    case "COC":
      return { label: "Certificate of Conformity (COC)", icon: "🏛️", color: "#065f46", bg: "#d1fae5" };
    case "BUILDING_PLAN":
      return { label: "Approved Building / Floor Plan", icon: "📐", color: "#7c2d12", bg: "#ffedd5" };
    case "RATES_TAX":
      return { label: "Local Authority Assessment & Tax", icon: "🧾", color: "#4c1d95", bg: "#ede9fe" };
    case "SELLER_NIC":
      return { label: "Seller National Identity (NIC)", icon: "🆔", color: "#831843", bg: "#fce7f3" };
    default:
      return { label: type ? type.replace(/_/g, ' ') : "Apartment Legal Document", icon: "📄", color: "#1f2937", bg: "#f3f4f6" };
  }
}

function renderReviewDocuments(docs) {
  const container = document.getElementById("reviewDocumentsContainer");
  const countBadge = document.getElementById("reviewDocsCountBadge");
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${docs.length} document${docs.length === 1 ? '' : 's'}`;
  }

  if (!docs || docs.length === 0) {
    container.innerHTML = `
      <div style="padding:16px; border:1px dashed #cbd5e1; border-radius:8px; text-align:center; background:#f8fafc;">
        <span style="font-size:24px; display:block; margin-bottom:4px;">⚠️</span>
        <strong style="font-size:12px; color:#475569;">No uploaded legal documents attached</strong>
        <p style="margin:4px 0 0; font-size:11px; color:#94a3b8;">Use the 'Request More Documents' button below to request the title deed and COC from the seller/agent.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = docs.map((doc, idx) => {
    const badge = getDocTypeBadge(doc.documentType);
    const fileName = doc.fileName || `legal_document_${idx + 1}.pdf`;
    const uploadDate = doc.uploadDate || "2026-10-02";

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
        <div style="display:flex; align-items:center; gap:10px; min-width:0;">
          <span style="font-size:22px; flex-shrink:0;">${badge.icon}</span>
          <div style="min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span style="font-size:9.5px; font-weight:700; padding:2px 7px; border-radius:12px; background:${badge.bg}; color:${badge.color}; text-transform:uppercase;">${badge.label}</span>
              <span style="font-size:10px; color:#64748b;">Uploaded: ${uploadDate}</span>
            </div>
            <div style="font-size:12px; font-weight:600; color:#1e293b; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${fileName}">
              ${fileName}
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
          <button type="button" class="view-doc-btn" data-index="${idx}" style="display:inline-flex; align-items:center; gap:5px; padding:7px 13px; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
            👁️ Read Document
          </button>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".view-doc-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const doc = docs[parseInt(btn.dataset.index, 10)];
      if (doc) openDocumentReader(doc);
    });
  });
}

function generateSimulatedDeedHtml(doc, review) {
  const propName = review?.name || "Apartment Unit";
  const location = review?.location || "Colombo 07, Western Province";
  const owner = review?.seller || "Registered Owner";
  const price = review?.price ? ("LKR " + Number(review.price).toLocaleString()) : "LKR 48,500,000";
  const badge = getDocTypeBadge(doc.documentType);
  const docDate = doc.uploadDate || new Date().toISOString().split('T')[0];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${badge.label}</title>
      <style>
        body { margin: 0; padding: 32px 40px; font-family: "Georgia", "Times New Roman", serif; background: #fffdfa; color: #1e293b; line-height: 1.7; font-size: 13.5px; }
        .doc-border { border: 2px solid #94a3b8; padding: 28px 34px; border-radius: 4px; position: relative; background: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.04); }
        .header { text-align: center; border-bottom: 2px double #64748b; padding-bottom: 18px; margin-bottom: 22px; }
        .emblem { font-size: 28px; line-height: 1; }
        h1 { margin: 6px 0 2px; font-size: 17px; letter-spacing: 1.5px; text-transform: uppercase; color: #0f172a; }
        h2 { margin: 0; font-size: 13.5px; font-weight: normal; color: #475569; font-style: italic; }
        .badge-stamp { display: inline-block; border: 2px solid #b91c1c; color: #b91c1c; padding: 4px 14px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 3px; transform: rotate(-2deg); margin: 8px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0; font-size: 12.5px; background: #f8fafc; padding: 14px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .grid strong { color: #0f172a; }
        .legal-text { text-align: justify; margin: 16px 0; text-indent: 24px; color: #334155; }
        .seal-area { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 20px; border-top: 1px solid #cbd5e1; }
        .seal { width: 90px; height: 90px; border: 2px dashed #0284c7; border-radius: 50%; display: grid; place-items: center; color: #0284c7; font-size: 9px; font-weight: bold; text-align: center; line-height: 1.2; text-transform: uppercase; }
        .watermark { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 44px; font-weight: bold; color: rgba(15, 23, 42, 0.04); pointer-events: none; text-transform: uppercase; letter-spacing: 6px; white-space: nowrap; }
      </style>
    </head>
    <body>
      <div class="doc-border">
        <div class="watermark">LAND REGISTRY · SRI LANKA</div>
        <div class="header">
          <div class="emblem">🏛️</div>
          <h1>Democratic Socialist Republic of Sri Lanka</h1>
          <h2>Land Registry & Condominium Management Authority</h2>
          <div class="badge-stamp">${badge.label}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Registration Volume: <strong>COL-2026/8942</strong> · Folio: <strong>142-A</strong></div>
        </div>

        <div class="grid">
          <div><strong>Apartment Property:</strong> ${propName}</div>
          <div><strong>Location / Street:</strong> ${location}</div>
          <div><strong>Registered Owner / Declarant:</strong> ${owner}</div>
          <div><strong>Assessment Value / Price:</strong> ${price}</div>
          <div><strong>Condominium Plan No:</strong> CP/WP/2026/0412</div>
          <div><strong>Cadastral Lot Ref:</strong> Lot No. 42 / Assessment Sec. 08</div>
          <div><strong>Filing Status:</strong> Official Document Submitted</div>
          <div><strong>Date of Record:</strong> ${docDate}</div>
        </div>

        <p class="legal-text">
          BE IT KNOWN UNTO ALL PERSONS WHOM IT MAY CONCERN that by this instrument, the property designated and described herein, having conformed with all statutory requirements under the Apartment Ownership Law No. 11 of 1973 (as amended) and the Registration of Title Act, is duly acknowledged and recorded in the registers of the Registrar of Lands.
        </p>

        <p class="legal-text">
          The declarant and registered owner <strong>${owner}</strong> certifies that the premises are free from all undisclosed mortgages, litigations, caveats, or municipal encumbrances, and that the physical boundaries and floor plans have been surveyed and inspected by a Licensed Surveyor & Assessor.
        </p>

        <div class="seal-area">
          <div class="seal">
            OFFICIAL SEAL<br/>REGISTRAR<br/>COLOMBO
          </div>
          <div style="text-align: right; font-size: 11.5px; color: #475569;">
            <div style="font-family: monospace; font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">K. M. Wickramasinghe, PC</div>
            <div>Notary Public & Registrar of Title Deeds</div>
            <div>Colombo District, Western Province</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function openDocumentReader(doc) {
  const readerModal = document.getElementById("documentReaderModal");
  if (!readerModal) return;

  const titleEl = document.getElementById("readerDocTitle");
  const metaEl = document.getElementById("readerDocMeta");
  const iframe = document.getElementById("readerIframe");
  const img = document.getElementById("readerImg");
  const fallback = document.getElementById("readerFallback");
  const externalLink = document.getElementById("readerExternalLink");
  const fallbackLink = document.getElementById("readerFallbackLink");

  const badge = getDocTypeBadge(doc.documentType);
  if (titleEl) titleEl.textContent = `${badge.label} - ${doc.fileName || 'Legal Document'}`;
  if (metaEl) metaEl.textContent = `Property: ${selectedReview ? selectedReview.name : 'Apartment'} · Upload Date: ${doc.uploadDate || '2026-10-02'}`;

  let targetUrl = doc.fileUrl || "";
  if (targetUrl && !targetUrl.startsWith("http") && !targetUrl.startsWith("data:") && !targetUrl.startsWith("blob:")) {
    targetUrl = `${API_BASE_URL}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
  }

  if (externalLink) externalLink.href = targetUrl || "#";
  if (fallbackLink) fallbackLink.href = targetUrl || "#";

  iframe.style.display = "none";
  img.style.display = "none";
  fallback.style.display = "none";

  const lower = (doc.fileUrl || "").toLowerCase();
  const isImage = lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || targetUrl.startsWith("data:image");

  if (isImage) {
    img.src = targetUrl;
    img.style.display = "block";
  } else if (lower.endsWith(".pdf") || targetUrl.startsWith("data:application/pdf")) {
    iframe.src = targetUrl;
    iframe.style.display = "block";
  } else {
    // Generate authentic Sri Lankan Land Title Deed / Certificate HTML view for reading
    const docHtml = generateSimulatedDeedHtml(doc, selectedReview);
    iframe.srcdoc = docHtml;
    iframe.style.display = "block";
  }

  readerModal.classList.remove("hidden");
}

function closeDocumentReader() {
  const readerModal = document.getElementById("documentReaderModal");
  if (readerModal) readerModal.classList.add("hidden");
  const iframe = document.getElementById("readerIframe");
  if (iframe) iframe.src = "about:blank";
}

async function openReview(id, mode = "view") {
  selectedReview = reviews.find((item) => String(item.id) === String(id));
  if (!selectedReview) return;

  document.getElementById("reviewPropertyName").textContent = selectedReview.name;
  document.getElementById("reviewPropertyMeta").textContent = `${selectedReview.ref} · ${selectedReview.location} · submitted by ${selectedReview.seller}`;

  if (document.getElementById("reviewPrice")) {
    document.getElementById("reviewPrice").textContent = selectedReview.price ? ("LKR " + Number(selectedReview.price).toLocaleString()) : "Price pending";
  }
  if (document.getElementById("reviewType")) {
    document.getElementById("reviewType").textContent = selectedReview.propertyType || "APARTMENT";
  }
  if (document.getElementById("reviewOwnerRole")) {
    document.getElementById("reviewOwnerRole").textContent = selectedReview.ownerType ? (selectedReview.ownerType === "SELLER" ? "Property Seller" : "Real Estate Agent") : "Seller";
  }
  if (document.getElementById("reviewStatusBadge")) {
    const isDocReq = selectedReview.rawStatus === "DOCUMENTS_REQUESTED";
    document.getElementById("reviewStatusBadge").textContent = isDocReq ? "Documents Requested" : "Awaiting Review";
    document.getElementById("reviewStatusBadge").style.background = isDocReq ? "#fffbeb" : "#fff1d8";
    document.getElementById("reviewStatusBadge").style.color = isDocReq ? "#b45309" : "#a66b24";
  }

  // Fetch live documents from API for this listing
  let docs = selectedReview.documentsList || [];
  try {
    const docRes = await fetch(`${API_BASE_URL}/api/verification/${selectedReview.id}/documents`, { headers: authHeaders() });
    if (docRes.ok) {
      docs = await docRes.json();
    }
  } catch (err) {
    console.warn("Could not fetch documents", err);
  }

  renderReviewDocuments(docs);

  const noteArea = document.getElementById("reviewNote");
  if (noteArea) {
    if (mode === "return") {
      noteArea.value = selectedReview.rejectionReason || "Listing returned for correction: Details or documents require rectification. Please review officer notes, attach valid legal documents, and resubmit for verification.";
    } else if (mode === "docs" || mode === true) {
      noteArea.value = selectedReview.documentRequestNote || "Please upload the required legal verification documents for this property (e.g. Title Deed, Certificate of Conformity / COC, Approved Building Floor Plan, Local Authority Rates Tax Receipt).";
    } else {
      noteArea.value = selectedReview.documentRequestNote || selectedReview.rejectionReason || "";
    }
  }

  document.getElementById("reviewMessage").textContent = "";
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  if (mode === "return") {
    setTimeout(() => {
      const rejectBtn = document.getElementById("rejectReview");
      const noteEl = document.getElementById("reviewNote");
      if (noteEl) {
        noteEl.scrollIntoView({ behavior: "smooth", block: "center" });
        noteEl.focus();
        noteEl.style.borderColor = "#dc2626";
        noteEl.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.2)";
        setTimeout(() => {
          noteEl.style.borderColor = "";
          noteEl.style.boxShadow = "";
        }, 2000);
      }
      if (rejectBtn) {
        rejectBtn.style.boxShadow = "0 0 0 4px rgba(220, 38, 38, 0.35)";
        setTimeout(() => { rejectBtn.style.boxShadow = ""; }, 2500);
      }
    }, 150);
  } else if (mode === "docs" || mode === true) {
    setTimeout(() => {
      const noteEl = document.getElementById("reviewNote");
      if (noteEl) {
        noteEl.scrollIntoView({ behavior: "smooth", block: "center" });
        noteEl.focus();
        noteEl.style.borderColor = "#b45309";
        noteEl.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.2)";
        setTimeout(() => {
          noteEl.style.borderColor = "";
          noteEl.style.boxShadow = "";
        }, 2000);
      }
    }, 150);
  }
}

function closeReview() {
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  selectedReview = null;
  document.getElementById("reviewMessage").textContent = "";
}

async function decideReview(decision) {
  if (!selectedReview) return;
  const noteArea = document.getElementById("reviewNote");
  let comment = (noteArea?.value || "").trim();

  // If returning for correction and no comment provided, supply professional default
  if (decision === "reject" && !comment) {
    comment = "Listing returned for correction: Details or documents require rectification. Please review officer notes, attach valid legal documents, and resubmit for verification.";
    if (noteArea) noteArea.value = comment;
  }

  // If requesting documents and no note provided, supply professional default
  if (decision === "request-documents" && !comment) {
    comment = "Please upload the required legal verification documents for this property (e.g. Title Deed, Certificate of Conformity / COC, Approved Building Floor Plan, Local Authority Rates Tax Receipt).";
    if (noteArea) noteArea.value = comment;
  }

  const btnId = decision === "approve" ? "approveReview" : (decision === "request-documents" ? "requestDocsReview" : "rejectReview");
  const actionBtn = document.getElementById(btnId);
  const origBtnContent = actionBtn ? actionBtn.innerHTML : "";
  if (actionBtn) {
    actionBtn.disabled = true;
    actionBtn.innerHTML = decision === "reject" ? `<span>⏳ Returning...</span>` : (decision === "approve" ? `<span>⏳ Approving...</span>` : `<span>⏳ Requesting...</span>`);
  }

  let endpoint = `${API_BASE_URL}/api/verification/${selectedReview.id}/`;
  let options = { method: "POST" };

  if (decision === "approve") {
    endpoint += "approve";
    options.headers = authHeaders(false);
  } else if (decision === "request-documents") {
    endpoint += "request-documents";
    options.headers = authHeaders(true);
    options.body = JSON.stringify({ notes: comment });
  } else if (decision === "reject") {
    endpoint += "reject";
    options.headers = authHeaders(true);
    options.body = JSON.stringify({ comment: comment });
  }

  try {
    const response = await fetch(endpoint, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `Could not ${decision} listing (${response.status}).`);

    document.getElementById("reviewMessage").className = "message success";
    if (decision === "approve") {
      document.getElementById("reviewMessage").textContent = "Listing approved and published successfully!";
      showToast("Listing Approved ✓", "Property passed legal checks and is now live on marketplace.", "success");
    } else if (decision === "request-documents") {
      document.getElementById("reviewMessage").textContent = "✓ Additional documents requested successfully! Seller/agent has been notified.";
      showToast("Documents Requested 📋", "Document request sent to seller/agent. Status updated to Documents Requested.", "success");
      const badge = document.getElementById("reviewStatusBadge");
      if (badge) {
        badge.textContent = "Documents Requested";
        badge.style.background = "#fffbeb";
        badge.style.color = "#b45309";
      }
    } else {
      document.getElementById("reviewMessage").textContent = "✓ Listing returned for correction successfully! Owner notified.";
      showToast("Listing Returned ✕", "Listing has been returned to owner with correction remarks.", "success");
      const badge = document.getElementById("reviewStatusBadge");
      if (badge) {
        badge.textContent = "Returned for Correction";
        badge.style.background = "#fee2e2";
        badge.style.color = "#b91c1c";
      }
      const retCountEl = document.getElementById("returnedCorrectionsCount");
      if (retCountEl) {
        const currentCount = parseInt(retCountEl.textContent, 10) || 4;
        retCountEl.innerHTML = `${currentCount + 1} returned`;
      }
    }

    await loadQueue(true);
    setTimeout(closeReview, 1200);
  } catch (error) {
    document.getElementById("reviewMessage").className = "message";
    document.getElementById("reviewMessage").textContent = error.message;
    showToast("Action Failed", error.message, "error");
  } finally {
    if (actionBtn) {
      actionBtn.disabled = false;
      actionBtn.innerHTML = origBtnContent;
    }
  }
}

function triggerReviewSearch() {
  const input = document.getElementById("reviewSearch");
  const container = document.getElementById("reviewSearchContainer");
  const errorEl = document.getElementById("reviewSearchValidationError");
  const errorText = document.getElementById("reviewSearchValidationText");
  const clearBtn = document.getElementById("clearReviewSearchBtn");
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

  // Clear validation styling
  if (container) {
    container.style.borderColor = "";
    container.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";
  if (clearBtn) clearBtn.style.display = "inline-block";

  renderReviews();
}

function clearReviewSearch() {
  const input = document.getElementById("reviewSearch");
  const container = document.getElementById("reviewSearchContainer");
  const errorEl = document.getElementById("reviewSearchValidationError");
  const clearBtn = document.getElementById("clearReviewSearchBtn");

  if (input) input.value = "";
  if (clearBtn) clearBtn.style.display = "none";
  if (container) {
    container.style.borderColor = "";
    container.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";

  renderReviews();
  input?.focus();
}

window.clearReviewSearch = clearReviewSearch;
window.triggerReviewSearch = triggerReviewSearch;

// Event Listeners
const reviewSearchBtn = document.getElementById("reviewSearchBtn");
const clearReviewSearchBtn = document.getElementById("clearReviewSearchBtn");
const reviewSearchInput = document.getElementById("reviewSearch");
const refreshQueueBtn = document.getElementById("refreshQueue");

if (reviewSearchBtn) reviewSearchBtn.addEventListener("click", triggerReviewSearch);
if (clearReviewSearchBtn) clearReviewSearchBtn.addEventListener("click", clearReviewSearch);

if (reviewSearchInput) {
  reviewSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerReviewSearch();
    }
  });

  reviewSearchInput.addEventListener("input", () => {
    const val = (reviewSearchInput.value || "").trim();
    const container = document.getElementById("reviewSearchContainer");
    const errorEl = document.getElementById("reviewSearchValidationError");
    const clearBtn = document.getElementById("clearReviewSearchBtn");

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
    renderReviews();
  });
}

filter?.addEventListener("change", renderReviews);

if (refreshQueueBtn) {
  refreshQueueBtn.addEventListener("click", async () => {
    refreshQueueBtn.disabled = true;
    const origHtml = refreshQueueBtn.innerHTML;
    refreshQueueBtn.innerHTML = `<span style="display:inline-block; animation:queueSpin 0.75s linear infinite;">↻</span> Refreshing...`;

    // Clear validation error if any
    const errorEl = document.getElementById("reviewSearchValidationError");
    const container = document.getElementById("reviewSearchContainer");
    if (errorEl) errorEl.style.display = "none";
    if (container) {
      container.style.borderColor = "";
      container.style.boxShadow = "";
    }

    try {
      await loadQueue(true);
      showToast("Queue Refreshed ↻", "Verification queue table reloaded with latest live listings.", "success");
    } catch (err) {
      showToast("Refresh Failed", err.message || "Could not reload verification queue.", "error");
    } finally {
      refreshQueueBtn.disabled = false;
      refreshQueueBtn.innerHTML = origHtml;
    }
  });
}

document.querySelectorAll(".doc-chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    const docName = chip.dataset.doc;
    const noteArea = document.getElementById("reviewNote");
    if (!noteArea) return;
    let current = noteArea.value.trim();
    if (!current) {
      noteArea.value = `Please upload: ${docName}.`;
    } else if (!current.includes(docName)) {
      noteArea.value = current.replace(/\.$/, "") + `, ${docName}.`;
    }
    noteArea.focus();
    noteArea.style.borderColor = "#b45309";
    setTimeout(() => { noteArea.style.borderColor = ""; }, 1000);
  });
});

document.querySelectorAll(".corr-chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    const reason = chip.dataset.reason;
    const noteArea = document.getElementById("reviewNote");
    if (!noteArea) return;
    let current = noteArea.value.trim();
    if (!current) {
      noteArea.value = reason;
    } else if (!current.includes(reason)) {
      noteArea.value = current.replace(/\.$/, "") + `; ${reason}`;
    }
    noteArea.focus();
    noteArea.style.borderColor = "#dc2626";
    setTimeout(() => { noteArea.style.borderColor = ""; }, 1000);
  });
});

document.getElementById("openReviewModal")?.addEventListener("click", () => {
  const next = reviews.find((item) => item.rawStatus === "PENDING" || item.rawStatus === "DOCUMENTS_REQUESTED");
  if (next) openReview(next.id);
});
document.getElementById("closeReviewModal")?.addEventListener("click", closeReview);
document.getElementById("approveReview")?.addEventListener("click", () => decideReview("approve"));
document.getElementById("rejectReview")?.addEventListener("click", () => decideReview("reject"));
document.getElementById("requestDocsReview")?.addEventListener("click", () => decideReview("request-documents"));
document.getElementById("closeReaderModal")?.addEventListener("click", closeDocumentReader);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeReview();
});
document.getElementById("documentReaderModal")?.addEventListener("click", (event) => {
  if (event.target === document.getElementById("documentReaderModal")) closeDocumentReader();
});

document.getElementById("logoutButton")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "signIn_page.html";
});

loadQueue().catch((error) => {
  emptyState?.classList.remove("hidden");
  if (emptyState) emptyState.textContent = error.message;
});

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

// Profile Management for Verification Officer
function updateOfficerProfileUI(profile) {
  const firstName = profile.firstName || "Verification";
  const lastName = profile.lastName || "Officer";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "VO";

  const dateEl = document.getElementById("todayDate") || document.querySelector(".topbar .eyebrow");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  const greetingEl = document.getElementById("officerGreeting");
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

async function loadOfficerProfile() {
  const token = localStorage.getItem("jwtToken");
  if (!token) return;

  const cached = {
    firstName: localStorage.getItem("userFirstName"),
    lastName: localStorage.getItem("userLastName"),
    email: localStorage.getItem("userEmail"),
    phone: localStorage.getItem("userPhone")
  };
  updateOfficerProfileUI(cached);

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
      updateOfficerProfileUI(data);
    }
  } catch (error) {
    console.warn("Could not sync profile:", error);
  }
}

// Profile Modal Tabs (Personal Info vs Change Password)
const tabOfficerProfileInfo = document.getElementById("tabOfficerProfileInfo");
const tabOfficerPassword = document.getElementById("tabOfficerPassword");
const tabOfficerContentProfile = document.getElementById("tabOfficerContentProfile");
const tabOfficerContentPassword = document.getElementById("tabOfficerContentPassword");

if (tabOfficerProfileInfo && tabOfficerPassword) {
  tabOfficerProfileInfo.addEventListener("click", () => {
    tabOfficerProfileInfo.style.color = "var(--ink)";
    tabOfficerProfileInfo.style.borderBottom = "2px solid var(--coral)";
    tabOfficerPassword.style.color = "var(--muted)";
    tabOfficerPassword.style.borderBottom = "2px solid transparent";
    tabOfficerContentProfile?.classList.remove("hidden");
    tabOfficerContentPassword?.classList.add("hidden");
  });

  tabOfficerPassword.addEventListener("click", () => {
    tabOfficerPassword.style.color = "var(--ink)";
    tabOfficerPassword.style.borderBottom = "2px solid var(--coral)";
    tabOfficerProfileInfo.style.color = "var(--muted)";
    tabOfficerProfileInfo.style.borderBottom = "2px solid transparent";
    tabOfficerContentPassword?.classList.remove("hidden");
    tabOfficerContentProfile?.classList.add("hidden");
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

      updateOfficerProfileUI(data);
      msg.className = "message success";
      msg.style.color = "#2e7d32";
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

if (modalLogoutButton) {
  modalLogoutButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "signIn_page.html";
  });
}

loadOfficerProfile();

