const API_BASE_URL = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";
const LISTINGS_ENDPOINT = "/api/listings";
const BOOKINGS_ENDPOINT = "/api/bookings";
const NOTIFICATIONS_ENDPOINT = "/api/notifications";
const USE_DEMO_DATA = false;

let homes = [];
let savedHomes = new Set(JSON.parse(localStorage.getItem("savedListingIds") || "[]"));
let knownBookingStatuses = {};
const grid = document.getElementById("homeGrid");

function authHeaders(isJson = false) {
  const token = localStorage.getItem("jwtToken") || "";
  const headers = { Authorization: `Bearer ${token}` };
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
}

function value(item, keys, fallback = "—") {
  for (const key of keys) {
    if (item?.[key] !== undefined && item[key] !== null) return item[key];
  }
  return fallback;
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

function getAmenityIcon(name) {
  if (!name) return "✦";
  const s = name.toLowerCase();
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

function normalizeHome(item) {
  const price = Number(value(item, ["price"], 0));
  const ownerType = value(item, ["ownerType"], "AGENT");
  const ownerName = value(item, ["ownerName"], "");
  const ownerVerified = Boolean(item.ownerVerified);
  const ownerPlan = value(item, ["ownerPlan"], "FREE");
  return {
    id: value(item, ["id", "listingId"]),
    name: value(item, ["title", "name"], "Apartment"),
    location: [value(item, ["city"], ""), value(item, ["street"], "")].filter(Boolean).join(" · "),
    price: price ? `LKR ${price.toLocaleString()}` : "Price on request",
    rawPrice: price,
    beds: value(item, ["propertyType"], "Apartment"),
    tag: "READY",
    ownerType: ownerType,
    ownerName: ownerName,
    ownerVerified: ownerVerified,
    ownerPlan: ownerPlan,
    ownerPhone: value(item, ["ownerPhone"], ""),
    ownerEmail: value(item, ["ownerEmail"], ""),
    ownerLicenseNumber: value(item, ["ownerLicenseNumber"], ""),
    ownerRating: value(item, ["ownerRating"], null),
    favoriteCount: Number(value(item, ["favoriteCount"], 0)),
    ownerId: value(item, ["ownerId"], null),
    description: value(item, ["description"], ""),
    street: value(item, ["street"], ""),
    city: value(item, ["city"], ""),
    postalCode: value(item, ["postalCode"], ""),
    amenities: Array.isArray(item.amenities) ? item.amenities : [],
    availabilitySchedule: value(item, ["availabilitySchedule"], ""),
    image: value(item, ["imageUrl", "coverImage"], "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80")
  };
}

let activeDetailHomeId = null;

function openApartmentDetailsModal(homeId) {
  const home = homes.find(h => String(h.id) === String(homeId));
  if (!home) return;
  activeDetailHomeId = home.id;

  const modal = document.getElementById("apartmentDetailsModal");
  if (!modal) return;

  // Set Hero image
  const imgEl = document.getElementById("detailModalImage");
  if (imgEl) imgEl.src = home.image;

  // Verified listing badge & Property type
  const verifiedBadge = document.getElementById("detailModalVerifiedBadge");
  if (verifiedBadge) {
    if (home.ownerVerified) {
      verifiedBadge.style.display = "inline-flex";
      verifiedBadge.textContent = home.ownerType === "SELLER" 
        ? (window.t ? window.t("badge_verified_seller_listing") : "✓ Verified Seller Listing")
        : (window.t ? window.t("badge_verified_agent_listing") : "✓ Verified Agent Listing");
    } else {
      verifiedBadge.style.display = "none";
    }
  }

  const propTypeBadge = document.getElementById("detailModalPropertyType");
  if (propTypeBadge) propTypeBadge.textContent = home.beds || "Apartment";

  const eyebrowEl = document.getElementById("detailModalEyebrow");
  if (eyebrowEl) {
    eyebrowEl.textContent = `${(home.beds || "APARTMENT").toUpperCase()} · ${(home.city || "COLOMBO").toUpperCase()}`;
  }

  const titleEl = document.getElementById("detailModalTitle");
  if (titleEl) titleEl.textContent = home.name;

  const addrEl = document.getElementById("detailModalAddress");
  if (addrEl) addrEl.textContent = `📍 ${home.location || home.city || "Sri Lanka"}`;

  const priceEl = document.getElementById("detailModalPrice");
  if (priceEl) priceEl.textContent = home.price;

  // Description
  const descEl = document.getElementById("detailModalDescription");
  if (descEl) {
    descEl.textContent = home.description || (window.t ? window.t("default_apartment_desc") : "Exquisite apartment featuring premium finishes, expansive living spaces, excellent ventilation, and prime urban accessibility. Schedule a private viewing to inspect this property.");
  }

  // Specs
  const specType = document.getElementById("detailModalSpecType");
  if (specType) specType.textContent = home.beds || "Apartment";

  const specCity = document.getElementById("detailModalSpecCity");
  if (specCity) specCity.textContent = home.city || (home.location ? home.location.split("·")[0].trim() : "Colombo");

  const specPostal = document.getElementById("detailModalSpecPostal");
  if (specPostal) specPostal.textContent = home.postalCode || "00100";

  // Amenities Grid & Count
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
      amenGrid.innerHTML = `<span style="font-size:12px; color:#64748b; font-style:italic;">${window.t ? window.t("no_amenities_listed") : "No specific amenities listed for this apartment yet."}</span>`;
    }
  }

  // Agent / Seller Information Card
  const agentName = home.ownerName || (home.ownerType === "SELLER" ? "Private Property Owner" : "Authorized Real Estate Agent");
  const agentInitial = (agentName.trim()[0] || "A").toUpperCase();
  const agentAvatar = document.getElementById("detailModalAgentAvatar");
  if (agentAvatar) agentAvatar.textContent = agentInitial;

  const agentNameEl = document.getElementById("detailModalAgentName");
  if (agentNameEl) agentNameEl.textContent = agentName;

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
      ? (window.t ? window.t("agent_role_seller") : "Direct Property Owner · Verified Titleholder")
      : (window.t ? window.t("agent_role_agent") : "Licensed Real Estate Specialist · Nook & Key Partner");
  }

  const ratingEl = document.getElementById("detailModalAgentRating");
  if (ratingEl) {
    ratingEl.textContent = home.ownerType === "SELLER" ? "✓ Verified Owner" : "✓ Verified Agent";
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

  // Update Save button state inside modal
  updateDetailModalSaveBtn(home.id);

  // Show Modal
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function updateDetailModalSaveBtn(homeId) {
  const icon = document.getElementById("detailModalSaveIcon");
  const text = document.getElementById("detailModalSaveText");
  const btn = document.getElementById("detailModalSaveBtn");
  if (!btn || !icon || !text) return;
  const isSaved = savedHomes.has(Number(homeId));
  icon.textContent = isSaved ? "♥" : "♡";
  text.textContent = isSaved ? (window.t ? window.t("saved_residence_btn") : "Saved to Shortlist") : (window.t ? window.t("save_residence_btn") : "Save Residence");
  btn.style.color = isSaved ? "#c85b47" : "#102a2c";
}

function closeApartmentDetailsModal() {
  const modal = document.getElementById("apartmentDetailsModal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function syncFavoriteWithBackend(id, isFavorite) {
  if (!id) return;
  fetch(`${API_BASE_URL}/api/listings/${id}/favorite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(localStorage.getItem("token") ? { "Authorization": `Bearer ${localStorage.getItem("token")}` } : {})
    },
    body: JSON.stringify({ isFavorite })
  })
  .then(res => res.json())
  .then(data => {
    const home = homes.find(h => Number(h.id) === Number(id));
    if (home && data.favoriteCount !== undefined) {
      home.favoriteCount = data.favoriteCount;
      renderHomes();
    }
  })
  .catch(err => console.warn("Failed to sync favorite with backend:", err));
}

function initApartmentDetailsModal() {
  const modal = document.getElementById("apartmentDetailsModal");
  const closeBtn1 = document.getElementById("closeApartmentDetailsModal");
  const closeBtn2 = document.getElementById("closeApartmentDetailsModalBtn");
  const saveBtn = document.getElementById("detailModalSaveBtn");
  const proceedBtn = document.getElementById("detailModalProceedBookingBtn");

  if (closeBtn1) closeBtn1.addEventListener("click", closeApartmentDetailsModal);
  if (closeBtn2) closeBtn2.addEventListener("click", closeApartmentDetailsModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeApartmentDetailsModal();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!activeDetailHomeId) return;
      const id = Number(activeDetailHomeId);
      const isNowSaved = !savedHomes.has(id);
      if (isNowSaved) {
        savedHomes.add(id);
      } else {
        savedHomes.delete(id);
      }
      localStorage.setItem("savedListingIds", JSON.stringify([...savedHomes]));
      renderHomes();
      renderSavedHomes();
      updateDetailModalSaveBtn(activeDetailHomeId);
      syncFavoriteWithBackend(id, isNowSaved);
    });
  }

  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      if (!activeDetailHomeId) return;
      const home = homes.find(h => String(h.id) === String(activeDetailHomeId));
      closeApartmentDetailsModal();
      if (home) {
        openBookingModal(home.id, home.name);
      }
    });
  }
}

let selectedAmenityFilters = new Set();

function populateCityFilterOptions() {
  const citySelect = document.getElementById("filterCity");
  if (!citySelect) return;
  const currentVal = citySelect.value;
  const cities = new Set();
  homes.forEach(h => {
    if (h.city && h.city.trim()) cities.add(h.city.trim());
  });
  const sortedCities = Array.from(cities).sort();
  citySelect.innerHTML = `<option value="ALL">All Cities (Island-wide)</option>` +
    sortedCities.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (currentVal && (sortedCities.includes(currentVal) || currentVal === "ALL")) {
    citySelect.value = currentVal;
  }
}

function populateAmenityFilterChips() {
  const container = document.getElementById("amenityFilterChips");
  if (!container) return;

  const allAmenities = new Set([
    "Swimming Pool", "Fitness Center / Gym", "24/7 Security", 
    "Reserved Car Parking", "Backup Generator", "High-speed Elevator", "Balcony / View", "Play Area / Garden"
  ]);
  homes.forEach(h => {
    (h.amenities || []).forEach(a => {
      if (a && a.trim()) allAmenities.add(a.trim());
    });
  });

  const sorted = Array.from(allAmenities).sort();
  container.innerHTML = sorted.map(a => {
    const isSelected = selectedAmenityFilters.has(a.toLowerCase());
    return `
      <button type="button" class="amenity-chip-btn ${isSelected ? 'active' : ''}" data-amenity="${escapeHtml(a.toLowerCase())}"
        style="padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${isSelected ? 'var(--green)' : 'var(--line)'}; background: ${isSelected ? '#e4efe8' : '#fff'}; color: ${isSelected ? 'var(--green)' : 'var(--ink)'}; display: inline-flex; align-items: center; gap: 5px;">
        <span>${getAmenityIcon(a)}</span>
        <span>${escapeHtml(a)}</span>
        ${isSelected ? '<span style="font-size: 10px; font-weight: bold;">✓</span>' : ''}
      </button>
    `;
  }).join("");

  container.querySelectorAll(".amenity-chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const am = btn.dataset.amenity;
      if (selectedAmenityFilters.has(am)) {
        selectedAmenityFilters.delete(am);
      } else {
        selectedAmenityFilters.add(am);
      }
      populateAmenityFilterChips();
      renderHomes();
    });
  });

  const badge = document.getElementById("activeAmenityCountBadge");
  if (badge) {
    badge.textContent = `${selectedAmenityFilters.size} selected`;
    badge.style.color = selectedAmenityFilters.size > 0 ? "var(--green)" : "var(--muted)";
    badge.style.fontWeight = selectedAmenityFilters.size > 0 ? "bold" : "normal";
  }
}

function renderHomes(overrideQuery) {
  const searchInput = document.getElementById("homeSearch");
  const query = (overrideQuery !== undefined ? overrideQuery : (searchInput ? searchInput.value : "")).toLowerCase().trim();
  const cityFilter = document.getElementById("filterCity")?.value || "ALL";
  const priceRange = document.getElementById("filterPriceRange")?.value || "ALL";
  const customMin = Number(document.getElementById("filterMinPrice")?.value || 0);
  const customMax = Number(document.getElementById("filterMaxPrice")?.value || Infinity);

  let filtered = homes.filter((home) => {
    // 1. Apartment name / keyword match
    const matchesQuery = !query || `${home.name} ${home.location} ${home.beds} ${home.description}`.toLowerCase().includes(query);
    if (!matchesQuery) return false;

    // 2. City filter match
    if (cityFilter !== "ALL") {
      const homeCity = (home.city || "").toLowerCase();
      const targetCity = cityFilter.toLowerCase();
      if (!homeCity.includes(targetCity) && !targetCity.includes(homeCity) && !(home.location || "").toLowerCase().includes(targetCity)) {
        return false;
      }
    }

    // 3. Price filter match
    const rawPrice = home.rawPrice || 0;
    if (priceRange === "0-25000000") {
      if (rawPrice > 25000000) return false;
    } else if (priceRange === "25000000-50000000") {
      if (rawPrice < 25000000 || rawPrice > 50000000) return false;
    } else if (priceRange === "50000000-100000000") {
      if (rawPrice < 50000000 || rawPrice > 100000000) return false;
    } else if (priceRange === "100000000-9999999999") {
      if (rawPrice < 100000000) return false;
    } else if (priceRange === "CUSTOM") {
      if (customMin > 0 && rawPrice < customMin) return false;
      if (customMax > 0 && rawPrice > customMax) return false;
    }

    // 4. Amenities match
    if (selectedAmenityFilters.size > 0) {
      const homeAmenities = (home.amenities || []).map(a => a.toLowerCase());
      for (const reqAmenity of selectedAmenityFilters) {
        const found = homeAmenities.some(ha => ha.includes(reqAmenity) || reqAmenity.includes(ha));
        if (!found) return false;
      }
    }

    return true;
  });

  // Update Status & Badges
  const summaryEl = document.getElementById("filterSummaryText");
  const countBadgeEl = document.getElementById("homesCountBadge");
  const clearBtn = document.getElementById("clearSearchBtn");

  const isFiltering = query || cityFilter !== "ALL" || priceRange !== "ALL" || selectedAmenityFilters.size > 0;
  if (clearBtn) clearBtn.style.display = isFiltering ? "inline-flex" : "none";

  if (summaryEl) {
    if (isFiltering) {
      const parts = [];
      if (query) parts.push(`"${query}"`);
      if (cityFilter !== "ALL") parts.push(`City: ${cityFilter}`);
      if (priceRange !== "ALL") parts.push(`Price: ${priceRange}`);
      if (selectedAmenityFilters.size > 0) parts.push(`${selectedAmenityFilters.size} amenities`);
      summaryEl.innerHTML = `Showing <strong>${filtered.length}</strong> matching (${parts.join(" · ")})`;
    } else {
      summaryEl.textContent = `Showing all ${homes.length} available residences`;
    }
  }

  if (countBadgeEl) {
    countBadgeEl.textContent = `${filtered.length} residence${filtered.length === 1 ? '' : 's'} found`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: white; border: 1px dashed var(--line); border-radius: 12px;">
        <p style="font-size: 28px; margin: 0 0 10px;">🔍</p>
        <h4 style="margin: 0 0 8px; font-size: 16px; color: var(--ink);">No properties found</h4>
        <p style="margin: 0 0 16px; color: var(--muted); font-size: 12px;">We couldn't find any apartments matching your selected search criteria.</p>
        <button type="button" class="secondary-button" onclick="clearSearch()" style="padding: 8px 18px; font-size: 11px; cursor:pointer;">Reset Search Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((home) => `
    <article class="home-card" data-home-id="${home.id}" style="cursor:pointer;" title="Click anywhere on card to view full apartment & agent details">
      <div class="home-image" style="background-image:url('${home.image}')">
        ${home.ownerVerified ? `
          <span style="position:absolute; top:10px; left:10px; background:rgba(255,255,255,0.94); backdrop-filter:blur(4px); color:#065f46; font-size:10px; font-weight:800; padding:3px 9px; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.12); display:inline-flex; align-items:center; gap:4px; border:1px solid #a7f3d0;">
            ${home.ownerType === 'SELLER' ? (window.t ? window.t('card_verified_seller') : '✓ Verified Seller') : (window.t ? window.t('card_verified_agent') : '✓ Verified Agent')}
          </span>
        ` : ''}
        ${home.ownerPlan === 'ELITE' ? `
          <span style="position:absolute; top:10px; right:10px; background:#b78749; color:white; font-size:9px; font-weight:800; padding:2px 8px; border-radius:12px; letter-spacing:0.5px;">
            ★ ELITE
          </span>
        ` : (home.ownerPlan === 'PRO' ? `
          <span style="position:absolute; top:10px; right:10px; background:#102a2c; color:white; font-size:9px; font-weight:800; padding:2px 8px; border-radius:12px; letter-spacing:0.5px;">
            PRO
          </span>
        ` : '')}
      </div>
      <div class="home-card-body">
        <h3>${escapeHtml(home.name)}</h3>
        <p>${escapeHtml(home.location)} · ${escapeHtml(home.beds)}</p>
        
        ${home.amenities && home.amenities.length > 0 ? `
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin:4px 0 8px;">
            ${home.amenities.slice(0, 3).map(a => `
              <span class="amenity-chip" style="font-size:9.5px; font-weight:600; padding:2px 7px; background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; border-radius:12px; display:inline-flex; align-items:center; gap:3px;">
                <span>${getAmenityIcon(a)}</span> <span>${escapeHtml(a)}</span>
              </span>
            `).join('')}
            ${home.amenities.length > 3 ? `
              <span style="font-size:9.5px; color:#64748b; font-weight:600; padding:2px 4px;">+${home.amenities.length - 3} more</span>
            ` : ''}
          </div>
        ` : ''}

        ${home.ownerName ? `
          <p style="margin:-2px 0 10px; font-size:11px; color:#64748b; display:flex; align-items:center; gap:4px;">
            <span>${home.ownerType === 'SELLER' ? '🏡' : '👔'}</span>
            <span>${window.t ? window.t('card_listed_by') : 'Listed by:'} <strong style="color:#102a2c;">${escapeHtml(home.ownerName)}</strong></span>
          </p>
        ` : ''}
        
        <div class="home-card-foot" style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:auto;">
          <strong>${home.price}</strong>
          <div style="display:flex; align-items:center; gap:6px;">
            <button type="button" class="secondary-button view-details-btn" data-home-id="${home.id}" style="padding:6px 10px; font-size:11px; white-space:nowrap; background:#f8fafc; border:1px solid #cbd5e1; color:#1e293b; border-radius:6px; cursor:pointer;">
              ${window.t ? window.t('card_view_details') : 'View Details'}
            </button>
            <button class="primary-button book-viewing-btn" data-home-id="${home.id}" data-home-name="${escapeHtml(home.name)}" style="padding:6px 12px; font-size:11px; white-space:nowrap;">
              ${window.t ? window.t('card_book_viewing') : 'Book Viewing'}
            </button>
            <button class="save-button ${savedHomes.has(home.id) ? "saved" : ""}" data-home-id="${home.id}" title="${savedHomes.has(home.id) ? 'Remove from saved' : 'Save home'}">
              ${savedHomes.has(home.id) ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  document.getElementById("savedCount").textContent = savedHomes.size;
  document.getElementById("savedStat").textContent = savedHomes.size;
  const countBadge = document.getElementById("savedCountBadge");
  if (countBadge) countBadge.textContent = `${savedHomes.size} saved`;

  grid.querySelectorAll(".home-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;
      const id = card.dataset.homeId;
      if (id) openApartmentDetailsModal(id);
    });
  });

  grid.querySelectorAll(".view-details-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      openApartmentDetailsModal(button.dataset.homeId);
    });
  });

  grid.querySelectorAll(".save-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = Number(button.dataset.homeId);
      const isNowSaved = !savedHomes.has(id);
      if (isNowSaved) {
        savedHomes.add(id);
      } else {
        savedHomes.delete(id);
      }
      localStorage.setItem("savedListingIds", JSON.stringify([...savedHomes]));
      renderHomes();
      renderSavedHomes();
      syncFavoriteWithBackend(id, isNowSaved);
    });
  });

  grid.querySelectorAll(".book-viewing-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      openBookingModal(button.dataset.homeId, button.dataset.homeName);
    });
  });
}

