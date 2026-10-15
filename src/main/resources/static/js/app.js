// Apartment Sales System - Home Page Script
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=85"
];

let allPublishedListings = [];

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function redirectToSignup(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  window.location.href = "signup_page.html";
}

function getListingImage(listing, index) {
  if (listing.imageUrl && !listing.imageUrl.includes("null") && listing.imageUrl.trim() !== "") {
    return listing.imageUrl;
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function formatPriceDisplay(price) {
  if (!price) return "Price on Request";
  const num = Number(price);
  if (isNaN(num)) return `LKR ${price}`;
  if (num >= 1000000) {
    return `LKR ${(num / 1000000).toFixed(1)}M`;
  }
  return `LKR ${num.toLocaleString()}`;
}

function renderListings(listings) {
  const grid = document.getElementById("propertyGrid") || document.querySelector(".property-grid");
  if (!grid) return;

  if (!listings || listings.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--cream); border-radius: 12px; border: 1px dashed var(--line);">
        <p style="margin: 0 0 12px; font-size: 15px; color: var(--muted); font-weight: 500;">No published apartments found matching your criteria.</p>
        <button onclick="resetSearchAndReload()" class="secondary-button" style="padding: 8px 18px; font-size: 12px; cursor: pointer;">Show All Listings</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = listings.map((l, index) => {
    const imgUrl = getListingImage(l, index);
    const typeLabel = l.propertyType ? l.propertyType.toUpperCase() : "APARTMENT";
    const city = l.city ? l.city : "Colombo";
    const address = l.street ? `${l.street}, ${city}` : `${city}, Sri Lanka`;
    const priceText = formatPriceDisplay(l.price);
    const fullPriceNum = Number(l.price);
    const fullPriceLabel = !isNaN(fullPriceNum) ? `LKR ${fullPriceNum.toLocaleString()}` : "";
    const amenitiesSnippet = Array.isArray(l.amenities) && l.amenities.length > 0 
      ? l.amenities.slice(0, 2).map(a => escapeHtml(a)).join(" · ") 
      : "Verified Residence";

    return `
      <article class="property-card" onclick="redirectToSignup(event)" style="cursor: pointer; position: relative; display: flex; flex-direction: column; justify-content: space-between;" title="Click to view details and register">
        <div>
          <div class="property-image" style="background-image: url('${imgUrl}'); position: relative;">
            <span class="tag" style="position: absolute; top: 12px; left: 12px; backdrop-filter: blur(4px); background: rgba(255,255,255,0.92); box-shadow: 0 2px 6px rgba(0,0,0,0.1);">${escapeHtml(typeLabel)}</span>
            <span style="position: absolute; top: 12px; right: 12px; font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 20px; background: rgba(16,42,44,0.85); color: white;">Verified</span>
          </div>
          <div class="property-details">
            <small style="font-size: 10px; font-weight: 600; color: var(--coral, #e8785a); letter-spacing: 0.5px; text-transform: uppercase;">${amenitiesSnippet}</small>
            <h3 style="margin: 6px 0 4px; font-size: 21px; line-height: 1.25; font-family: Georgia, serif;">${escapeHtml(l.title)}</h3>
            <p style="margin: 0 0 10px; font-size: 12px; color: var(--muted);">${escapeHtml(address)}</p>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 6px;">
              <strong style="font-size: 18px; color: var(--ink);">${priceText}</strong>
              ${fullPriceLabel ? `<span style="font-size: 11px; color: var(--muted);">(${fullPriceLabel})</span>` : ""}
            </div>
          </div>
        </div>
        <div style="padding: 0 18px 18px;">
          <button type="button" class="primary-button" style="width: 100%; padding: 10px 14px; font-size: 11px; font-weight: bold; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="redirectToSignup(event)">
            <span>View Details & Inquire</span>
            <span style="font-size: 13px;">→</span>
          </button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadHomePageListings() {
  const grid = document.getElementById("propertyGrid") || document.querySelector(".property-grid");
  if (!grid) return;

  try {
    const res = await fetch("/api/listings");
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      allPublishedListings = data.filter(item => item.status === "PUBLISHED" || !item.status);
      renderListings(allPublishedListings);
    }
  } catch (err) {
    console.warn("Could not fetch live listings from /api/listings:", err);
  }
}

function resetSearchAndReload() {
  const form = document.getElementById("propertySearchForm");
  if (form) form.reset();
  const msg = document.getElementById("propertyMessage");
  if (msg) {
    msg.textContent = "";
    msg.className = "message";
  }
  renderListings(allPublishedListings);
}

// Property Search Filter
const propertySearchForm = document.getElementById("propertySearchForm");
if (propertySearchForm) {
  propertySearchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const locationTerm = (document.getElementById("locationInput")?.value || "").trim().toLowerCase();
    const propertyType = (document.getElementById("propertyType")?.value || "").trim().toUpperCase();
    const budget = (document.getElementById("budget")?.value || "").trim();
    const message = document.getElementById("propertyMessage");

    let filtered = [...allPublishedListings];

    if (locationTerm) {
      filtered = filtered.filter(l => {
        const city = (l.city || "").toLowerCase();
        const street = (l.street || "").toLowerCase();
        const title = (l.title || "").toLowerCase();
        return city.includes(locationTerm) || street.includes(locationTerm) || title.includes(locationTerm);
      });
    }

    if (propertyType) {
      filtered = filtered.filter(l => (l.propertyType || "").toUpperCase() === propertyType);
    }

    if (budget) {
      filtered = filtered.filter(l => {
        const p = Number(l.price) || 0;
        if (budget === "under-25") return p < 25000000;
        if (budget === "25-50") return p >= 25000000 && p <= 50000000;
        if (budget === "over-50") return p > 50000000;
        return true;
      });
    }

    renderListings(filtered);

    if (message) {
      message.className = "message success";
      message.textContent = `Found ${filtered.length} property ${filtered.length === 1 ? 'listing' : 'listings'}. Click any property to view details or register.`;
    }
  });
}

function getJwtToken() {
  return localStorage.getItem("jwtToken");
}

async function fetchWithJwt(url, options = {}) {
  const token = getJwtToken();

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
}

// Auto-load listings on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadHomePageListings);
} else {
  loadHomePageListings();
}