function renderSavedHomes() {
  const container = document.getElementById("savedResidenceContainer");
  const countBadge = document.getElementById("savedCountBadge");
  const savedCountEl = document.getElementById("savedCount");
  const savedStatEl = document.getElementById("savedStat");

  if (savedCountEl) savedCountEl.textContent = savedHomes.size;
  if (savedStatEl) savedStatEl.textContent = savedHomes.size;
  if (countBadge) countBadge.textContent = `${savedHomes.size} saved`;

  if (!container) return;

  const shortlisted = homes.filter((h) => savedHomes.has(Number(h.id)));

  if (shortlisted.length === 0) {
    container.innerHTML = `
      <div style="padding:22px 16px; text-align:center; color:#7a8681; border:1px dashed #d0c8b8; border-radius:10px; background:#fcfbf9;">
        <span style="font-size:26px; display:block; margin-bottom:5px; color:#c85b47;">♡</span>
        <strong style="display:block; color:#102a2c; font-size:13px; margin-bottom:3px;">No Saved Residences Yet</strong>
        <p style="margin:0; font-size:11px; line-height:1.4;">Click the heart icon (♡) on any apartment in the catalog above to save your favourite residences here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = shortlisted.map((home) => `
    <div class="saved-residence-card" data-home-id="${home.id}" style="display:flex; align-items:center; gap:12px; padding:12px 14px; border:1px solid #ded8cc; border-radius:10px; margin-bottom:10px; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.02); transition:all 0.2s ease; cursor:pointer;" title="Click to view details">
      <img src="${home.image}" alt="${escapeHtml(home.name)}" style="width:68px; height:54px; object-fit:cover; border-radius:8px; flex-shrink:0; background:#eee;" />
      <div style="flex:1; min-width:0;">
        <strong style="display:block; font-size:13px; color:#102a2c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(home.name)}</strong>
        <p style="margin:2px 0 0; font-size:11px; color:#7a8681; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(home.location)}</p>
        <span style="display:inline-block; font-size:12px; font-weight:800; color:#c85b47; margin-top:2px;">${home.price}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
        <div style="display:flex; gap:4px;">
          <button type="button" class="saved-quick-details-btn" data-home-id="${home.id}" style="padding:4px 8px; font-size:10px; white-space:nowrap; background:#f8fafc; border:1px solid #cbd5e1; border-radius:5px; cursor:pointer;">
            Details
          </button>
          <button class="primary-button saved-quick-book-btn" data-home-id="${home.id}" data-home-name="${escapeHtml(home.name)}" style="padding:5px 11px; font-size:10px; white-space:nowrap;">
            Book Viewing
          </button>
        </div>
        <button class="remove-saved-residence-btn" data-home-id="${home.id}" title="Remove from saved" style="border:none; background:transparent; color:#c85b47; font-size:11px; cursor:pointer; font-weight:700; padding:2px 4px;">
          ♥ Remove
        </button>
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".saved-residence-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;
      openApartmentDetailsModal(card.dataset.homeId);
    });
  });

  container.querySelectorAll(".saved-quick-details-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openApartmentDetailsModal(btn.dataset.homeId);
    });
  });

  container.querySelectorAll(".saved-quick-book-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openBookingModal(btn.dataset.homeId, btn.dataset.homeName);
    });
  });

  container.querySelectorAll(".remove-saved-residence-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.homeId);
      savedHomes.delete(id);
      localStorage.setItem("savedListingIds", JSON.stringify([...savedHomes]));
      renderHomes();
      renderSavedHomes();
      syncFavoriteWithBackend(id, false);
    });
  });
}

function triggerSearch() {
  const searchInput = document.getElementById("homeSearch");
  const searchContainer = document.getElementById("searchContainer");
  const errorEl = document.getElementById("searchValidationError");
  const errorText = document.getElementById("searchValidationText");
  const clearBtn = document.getElementById("clearSearchBtn");
  const clearInputBtn = document.getElementById("clearSearchInputBtn");
  const query = (searchInput?.value || "").trim();

  if (!query) {
    if (searchContainer) {
      searchContainer.classList.remove("has-error");
      void searchContainer.offsetWidth; // Force reflow to re-trigger shake animation
      searchContainer.classList.add("has-error");
      searchContainer.style.borderColor = "#dc2626";
      searchContainer.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.15)";
    }
    if (errorEl) {
      errorEl.style.display = "flex";
      if (errorText) {
        errorText.textContent = (window.t ? window.t("search_error_empty") : "") || "Please enter a search keyword (e.g., Colombo, 3 Bed, Penthouse) before searching.";
      }
    }
    searchInput?.focus();
    return;
  }

  if (searchContainer) {
    searchContainer.classList.remove("has-error");
    searchContainer.style.borderColor = "";
    searchContainer.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";
  if (clearBtn) clearBtn.style.display = "inline-flex";
  if (clearInputBtn) clearInputBtn.style.display = "inline-block";

  renderHomes(query);
}

window.addEventListener("languageChanged", () => {
  renderHomes();
  renderSavedHomes();
});

function clearSearch() {
  const searchInput = document.getElementById("homeSearch");
  const citySelect = document.getElementById("filterCity");
  const priceSelect = document.getElementById("filterPriceRange");
  const customBox = document.getElementById("customPriceBox");
  const minPrice = document.getElementById("filterMinPrice");
  const maxPrice = document.getElementById("filterMaxPrice");
  const searchContainer = document.getElementById("searchContainer");
  const errorEl = document.getElementById("searchValidationError");
  const clearBtn = document.getElementById("clearSearchBtn");
  const clearInputBtn = document.getElementById("clearSearchInputBtn");

  if (searchInput) searchInput.value = "";
  if (citySelect) citySelect.value = "ALL";
  if (priceSelect) priceSelect.value = "ALL";
  if (customBox) customBox.style.display = "none";
  if (minPrice) minPrice.value = "";
  if (maxPrice) maxPrice.value = "";
  selectedAmenityFilters.clear();

  if (searchContainer) {
    searchContainer.classList.remove("has-error");
    searchContainer.style.borderColor = "";
    searchContainer.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";
  if (clearBtn) clearBtn.style.display = "none";
  if (clearInputBtn) clearInputBtn.style.display = "none";

  populateAmenityFilterChips();
  renderHomes("");
  renderSavedHomes();
}

window.triggerSearch = triggerSearch;
window.clearSearch = clearSearch;

async function loadHomes() {
  if (USE_DEMO_DATA) {
    populateCityFilterOptions();
    populateAmenityFilterChips();
    renderHomes();
    renderSavedHomes();
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}${LISTINGS_ENDPOINT}`, { headers: authHeaders() });
    if (!response.ok) {
      grid.innerHTML = `<p class="message" style="padding:20px;color:#7a8681;">No active published listings found.</p>`;
      return;
    }
    homes = (await response.json()).map(normalizeHome);
    populateCityFilterOptions();
    populateAmenityFilterChips();
    renderHomes();
    renderSavedHomes();
  } catch (error) {
    grid.innerHTML = `<p class="message" style="padding:20px;color:#7a8681;">Welcome to Nook & Key. Explore homes as they become available.</p>`;
  }
}

// Booking Management
const bookingModal = document.getElementById("bookingModal");
const closeBookingModal = document.getElementById("closeBookingModal");
const cancelBookingBtn = document.getElementById("cancelBookingBtn");
const submitBookingForm = document.getElementById("submitBookingForm");

async function updateBookedSlotsForDate(listingId, selectedDate) {
  const timeSelect = document.getElementById("bookingViewingTime");
  if (!timeSelect) return;
  try {
    const res = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/listing/${listingId}/booked-slots`, {
      headers: authHeaders()
    });
    if (!res.ok) return;
    const booked = await res.json();
    Array.from(timeSelect.options).forEach((opt) => {
      if (!opt.value) return;
      const isBooked = booked.some((b) => b.viewingDate === selectedDate && b.viewingTime === opt.value);
      if (isBooked) {
        opt.disabled = true;
        opt.textContent = `${opt.value} (Already Booked)`;
      } else {
        opt.disabled = false;
        opt.textContent = opt.value;
      }
    });
  } catch (err) {
    console.warn("Could not fetch booked slots:", err);
  }
}

function openBookingModal(listingId, listingTitle) {
  document.getElementById("bookingListingId").value = listingId;
  document.getElementById("bookingPropertyTitle").textContent = `Book Viewing: ${listingTitle}`;
  const dateInput = document.getElementById("bookingViewingDate");
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
  dateInput.value = today;

  const msg = document.getElementById("bookingMessage");
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }

  const home = homes.find(h => String(h.id) === String(listingId));
  let sched = null;
  if (home && home.availabilitySchedule) {
    try {
      sched = typeof home.availabilitySchedule === "object"
        ? home.availabilitySchedule
        : JSON.parse(home.availabilitySchedule);
    } catch (e) {
      console.warn("Could not parse listing availabilitySchedule:", e);
    }
  }

  // Update schedule notice box
  const scheduleNotice = document.getElementById("bookingScheduleNotice");
  const scheduleNoticeText = document.getElementById("bookingScheduleNoticeText");
  if (scheduleNotice && scheduleNoticeText) {
    if (sched && Array.isArray(sched.availableDates) && sched.availableDates.length > 0) {
      const datesList = sched.availableDates.slice(0, 4).join(", ") + (sched.availableDates.length > 4 ? ` (+${sched.availableDates.length - 4} more)` : "");
      scheduleNoticeText.innerHTML = `Available on: <strong>${datesList}</strong> (${sched.availableSlots && sched.availableSlots.length > 0 ? sched.availableSlots.length + ' slots daily' : 'Normal hours'}).`;
      scheduleNotice.style.display = "block";
    } else if (sched && Array.isArray(sched.availableDays) && sched.availableDays.length > 0) {
      const formattedDays = sched.availableDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3).toLowerCase()).join(", ");
      scheduleNoticeText.innerHTML = `Available on <strong>${formattedDays}</strong> (${sched.availableSlots && sched.availableSlots.length > 0 ? sched.availableSlots.length + ' slots daily' : 'Normal hours'}).`;
      scheduleNotice.style.display = "block";
    } else {
      scheduleNotice.style.display = "none";
    }
  }

  // Populate time slots
  const timeSelect = document.getElementById("bookingViewingTime");
  if (timeSelect) {
    let slots = [
      "09:00 AM - 10:00 AM",
      "10:00 AM - 11:00 AM",
      "11:00 AM - 12:00 PM",
      "01:00 PM - 02:00 PM",
      "02:00 PM - 03:00 PM",
      "03:00 PM - 04:00 PM",
      "04:00 PM - 05:00 PM"
    ];
    if (sched && Array.isArray(sched.availableSlots) && sched.availableSlots.length > 0) {
      slots = sched.availableSlots;
    }
    timeSelect.innerHTML = `<option value="">-- Select Time Slot --</option>` +
      slots.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    timeSelect.value = "";
  }

  // Validate initial today date against owner's available days
  if (sched && Array.isArray(sched.availableDays) && sched.availableDays.length > 0) {
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dt = new Date(today + "T00:00:00");
    const dayOfWeek = dayNames[dt.getDay()];
    if (!sched.availableDays.some(d => d.toUpperCase() === dayOfWeek)) {
      for (let i = 1; i <= 7; i++) {
        const nextDt = new Date();
        nextDt.setDate(nextDt.getDate() + i);
        const nextIso = nextDt.toISOString().split("T")[0];
        const nextDayName = dayNames[nextDt.getDay()];
        if (sched.availableDays.some(d => d.toUpperCase() === nextDayName)) {
          dateInput.value = nextIso;
          break;
        }
      }
    }
  }

  updateBookedSlotsForDate(listingId, dateInput.value);

  bookingModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

let selectedBuyerPaymentMethod = "CARD";

function initBuyerPaymentMethodTabs() {
  const cardBtn = document.getElementById("buyerPayMethodCard");
  const cashBtn = document.getElementById("buyerPayMethodCash");
  const cardSec = document.getElementById("buyerCardPaymentSection");
  const cashSec = document.getElementById("buyerCashPaymentSection");
  const fillSandboxBtn = document.getElementById("buyerFillSandboxCardBtn");

  if (cardBtn && cashBtn) {
    cardBtn.addEventListener("click", () => {
      selectedBuyerPaymentMethod = "CARD";
      cardBtn.classList.add("active");
      cashBtn.classList.remove("active");
      if (cardSec) cardSec.style.display = "grid";
      if (cashSec) cashSec.style.display = "none";
    });

    cashBtn.addEventListener("click", () => {
      selectedBuyerPaymentMethod = "CASH";
      cashBtn.classList.add("active");
      cardBtn.classList.remove("active");
      if (cardSec) cardSec.style.display = "none";
      if (cashSec) cashSec.style.display = "block";
    });
  }

  if (fillSandboxBtn) {
    fillSandboxBtn.addEventListener("click", () => {
      const cardNum = document.getElementById("buyerCardNum");
      const cardExp = document.getElementById("buyerCardExp");
      const cardCvc = document.getElementById("buyerCardCvc");
      if (cardNum) cardNum.value = "4242 •••• •••• 4242";
      if (cardExp) cardExp.value = "12/28";
      if (cardCvc) cardCvc.value = "888";
    });
  }
}

function hideBookingModal() {
  bookingModal.classList.add("hidden");
  document.body.style.overflow = "";
}

if (closeBookingModal) closeBookingModal.addEventListener("click", hideBookingModal);
if (cancelBookingBtn) cancelBookingBtn.addEventListener("click", hideBookingModal);
if (bookingModal) {
  bookingModal.addEventListener("click", (e) => {
    if (e.target === bookingModal) hideBookingModal();
  });
}

document.getElementById("bookingViewingDate")?.addEventListener("change", (e) => {
  const listingId = document.getElementById("bookingListingId").value;
  const selectedDate = e.target.value;
  const msg = document.getElementById("bookingMessage");

  if (!selectedDate) return;

  const home = homes.find(h => String(h.id) === String(listingId));
  if (home && home.availabilitySchedule) {
    try {
      const sched = typeof home.availabilitySchedule === "object"
        ? home.availabilitySchedule
        : JSON.parse(home.availabilitySchedule);

      if (sched && Array.isArray(sched.availableDates) && sched.availableDates.length > 0) {
        if (!sched.availableDates.includes(selectedDate)) {
          if (msg) {
            msg.className = "message";
            msg.style.color = "#dc2626";
            msg.textContent = `⚠️ The host has designated specific viewing dates for this property: ${sched.availableDates.join(', ')}. Please choose one of these dates.`;
          }
          e.target.value = "";
          return;
        }
      } else if (sched && Array.isArray(sched.availableDays) && sched.availableDays.length > 0) {
        const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const dt = new Date(selectedDate + "T00:00:00");
        const dayOfWeek = dayNames[dt.getDay()];
        const isAllowed = sched.availableDays.some(d => d.toUpperCase() === dayOfWeek);
        if (!isAllowed) {
          const readableDays = sched.availableDays.map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()).join(", ");
          if (msg) {
            msg.className = "message";
            msg.style.color = "#dc2626";
            msg.textContent = `⚠️ The host is not available for viewings on ${dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase()}s. Available days: ${readableDays}.`;
          }
          e.target.value = "";
          return;
        }
      }
    } catch (err) {}
  }

  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }

  if (listingId && selectedDate) {
    updateBookedSlotsForDate(listingId, selectedDate);
  }
});

if (submitBookingForm) {
  submitBookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const listingId = document.getElementById("bookingListingId").value;
    const viewingDate = document.getElementById("bookingViewingDate").value;
    const viewingTime = document.getElementById("bookingViewingTime")?.value || "";
    const submitBtn = document.getElementById("confirmBookingBtn");
    const msg = document.getElementById("bookingMessage");

    if (!viewingDate) {
      msg.className = "message";
      msg.style.color = "#dc2626";
      msg.textContent = "Please select a viewing date.";
      return;
    }

    if (!viewingTime) {
      msg.className = "message";
      msg.style.color = "#dc2626";
      msg.textContent = "Please select a viewing time slot.";
      return;
    }

    const home = homes.find(h => String(h.id) === String(listingId));
    if (home && home.availabilitySchedule) {
      try {
        const sched = typeof home.availabilitySchedule === "object"
          ? home.availabilitySchedule
          : JSON.parse(home.availabilitySchedule);
        if (sched && Array.isArray(sched.availableDates) && sched.availableDates.length > 0) {
          if (!sched.availableDates.includes(viewingDate)) {
            msg.className = "message";
            msg.style.color = "#dc2626";
            msg.textContent = `Please choose an available calendar viewing date (${sched.availableDates.join(", ")}).`;
            return;
          }
        } else if (sched && Array.isArray(sched.availableDays) && sched.availableDays.length > 0) {
          const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
          const dt = new Date(viewingDate + "T00:00:00");
          const dayOfWeek = dayNames[dt.getDay()];
          if (!sched.availableDays.some(d => d.toUpperCase() === dayOfWeek)) {
            msg.className = "message";
            msg.style.color = "#dc2626";
            msg.textContent = `Please choose a date when the host is available (${sched.availableDays.join(", ")}).`;
            return;
          }
        }
      } catch (err) {}
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Processing Payment & Submitting...";
    msg.textContent = "";

    const paymentMethod = selectedBuyerPaymentMethod === "CASH" 
      ? "Cash / Bank Transfer" 
      : "Credit Card (Paddle Sandbox)";
    const txnRef = "TXN-ADV-" + Math.floor(100000 + Math.random() * 900000);

    try {
      const response = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          listingId: Number(listingId),
          viewingDate: viewingDate,
          viewingTime: viewingTime,
          advancePaymentAmount: window.CURRENT_BOOKING_ADVANCE || 5000.0,
          paymentMethod: paymentMethod,
          transactionReference: txnRef
        })
      });

      let errorMsg = `Booking failed (${response.status})`;
      try {
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          errorMsg = parsed.message || parsed.error || text;
        } catch {
          if (text) errorMsg = text;
        }
      } catch (e) {}

      if (!response.ok) {
        throw new Error(errorMsg);
      }

      msg.className = "message success";
      msg.style.color = "#16a34a";
      msg.textContent = "✓ Advance Payment of LKR 5,000 confirmed! Sent to Booking Manager for confirmation.";
      broadcastBookingSync("NEW_BOOKING", Number(listingId));
      setTimeout(() => {
        hideBookingModal();
        loadMyBookings();
        loadNotifications();
      }, 1500);

    } catch (err) {
      msg.className = "message";
      msg.style.color = "#dc2626";
      msg.style.fontWeight = "bold";
      msg.textContent = "⚠️ " + err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Pay LKR 5,000 & Confirm Booking →";
    }
  });
}

let currentViewingFilter = "CONFIRMED";
let cachedBuyerBookings = [];

function setupViewingFilterButtons() {
  const btnConfirmed = document.getElementById("filterViewingsConfirmed");
  const btnAll = document.getElementById("filterViewingsAll");
  const btnDisputed = document.getElementById("filterViewingsDisputed");

  if (btnConfirmed && btnAll && !btnConfirmed.dataset.listenerAttached) {
    btnConfirmed.dataset.listenerAttached = "true";
    btnConfirmed.addEventListener("click", () => {
      currentViewingFilter = "CONFIRMED";
      updateViewingFilterUI();
      renderBuyerViewingList();
    });

    btnAll.addEventListener("click", () => {
      currentViewingFilter = "ALL";
      updateViewingFilterUI();
      renderBuyerViewingList();
    });

    if (btnDisputed) {
      btnDisputed.addEventListener("click", () => {
        currentViewingFilter = "DISPUTED";
        updateViewingFilterUI();
        renderBuyerViewingList();
      });
    }
  }
}

function updateViewingFilterUI() {
  const btnConfirmed = document.getElementById("filterViewingsConfirmed");
  const btnAll = document.getElementById("filterViewingsAll");
  const btnDisputed = document.getElementById("filterViewingsDisputed");

  // Reset all
  [btnConfirmed, btnAll, btnDisputed].forEach(btn => {
    if (!btn) return;
    btn.style.background = "white";
    btn.style.color = "#64748b";
    btn.style.borderColor = "#cbd5e1";
    btn.style.fontWeight = "600";
  });

  if (currentViewingFilter === "CONFIRMED" && btnConfirmed) {
    btnConfirmed.style.background = "#102a2c";
    btnConfirmed.style.color = "white";
    btnConfirmed.style.borderColor = "#102a2c";
    btnConfirmed.style.fontWeight = "700";
  } else if (currentViewingFilter === "ALL" && btnAll) {
    btnAll.style.background = "#102a2c";
    btnAll.style.color = "white";
    btnAll.style.borderColor = "#102a2c";
    btnAll.style.fontWeight = "700";
  } else if (currentViewingFilter === "DISPUTED" && btnDisputed) {
    btnDisputed.style.background = "#ea580c";
    btnDisputed.style.color = "white";
    btnDisputed.style.borderColor = "#ea580c";
    btnDisputed.style.fontWeight = "700";
  }
}

function renderBuyerViewingList() {
  const container = document.querySelector(".viewing-list");
  if (!container) return;

  const acceptedBookings = cachedBuyerBookings.filter((b) => b.status === "ACCEPTED" || b.status === "CONFIRMED");
  const disputedBookings = cachedBuyerBookings.filter((b) => b.isDisputed);
  const confirmedFilterBadge = document.getElementById("confirmedFilterBadge");
  const allFilterBadge = document.getElementById("allFilterBadge");
  const disputedFilterBadge = document.getElementById("disputedFilterBadge");

  if (confirmedFilterBadge) confirmedFilterBadge.textContent = acceptedBookings.length;
  if (allFilterBadge) allFilterBadge.textContent = cachedBuyerBookings.length;
  if (disputedFilterBadge) disputedFilterBadge.textContent = disputedBookings.length;

  let displayList = cachedBuyerBookings;
  if (currentViewingFilter === "CONFIRMED") displayList = acceptedBookings;
  else if (currentViewingFilter === "DISPUTED") displayList = disputedBookings;

  if (displayList.length === 0) {
    container.innerHTML = currentViewingFilter === "CONFIRMED"
      ? `<div style="padding:22px 16px; text-align:center; color:#7a8681; border:1px dashed #d0c8b8; border-radius:10px; background:#fcfbf9;">
           <span style="font-size:24px; display:block; margin-bottom:4px;">📅</span>
           <strong style="display:block; color:#102a2c; font-size:13px; margin-bottom:2px;">No Confirmed Viewings</strong>
           <p style="margin:0; font-size:11px; line-height:1.4;">You do not have any accepted viewing appointments right now. Viewings confirmed by the Booking Manager will appear here.</p>
         </div>`
      : (currentViewingFilter === "DISPUTED"
        ? `<div style="padding:22px 16px; text-align:center; color:#7a8681; border:1px dashed #fed7aa; border-radius:10px; background:#fffaf0;">
             <span style="font-size:24px; display:block; margin-bottom:4px;">⚖️</span>
             <strong style="display:block; color:#c2410c; font-size:13px; margin-bottom:2px;">No Active Booking Disputes</strong>
             <p style="margin:0; font-size:11px; line-height:1.4;">None of your viewing appointments are under dispute mediation.</p>
           </div>`
        : `<p style="padding:15px 0;color:#7a8681;font-size:13px;">You have no viewings scheduled yet. Book a viewing from the apartments above.</p>`);
    return;
  }

  container.innerHTML = displayList.map((b) => {
    const statusClass = b.status === "CONFIRMED" || b.status === "ACCEPTED" ? "color:#2e7d32; background:#e8f5e9;"
      : b.status === "PENDING" ? "color:#b78103; background:#fff8e1;"
      : b.status === "CANCELLED" ? "color:#64748b; background:#f1f5f9; border:1px solid #cbd5e1;"
      : b.status === "REJECTED" ? "color:#c62828; background:#ffebee;"
      : "color:#1565c0; background:#e3f2fd;";

    const timeSlotDisplay = b.viewingTime ? ` · Time: <strong>${b.viewingTime}</strong>` : "";
    const canCancel = b.status === "PENDING" || b.status === "ACCEPTED";

    const refundNoticeHtml = b.cancelledAfterAccepted ? `
      <div style="font-size:11px; color:#b45309; font-weight:700; margin-top:5px; background:#fef3c7; padding:4px 8px; border-radius:6px; border:1px solid #fde68a;">
        ⚠️ Cancelled after accept · 50% Refund (${b.refundStatus === 'PARTIALLY_REFUNDED' ? '✓ Credited: LKR 2,500' : '⏳ Pending Manager Authorization: LKR 2,500'})
      </div>
    ` : (b.refundStatus === 'PARTIALLY_REFUNDED' ? `
      <div style="font-size:11px; color:#16a34a; font-weight:700; margin-top:4px;">
        ✓ 50% Refund Credited: LKR ${(b.refundAmount || 2500).toLocaleString()}
      </div>
    ` : '');

    const disputeNoticeHtml = b.isDisputed ? (
      b.disputeStatus === 'OPEN' ? `
        <div style="font-size:11px; color:#c2410c; font-weight:700; margin-top:5px; background:#fff7ed; padding:4px 8px; border-radius:6px; border:1px solid #fed7aa; display:inline-flex; align-items:center; gap:5px;">
          <span>⚠️</span> Dispute Under Review: <strong>${(b.disputeReason || 'General').replace(/_/g, ' ')}</strong> (Booking Manager Mediation Active)
        </div>
      ` : (b.disputeStatus === 'RESOLVED' ? `
        <div style="font-size:11px; color:#065f46; font-weight:700; margin-top:5px; background:#ecfdf5; padding:4px 8px; border-radius:6px; border:1px solid #a7f3d0;">
          ✓ Dispute Resolved: <strong>${(b.resolutionDecision || 'Documented').replace(/_/g, ' ')}</strong> ${b.resolutionNotes ? '— ' + b.resolutionNotes : ''}
          ${(b.resolutionDecision === 'RESCHEDULE' || b.isRescheduled) ? `
            <div style="color:#6d28d9; font-weight:700; margin-top:3px; font-size:10.5px;">
              🔄 Rescheduled Viewing Date: <u>${b.rescheduledDate || b.viewingDate}</u> ${b.rescheduledTime || b.viewingTime ? '· ' + (b.rescheduledTime || b.viewingTime) : ''}
              ${b.originalViewingDate ? `<span style="color:#8b5cf6; font-weight:normal;">(Original: ${b.originalViewingDate})</span>` : ''}
            </div>
          ` : ''}
        </div>
      ` : (b.disputeStatus === 'ESCALATED_TO_ADMIN' ? `
        <div style="font-size:11px; color:#b91c1c; font-weight:700; margin-top:5px; background:#fef2f2; padding:4px 8px; border-radius:6px; border:1px solid #fca5a5;">
          🚨 Dispute Escalated: Under Senior Administrative Arbitration
        </div>
      ` : ''))
    ) : '';

    const cancelBtnHtml = canCancel ? `
      <button class="cancel-booking-btn" data-id="${b.id}" data-status="${b.status}" data-property="${b.listingTitle || 'Apartment'}"
        style="padding:6px 12px; border:1px solid #fca5a5; background:#fff; color:#dc2626; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.2s;">
        Cancel Booking
      </button>
    ` : '';

    const canReportDispute = !b.isDisputed && (b.status === "ACCEPTED" || b.status === "PENDING" || b.status === "COMPLETED" || b.status === "CANCELLED");
    const disputeBtnHtml = canReportDispute ? `
      <button class="dispute-buyer-btn" data-id="${b.id}" data-property="${b.listingTitle || 'Apartment'}"
        style="padding:6px 11px; border:1px solid #fed7aa; background:#fffaf0; color:#c2410c; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.2s;" title="Flag an issue or dispute to the Booking Manager">
        ⚠️ Report Issue
      </button>
    ` : '';

    return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:14px 16px; margin-bottom:10px; border:1px solid #ded8cc; border-radius:10px; background:white; gap:12px; flex-wrap:wrap;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <strong style="font-size:14px; color:#102a2c;">${b.listingTitle || 'Apartment'}</strong>
            <span style="font-size:10px; font-weight:800; padding:2px 7px; border-radius:10px; background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;">
              Advance Paid: LKR ${(b.advancePaymentAmount || 5000).toLocaleString()}
            </span>
          </div>
          <p style="margin:4px 0 0; font-size:11px; color:#7a8681;">
            Viewing Date: <strong>${b.viewingDate}</strong>${timeSlotDisplay} · Ref: <code style="font-size:10px;">${b.transactionReference || 'TXN-PAID'}</code>
          </p>
          ${refundNoticeHtml}
          ${disputeNoticeHtml}
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span style="font-size:11px; font-weight:bold; padding:4px 10px; border-radius:20px; ${statusClass}">
            ${b.status}
          </span>
          ${cancelBtnHtml}
          ${disputeBtnHtml}
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".cancel-booking-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleCancelBuyerBooking(btn.dataset.id, btn.dataset.status, btn.dataset.property));
  });

  container.querySelectorAll(".dispute-buyer-btn").forEach((btn) => {
    btn.addEventListener("click", () => openBuyerDisputeModal(btn.dataset.id, btn.dataset.property));
  });
}

// Load Buyer's Bookings & Management
async function loadMyBookings() {
  setupViewingFilterButtons();

  try {
    const response = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/my`, {
      headers: authHeaders()
    });
    if (!response.ok) return;

    const bookings = await response.json();
    cachedBuyerBookings = bookings;

    // Filter strictly accepted / confirmed bookings (excluding cancelled & refunded bookings)
    const acceptedBookings = bookings.filter((b) => b.status === "ACCEPTED" || b.status === "CONFIRMED");
    const viewingsStat = document.getElementById("confirmedViewingsStat") || document.querySelector(".stat-card:nth-child(2) strong");
    const navViewingCount = document.querySelector(".side-nav a[href='#viewings'] b");

    // Detect status transitions in real time to alert the buyer
    bookings.forEach((b) => {
      const prev = knownBookingStatuses[b.id];
      if (prev && prev !== b.status) {
        if (b.status === "ACCEPTED" || b.status === "CONFIRMED" || b.status === "REJECTED" || b.refundStatus === "PARTIALLY_REFUNDED") {
          notifyBuyerBookingStatusChange(b);
        }
      }
      knownBookingStatuses[b.id] = b.status;
    });

    // Exclude cancelled bookings from Confirmed viewings stat & nav counter
    if (viewingsStat) viewingsStat.textContent = acceptedBookings.length;
    if (navViewingCount) navViewingCount.textContent = acceptedBookings.length;

    renderBuyerViewingList();
  } catch (err) {
    console.warn("Could not load bookings:", err);
  }
}

async function handleCancelBuyerBooking(id, status, property) {
  let confirmMessage = `Are you sure you want to cancel your viewing for "${property}"?`;
  
  const advanceAmt = window.CURRENT_BOOKING_ADVANCE || 5000;
  const refundHalf = Math.round(advanceAmt * 0.5);
  const refundFormatted = refundHalf.toLocaleString();

  if (status === "ACCEPTED") {
    confirmMessage = `⚠️ IMPORTANT NOTICE ON CANCELLATION & REFUNDS:\n\nThis viewing was already accepted and confirmed by the Booking Manager.\n\nIn accordance with our policy, if you cancel now, only a 50% PARTIAL REFUND (LKR ${refundFormatted}) will be refunded to you by the Booking Manager. The remaining LKR ${refundFormatted} is retained for administrative and agent coordination costs.\n\n(වෙන්කිරීම තහවුරු කළ පසු අවලංගු කළහොත් ආපසු ගෙවනු ලබන්නේ අත්තිකාරම් මුදලින් 50%ක් (රු. ${refundFormatted}) පමණි).\n\nDo you want to proceed with cancelling this confirmed viewing?`;
  }

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/${id}/cancel`, {
      method: "PATCH",
      headers: authHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Failed to cancel (${res.status})`);
    }

    broadcastBookingSync("CANCEL", id);
    if (status === "ACCEPTED") {
      alert(`Booking #${id} has been cancelled.\n\nYour 50% partial refund of LKR ${refundFormatted} is now PENDING authorization by the Booking Manager.`);
    } else {
      alert(`Booking #${id} cancelled successfully.`);
    }

    await loadMyBookings();
    loadNotifications();
  } catch (e) {
    alert("Cancellation error: " + e.message);
  }
}

// Buyer Booking Dispute Modal Logic (UC - 06)
const buyerDisputeModal = document.getElementById("buyerDisputeModal");
const closeBuyerDisputeModal = document.getElementById("closeBuyerDisputeModal");
const cancelBuyerDisputeBtn = document.getElementById("cancelBuyerDisputeBtn");
const buyerDisputeForm = document.getElementById("buyerDisputeForm");

function openBuyerDisputeModal(bookingId, propertyTitle) {
  document.getElementById("buyerDisputeBookingId").value = bookingId;
  document.getElementById("buyerDisputePropertyTitle").textContent = propertyTitle || "Apartment Viewing";
  document.getElementById("buyerDisputeReason").value = "SELLER_ABSENT";
  document.getElementById("buyerDisputeDetails").value = "";
  const msg = document.getElementById("buyerDisputeMessage");
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }
  buyerDisputeModal?.classList.remove("hidden");
}

function hideBuyerDisputeModal() {
  buyerDisputeModal?.classList.add("hidden");
}

if (closeBuyerDisputeModal) closeBuyerDisputeModal.addEventListener("click", hideBuyerDisputeModal);
if (cancelBuyerDisputeBtn) cancelBuyerDisputeBtn.addEventListener("click", hideBuyerDisputeModal);
if (buyerDisputeModal) {
  buyerDisputeModal.addEventListener("click", (e) => {
    if (e.target === buyerDisputeModal) hideBuyerDisputeModal();
  });
}

if (buyerDisputeForm) {
  buyerDisputeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("buyerDisputeBookingId").value;
    const reason = document.getElementById("buyerDisputeReason").value;
    const details = document.getElementById("buyerDisputeDetails").value.trim();
    const submitBtn = document.getElementById("submitBuyerDisputeBtn");
    const msg = document.getElementById("buyerDisputeMessage");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting Dispute...";
    }

    try {
      const response = await fetch(`${API_BASE_URL}${BOOKINGS_ENDPOINT}/${id}/dispute`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ reason, details })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Failed to report dispute (${response.status})`);
      }

      broadcastBookingSync("DISPUTE_RAISED", id);
      alert(`⚠️ Dispute raised successfully for Booking #${id}.\n\nThe Booking Manager has been alerted and will investigate the matter and determine a documented outcome.`);
      hideBuyerDisputeModal();
      await loadMyBookings();
      loadNotifications();
    } catch (err) {
      if (msg) {
        msg.className = "message";
        msg.style.color = "#dc2626";
        msg.textContent = "⚠️ " + err.message;
      }
      alert("Dispute report error: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "⚠️ Submit Dispute to Manager →";
      }
    }
  });
}

// Notifications Handling
const buyerNotifBtn = document.getElementById("buyerNotifBtn");
const buyerNotifModal = document.getElementById("buyerNotifModal");
const closeBuyerNotifModal = document.getElementById("closeBuyerNotifModal");
const closeNotifModalBtn = document.getElementById("closeNotifModalBtn");
const refreshNotifsBtn = document.getElementById("refreshNotifsBtn");

async function loadNotifications() {
  const listEl = document.getElementById("buyerNotifList");
  if (!listEl) return;

  listEl.innerHTML = `<p style="color:#7a8681; font-size:13px;">Loading notifications...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINT}`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error("Could not load notifications");

    const notifs = await response.json();
    if (notifs.length === 0) {
      listEl.innerHTML = `<p style="color:#7a8681; font-size:13px; padding:15px 0;">You have no notifications right now.</p>`;
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
  const badge = document.getElementById("buyerNotifBadge");
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
    // Ignore notification count error
  }
}

if (buyerNotifBtn) {
  buyerNotifBtn.addEventListener("click", () => {
    buyerNotifModal?.classList.remove("hidden");
    loadNotifications();
  });
}
if (closeBuyerNotifModal) closeBuyerNotifModal.addEventListener("click", () => buyerNotifModal?.classList.add("hidden"));
if (closeNotifModalBtn) closeNotifModalBtn.addEventListener("click", () => buyerNotifModal?.classList.add("hidden"));
if (refreshNotifsBtn) refreshNotifsBtn.addEventListener("click", loadNotifications);
if (buyerNotifModal) {
  buyerNotifModal.addEventListener("click", (e) => {
    if (e.target === buyerNotifModal) buyerNotifModal.classList.add("hidden");
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
const initialBuyerDateEl = document.getElementById("todayDate");
if (initialBuyerDateEl) initialBuyerDateEl.textContent = formatDate();

function updateProfileUI(profile) {
  const firstName = profile.firstName || "there";
  const lastName = profile.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || profile.email || "Apartment Buyer";
  const initials = ((firstName[0] || "") + (lastName[0] || (firstName[1] || ""))).toUpperCase() || "B";

  const dateEl = document.getElementById("todayDate");
  if (dateEl) dateEl.textContent = formatDate();

  const greetingEl = document.getElementById("greetingHeading");
  if (greetingEl) greetingEl.innerHTML = `${getGreeting()}, <em>${firstName}.</em>`;

  const fullNameEl = document.getElementById("userFullName");
  if (fullNameEl) fullNameEl.textContent = fullName;

  const avatarEl = document.getElementById("userAvatar");
  if (avatarEl) avatarEl.textContent = initials;

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
    role: localStorage.getItem("userRole")
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
    } else if (response.status === 401) {
      window.location.href = "signIn_page.html";
    }
  } catch (error) {
    console.warn("Could not sync profile from server:", error);
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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Could not update profile (${response.status})`);
      }

      localStorage.setItem("userFirstName", data.firstName);
      localStorage.setItem("userLastName", data.lastName);
      if (data.phone) localStorage.setItem("userPhone", data.phone);

      updateProfileUI(data);
      msg.className = "message success";
      msg.style.color = "#16a34a";
      msg.style.fontWeight = "bold";
      msg.textContent = "✓ Profile updated successfully!";
      showToast("Profile Updated Successfully ✅", "Your profile details have been updated and applied in real-time.", "success");

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
const tabProfileInfo = document.getElementById("tabProfileInfo");
const tabChangePassword = document.getElementById("tabChangePassword");
const tabContentProfile = document.getElementById("tabContentProfile");
const tabContentPassword = document.getElementById("tabContentPassword");

if (tabProfileInfo && tabChangePassword && tabContentProfile && tabContentPassword) {
  tabProfileInfo.addEventListener("click", () => {
    tabProfileInfo.style.color = "#102a2c";
    tabProfileInfo.style.borderBottom = "2px solid #e8785a";
    tabChangePassword.style.color = "#7a8681";
    tabChangePassword.style.borderBottom = "2px solid transparent";
    tabContentProfile.classList.remove("hidden");
    tabContentPassword.classList.add("hidden");
  });

  tabChangePassword.addEventListener("click", () => {
    tabChangePassword.style.color = "#102a2c";
    tabChangePassword.style.borderBottom = "2px solid #e8785a";
    tabProfileInfo.style.color = "#7a8681";
    tabProfileInfo.style.borderBottom = "2px solid transparent";
    tabContentPassword.classList.remove("hidden");
    tabContentProfile.classList.add("hidden");
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
      msg.style.color = "#dc2626";
      msg.textContent = "New password must be at least 8 characters long.";
      return;
    }

    if (newPassword !== confirmPassword) {
      msg.style.color = "#dc2626";
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
      msg.style.color = "#16a34a";
      msg.style.fontWeight = "bold";
      msg.innerHTML = `✓ Password changed successfully! A security confirmation email was sent directly to <u>${targetMail}</u>.`;

      document.getElementById("changeCurrentPassword").value = "";
      document.getElementById("changeNewPassword").value = "";
      document.getElementById("changeConfirmPassword").value = "";

      // Refresh notifications badge & list immediately
      updateNotifBadge();
      loadNotifications();

      showToast("Password Updated Successfully! 🔐", `Your account password has been changed. A security confirmation email was sent directly to ${targetMail}.`, "success");

    } catch (err) {
      msg.className = "message";
      msg.style.color = "#dc2626";
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

function handleSignOut() {
  localStorage.clear();
  window.location.href = "signIn_page.html";
}

document.getElementById("logoutButton")?.addEventListener("click", handleSignOut);
modalLogoutButton?.addEventListener("click", handleSignOut);

const homeSearchInput = document.getElementById("homeSearch");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const clearSearchInputBtn = document.getElementById("clearSearchInputBtn");

searchBtn?.addEventListener("click", triggerSearch);
clearSearchBtn?.addEventListener("click", clearSearch);

clearSearchInputBtn?.addEventListener("click", () => {
  if (homeSearchInput) homeSearchInput.value = "";
  if (clearSearchInputBtn) clearSearchInputBtn.style.display = "none";
  const searchContainer = document.getElementById("searchContainer");
  const errorEl = document.getElementById("searchValidationError");
  if (searchContainer) {
    searchContainer.classList.remove("has-error");
    searchContainer.style.borderColor = "";
    searchContainer.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";
  renderHomes();
  homeSearchInput?.focus();
});

homeSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    triggerSearch();
  }
});


homeSearchInput?.addEventListener("input", (e) => {
  const searchContainer = document.getElementById("searchContainer");
  const errorEl = document.getElementById("searchValidationError");
  const clearBtn = document.getElementById("clearSearchBtn");
  const clearInputBtn = document.getElementById("clearSearchInputBtn");
  const val = (e.target.value || "").trim();

  if (searchContainer) {
    searchContainer.classList.remove("has-error");
    searchContainer.style.borderColor = "";
    searchContainer.style.boxShadow = "";
  }
  if (errorEl) errorEl.style.display = "none";

  if (val) {
    if (clearInputBtn) clearInputBtn.style.display = "inline-block";
    if (clearBtn) clearBtn.style.display = "inline-flex";
  } else {
    if (clearInputBtn) clearInputBtn.style.display = "none";
    const cityFilter = document.getElementById("filterCity")?.value || "ALL";
    const priceRange = document.getElementById("filterPriceRange")?.value || "ALL";
    if (clearBtn && cityFilter === "ALL" && priceRange === "ALL" && selectedAmenityFilters.size === 0) {
      clearBtn.style.display = "none";
    }
  }
  renderHomes();
});

document.getElementById("filterCity")?.addEventListener("change", () => {
  renderHomes();
});

document.getElementById("filterPriceRange")?.addEventListener("change", (e) => {
  const customBox = document.getElementById("customPriceBox");
  if (customBox) {
    customBox.style.display = e.target.value === "CUSTOM" ? "grid" : "none";
  }
  renderHomes();
});

document.getElementById("filterMinPrice")?.addEventListener("input", () => {
  renderHomes();
});

document.getElementById("filterMaxPrice")?.addEventListener("input", () => {
  renderHomes();
});

function notifyBuyerBookingStatusChange(booking) {
  const toastId = "liveToast_" + booking.id + "_" + booking.status;
  if (document.getElementById(toastId)) return;

  const toast = document.createElement("div");
  toast.id = toastId;

  let icon = "🎉";
  let title = "Viewing Confirmed by Booking Manager!";
  let desc = `Great news! Your viewing for "${booking.listingTitle || 'Apartment'}" on ${booking.viewingDate} (${booking.viewingTime || ''}) has been accepted!`;
  let bgColor = "#ecfdf5";
  let borderColor = "#a7f3d0";
  let textColor = "#065f46";

  if (booking.status === "REJECTED") {
    icon = "ℹ️";
    title = "Viewing Request Update";
    desc = `Your viewing request for "${booking.listingTitle || 'Apartment'}" could not be confirmed.`;
    bgColor = "#fef2f2";
    borderColor = "#fecaca";
    textColor = "#991b1b";
  } else if (booking.refundStatus === "PARTIALLY_REFUNDED") {
    icon = "💸";
    title = "50% Partial Refund Credited!";
    desc = `LKR ${(booking.refundAmount || 2500).toLocaleString()} has been processed by the Booking Manager.`;
    bgColor = "#eff6ff";
    borderColor = "#bfdbfe";
    textColor = "#1e40af";
  }

  toast.innerHTML = `
    <div style="position:fixed; top:24px; right:24px; z-index:99999; background:${bgColor}; border:1.5px solid ${borderColor}; color:${textColor}; padding:16px 20px; border-radius:12px; box-shadow:0 12px 35px rgba(0,0,0,0.15); max-width:380px; display:flex; gap:12px; align-items:flex-start; animation:fadeIn 0.3s ease;">
      <span style="font-size:24px; line-height:1;">${icon}</span>
      <div style="flex:1;">
        <strong style="display:block; font-size:13px; font-weight:800; margin-bottom:3px;">${title}</strong>
        <p style="margin:0; font-size:11.5px; line-height:1.4; opacity:0.95;">${desc}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="border:none; background:none; font-size:18px; cursor:pointer; color:${textColor}; opacity:0.6; line-height:1;">&times;</button>
    </div>
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast?.remove();
  }, 9000);
}

function broadcastBookingSync(action, id) {
  try {
    localStorage.setItem("nook_booking_sync", JSON.stringify({
      action: action,
      id: id,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

async function loadPublicSystemSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/public`);
    if (res.ok) {
      const data = await res.json();
      const advance = Number(data.bookingAdvanceDeposit || data.PRICING_BOOKING_ADVANCE || 5000);
      window.CURRENT_BOOKING_ADVANCE = advance;
      const formatted = advance.toLocaleString();
      const halfFormatted = Math.round(advance * 0.5).toLocaleString();

      const depositEl = document.getElementById("bookingDepositSummaryText");
      if (depositEl) depositEl.textContent = `LKR ${formatted}`;

      const btn = document.getElementById("confirmBookingPayBtn");
      if (btn) btn.textContent = `Pay LKR ${formatted} & Confirm Booking →`;

      const policyEl = document.getElementById("bookingRefundPolicyNotice");
      if (policyEl) {
        policyEl.innerHTML = `
          • <strong>If you (Buyer) cancel</strong> an accepted viewing: a <strong>50% partial refund (LKR ${halfFormatted})</strong> will be issued to cover reservation coordination.<br>
          • <strong>If the Seller or Agent cancels / declines</strong> your viewing: you receive a <strong>100% FULL REFUND (LKR ${formatted})</strong> directly back to you.
        `;
      }
    }
  } catch (e) {
    console.warn("Could not sync public settings in buyer.js:", e);
  }
}

initBuyerPaymentMethodTabs();
initApartmentDetailsModal();
loadUserProfile();
loadPublicSystemSettings();
loadHomes();
loadMyBookings();
renderSavedHomes();
updateNotifBadge();

// Real-time synchronization: Poll bookings & notifications every 2 seconds
setInterval(() => {
  loadMyBookings();
  updateNotifBadge();
}, 2000);

// Instant cross-tab sync when manager accepts/updates bookings
window.addEventListener("storage", (e) => {
  if (e.key === "nook_booking_sync") {
    loadMyBookings();
    updateNotifBadge();
    loadNotifications();
  }
});

// Refresh on tab focus and visibility change
window.addEventListener("focus", () => {
  loadMyBookings();
  updateNotifBadge();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    loadMyBookings();
    updateNotifBadge();
  }
});

