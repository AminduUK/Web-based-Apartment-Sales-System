/**
 * Paddle Billing Starter Integration for Agents and Sellers
 * Nook & Key Property System
 */

const PADDLE_PLANS = {
  FREE: {
    name: "Starter (Free)",
    limit: 2,
    monthlyPrice: 0,
    annualPrice: 0,
    badge: "FREE"
  },
  PRO: {
    name: "Pro Agent",
    limit: 10,
    monthlyPrice: 4900,
    annualPrice: 47000, // ~20% off
    badge: "PRO"
  },
  ELITE: {
    name: "Elite Broker",
    limit: 1000, // Unlimited
    monthlyPrice: 12900,
    annualPrice: 124000, // ~20% off
    badge: "ELITE"
  }
};

let currentBillingCycle = "MONTHLY"; // "MONTHLY" or "ANNUAL"
let selectedCheckoutPlan = "PRO";
let selectedPaymentMethod = "Card (Paddle)";
let currentSubscriptionState = {
  plan: "FREE",
  billingCycle: "MONTHLY",
  listingLimit: 2,
  activeListingsCount: 0,
  verified: false
};

let onPlanChangedCallback = null;

async function syncDynamicPublicSettings() {
  try {
    const baseUrl = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";
    const res = await fetch(`${baseUrl}/api/settings/public`);
    if (res.ok) {
      const data = await res.json();
      if (data.PRICING_AGENT_SLOT) {
        window.CURRENT_AGENT_SLOT_PRICE = Number(data.PRICING_AGENT_SLOT);
      }
      if (data.PRICING_SELLER_SLOT) {
        window.CURRENT_SELLER_SLOT_PRICE = Number(data.PRICING_SELLER_SLOT);
      }
      if (data.SUBSCRIPTION_PRO_PRICE) {
        PADDLE_PLANS.PRO.monthlyPrice = Number(data.SUBSCRIPTION_PRO_PRICE);
        PADDLE_PLANS.PRO.annualPrice = Math.round(Number(data.SUBSCRIPTION_PRO_PRICE) * 12 * 0.8);
      }
      if (data.SUBSCRIPTION_ELITE_PRICE) {
        PADDLE_PLANS.ELITE.monthlyPrice = Number(data.SUBSCRIPTION_ELITE_PRICE);
        PADDLE_PLANS.ELITE.annualPrice = Math.round(Number(data.SUBSCRIPTION_ELITE_PRICE) * 12 * 0.8);
      }
      if (data.LIMIT_AGENT_PRO) {
        PADDLE_PLANS.PRO.limit = Number(data.LIMIT_AGENT_PRO);
      }
      if (data.LIMIT_AGENT_ELITE) {
        PADDLE_PLANS.ELITE.limit = Number(data.LIMIT_AGENT_ELITE);
      }
      if (data.LIMIT_AGENT_FREE) {
        PADDLE_PLANS.FREE.limit = Number(data.LIMIT_AGENT_FREE);
      }

      // Update Agent Pricing UI DOM elements
      const proAmtEl = document.getElementById("priceAmountPRO");
      if (proAmtEl) proAmtEl.textContent = (currentBillingCycle === "ANNUAL" ? PADDLE_PLANS.PRO.annualPrice : PADDLE_PLANS.PRO.monthlyPrice).toLocaleString();

      const eliteAmtEl = document.getElementById("priceAmountELITE");
      if (eliteAmtEl) eliteAmtEl.textContent = (currentBillingCycle === "ANNUAL" ? PADDLE_PLANS.ELITE.annualPrice : PADDLE_PLANS.ELITE.monthlyPrice).toLocaleString();

      if (window.CURRENT_AGENT_SLOT_PRICE) {
        document.querySelectorAll(".agent-slot-price-label").forEach(el => {
          el.textContent = `LKR ${window.CURRENT_AGENT_SLOT_PRICE.toLocaleString()}`;
        });
      }
    }
  } catch (e) {
    console.warn("Could not sync public settings in paddle_billing:", e);
  }
}

function initPaddleBilling(role, callback) {
  currentSubscriptionState.userRole = role;
  onPlanChangedCallback = callback;
  syncDynamicPublicSettings().then(() => {
    setupPaddleEventListeners();
    syncSubscriptionStatus();
  });
}

function setupPaddleEventListeners() {
  // Monthly / Annual toggle
  const btnMonthly = document.getElementById("billingToggleMonthly");
  const btnAnnual = document.getElementById("billingToggleAnnual");

  if (btnMonthly && btnAnnual) {
    btnMonthly.addEventListener("click", () => setBillingCycle("MONTHLY"));
    btnAnnual.addEventListener("click", () => setBillingCycle("ANNUAL"));
  }

  // Close modals
  document.getElementById("closePaddleModal")?.addEventListener("click", closePaddlePricingModal);
  document.getElementById("closeCheckoutModal")?.addEventListener("click", closePaddleCheckoutModal);

  // Click outside modal
  document.getElementById("paddlePricingModal")?.addEventListener("click", (e) => {
    if (e.target.id === "paddlePricingModal") closePaddlePricingModal();
  });
  document.getElementById("paddleCheckoutModal")?.addEventListener("click", (e) => {
    if (e.target.id === "paddleCheckoutModal") closePaddleCheckoutModal();
  });

  // Plan select buttons
  document.getElementById("btnSelectPlanFREE")?.addEventListener("click", () => {
    if (currentSubscriptionState.plan === "FREE") return;
    performPlanUpgrade("FREE", currentBillingCycle, "Free Plan Switch");
  });

  document.getElementById("btnSelectPlanPRO")?.addEventListener("click", () => {
    openPaddleCheckoutModal("PRO");
  });

  document.getElementById("btnSelectPlanELITE")?.addEventListener("click", () => {
    openPaddleCheckoutModal("ELITE");
  });

  document.getElementById("btnBuySingleSlotAgent")?.addEventListener("click", () => {
    openPaddleCheckoutModal("SINGLE_SLOT");
  });

  document.getElementById("widgetBuySlotBtn")?.addEventListener("click", () => {
    openPaddleCheckoutModal("SINGLE_SLOT");
  });

  // Payment tab switch
  const payCardBtn = document.getElementById("payMethodCard");
  const payCashBtn = document.getElementById("payMethodCash");
  const cardSec = document.getElementById("cardPaymentSection");
  const cashSec = document.getElementById("cashPaymentSection");

  payCardBtn?.addEventListener("click", () => {
    payCardBtn.classList.add("active");
    payCashBtn?.classList.remove("active");
    if (cardSec) cardSec.style.display = "grid";
    if (cashSec) cashSec.style.display = "none";
    selectedPaymentMethod = "Card (Paddle)";
  });

  payCashBtn?.addEventListener("click", () => {
    payCashBtn.classList.add("active");
    payCardBtn?.classList.remove("active");
    if (cardSec) cardSec.style.display = "none";
    if (cashSec) cashSec.style.display = "block";
    selectedPaymentMethod = "Cash / Bank Transfer";
  });

  // Confirm checkout
  document.getElementById("confirmCheckoutBtn")?.addEventListener("click", async () => {
    const errorMsg = document.getElementById("checkoutErrorMsg");
    const confirmBtn = document.getElementById("confirmCheckoutBtn");
    if (errorMsg) errorMsg.textContent = "";

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = "Processing Payment via Paddle...";

    try {
      if (selectedCheckoutPlan === "SINGLE_SLOT") {
        const slotPrice = window.CURRENT_AGENT_SLOT_PRICE || 2500;
        await performPurchaseSlot(selectedPaymentMethod, slotPrice);
        closePaddleCheckoutModal();
        closePaddlePricingModal();
        showSuccessBanner("Extra Listing Slot Activated! You can now publish your apartment.");
        if (window.pendingAddListingAfterSlot) {
          window.pendingAddListingAfterSlot = false;
          const listingModal = document.getElementById("listingModal");
          if (listingModal) {
            listingModal.classList.remove("hidden");
            document.body.style.overflow = "hidden";
            if (typeof loadListingAmenities === "function") loadListingAmenities();
          }
        }
      } else {
        await performPlanUpgrade(selectedCheckoutPlan, currentBillingCycle, selectedPaymentMethod);
        closePaddleCheckoutModal();
        closePaddlePricingModal();
        showSuccessBanner("Plan upgraded to " + selectedCheckoutPlan + " successfully!");
      }
    } catch (err) {
      if (errorMsg) errorMsg.textContent = err.message;
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = "Pay & Activate Plan &rarr;";
    }
  });

  // Topbar and widget upgrade buttons
  document.getElementById("openBillingBtn")?.addEventListener("click", openPaddlePricingModal);
  document.getElementById("widgetUpgradeBtn")?.addEventListener("click", openPaddlePricingModal);
}

function setBillingCycle(cycle) {
  currentBillingCycle = cycle;
  const btnMonthly = document.getElementById("billingToggleMonthly");
  const btnAnnual = document.getElementById("billingToggleAnnual");

  if (cycle === "MONTHLY") {
    btnMonthly?.classList.add("active");
    btnAnnual?.classList.remove("active");
  } else {
    btnAnnual?.classList.add("active");
    btnMonthly?.classList.remove("active");
  }

  // Update prices on cards
  const proAmountEl = document.getElementById("priceAmountPRO");
  const eliteAmountEl = document.getElementById("priceAmountELITE");
  const cycleProEl = document.getElementById("cycleTextPRO");
  const cycleEliteEl = document.getElementById("cycleTextELITE");

  if (cycle === "MONTHLY") {
    if (proAmountEl) proAmountEl.textContent = PADDLE_PLANS.PRO.monthlyPrice.toLocaleString();
    if (eliteAmountEl) eliteAmountEl.textContent = PADDLE_PLANS.ELITE.monthlyPrice.toLocaleString();
    if (cycleProEl) cycleProEl.textContent = "/month";
    if (cycleEliteEl) cycleEliteEl.textContent = "/month";
  } else {
    if (proAmountEl) proAmountEl.textContent = PADDLE_PLANS.PRO.annualPrice.toLocaleString();
    if (eliteAmountEl) eliteAmountEl.textContent = PADDLE_PLANS.ELITE.annualPrice.toLocaleString();
    if (cycleProEl) cycleProEl.textContent = "/year (20% off)";
    if (cycleEliteEl) cycleEliteEl.textContent = "/year (20% off)";
  }
}

function openPaddlePricingModal() {
  updatePlanButtonsState();
  const modal = document.getElementById("paddlePricingModal");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closePaddlePricingModal() {
  const modal = document.getElementById("paddlePricingModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

function openPaddleCheckoutModal(plan) {
  selectedCheckoutPlan = plan;
  const modal = document.getElementById("paddleCheckoutModal");
  const titleEl = document.getElementById("checkoutPlanTitle");
  const descEl = document.getElementById("checkoutCycleDesc");
  const priceEl = document.getElementById("checkoutPriceText");
  const periodEl = document.getElementById("checkoutPeriodText");
  const errEl = document.getElementById("checkoutErrorMsg");

  if (errEl) errEl.textContent = "";

  if (plan === "SINGLE_SLOT") {
    const slotPrice = window.CURRENT_AGENT_SLOT_PRICE || 2500;
    if (titleEl) titleEl.textContent = "Agent Pay-Per-Listing Slot";
    if (descEl) descEl.textContent = "On-Demand Slot · Post 1 Extra Apartment Listing (No monthly subscription)";
    if (priceEl) priceEl.textContent = `LKR ${slotPrice.toLocaleString()}`;
    if (periodEl) periodEl.textContent = "One-Time Fee";
  } else {
    const planInfo = PADDLE_PLANS[plan] || PADDLE_PLANS.PRO;
    const isAnnual = currentBillingCycle === "ANNUAL";
    const price = isAnnual ? planInfo.annualPrice : planInfo.monthlyPrice;

    if (titleEl) titleEl.textContent = planInfo.name;
    if (descEl) descEl.textContent = `${isAnnual ? 'Annual' : 'Monthly'} Billing · Up to ${planInfo.limit === 1000 ? 'Unlimited' : planInfo.limit} Listings`;
    if (priceEl) priceEl.textContent = `LKR ${price.toLocaleString()}`;
    if (periodEl) periodEl.textContent = isAnnual ? "/year" : "/month";
  }

  if (modal) {
    modal.classList.add("active");
  }
}

function closePaddleCheckoutModal() {
  const modal = document.getElementById("paddleCheckoutModal");
  if (modal) modal.classList.remove("active");
}

function updatePlanButtonsState() {
  const currentPlan = (currentSubscriptionState.plan || "FREE").toUpperCase();

  ["FREE", "PRO", "ELITE"].forEach((plan) => {
    const btn = document.getElementById(`btnSelectPlan${plan}`);
    if (!btn) return;

    if (plan === currentPlan) {
      btn.textContent = "Current Plan";
      btn.classList.add("current");
    } else {
      btn.classList.remove("current");
      if (plan === "FREE") {
        btn.textContent = "Switch to Starter";
      } else if (plan === "PRO") {
        btn.textContent = "Upgrade to Pro →";
      } else {
        btn.textContent = "Upgrade to Elite →";
      }
    }
  });
}

async function performPlanUpgrade(plan, billingCycle, paymentMethod) {
  const token = localStorage.getItem("jwtToken");
  const baseUrl = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";

  const response = await fetch(`${baseUrl}/api/subscription/upgrade`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token || ""}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      plan: plan,
      billingCycle: billingCycle,
      paymentMethod: paymentMethod
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || `Upgrade failed (${response.status})`);
  }

  const profile = await response.json();
  updateSubscriptionStateFromProfile(profile);

  if (typeof onPlanChangedCallback === "function") {
    onPlanChangedCallback(profile);
  }

  return profile;
}

async function performPurchaseSlot(paymentMethod, amount) {
  const token = localStorage.getItem("jwtToken");
  const baseUrl = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";

  const response = await fetch(`${baseUrl}/api/subscription/purchase-slot`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token || ""}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      slots: 1,
      paymentMethod: paymentMethod,
      amountPaid: amount || window.CURRENT_AGENT_SLOT_PRICE || 2500,
      transactionReference: "TXN-" + Date.now().toString(36).toUpperCase()
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || `Purchase failed (${response.status})`);
  }

  const profile = await response.json();
  updateSubscriptionStateFromProfile(profile);

  if (typeof onPlanChangedCallback === "function") {
    onPlanChangedCallback(profile);
  }

  return profile;
}

async function syncSubscriptionStatus() {
  const token = localStorage.getItem("jwtToken");
  if (!token) return;

  const baseUrl = (window.location.origin && window.location.origin !== "null") ? window.location.origin : "http://localhost:8081";
  try {
    const response = await fetch(`${baseUrl}/api/subscription/status`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (response.ok) {
      const profile = await response.json();
      updateSubscriptionStateFromProfile(profile);
      if (typeof onPlanChangedCallback === "function") {
        onPlanChangedCallback(profile);
      }
    }
  } catch (err) {
    console.warn("Could not sync subscription:", err);
  }
}

function updateSubscriptionStateFromProfile(profile) {
  currentSubscriptionState.plan = profile.subscriptionPlan || "FREE";
  currentSubscriptionState.billingCycle = profile.billingCycle || "MONTHLY";
  currentSubscriptionState.listingLimit = profile.listingLimit || (currentSubscriptionState.plan === "PRO" ? 10 : (currentSubscriptionState.plan === "ELITE" ? 1000 : 2));
  currentSubscriptionState.extraListingSlots = profile.extraListingSlots || 0;
  currentSubscriptionState.activeListingsCount = profile.activeListingsCount !== undefined ? profile.activeListingsCount : 0;
  // Free tier is unverified (verified = false); only paid plans (PRO or ELITE) grant official verified status
  currentSubscriptionState.verified = Boolean(profile.verified);

  renderQuotaWidgetUI();
  renderVerifiedBadgeUI(profile.role);
  updateTopbarPlanLabel();
  updatePlanButtonsState();
}

function updateTopbarPlanLabel() {
  const planLabel = document.getElementById("currentPlanLabel");
  if (planLabel) {
    const plan = currentSubscriptionState.plan;
    if (plan === "ELITE") {
      planLabel.textContent = "👑 Elite Plan";
    } else if (plan === "PRO") {
      planLabel.textContent = "💎 Pro Plan";
    } else {
      planLabel.textContent = "⚡ Free Plan";
    }
  }
}

function renderVerifiedBadgeUI(role = "AGENT") {
  const isAgent = role === "AGENT";
  const verifiedBadgeText = isAgent ? "✓ Verified Agent" : "✓ Verified Seller";
  const isVerified = Boolean(currentSubscriptionState.verified);

  // Topbar badge
  const topbarBadge = document.getElementById("verifiedBadge");
  if (topbarBadge) {
    if (isVerified) {
      topbarBadge.textContent = verifiedBadgeText;
      topbarBadge.className = isAgent ? "badge-verified-agent" : "badge-verified-seller";
      topbarBadge.title = isAgent ? "Official Verified Real Estate Agent" : "Official Verified Property Seller";
      topbarBadge.style.cursor = "default";
      topbarBadge.onclick = null;
    } else {
      topbarBadge.textContent = "⚡ Unverified (Free)";
      topbarBadge.className = "badge-unverified";
      topbarBadge.title = "Upgrade to Pro or Elite to unlock your official Verified Badge";
      topbarBadge.style.cursor = "pointer";
      topbarBadge.onclick = () => window.openPaddleModal && window.openPaddleModal();
    }
    topbarBadge.style.display = "inline-flex";
  }

  // Profile chip verified badge next to user name
  const agentBadge = document.getElementById("agentVerifiedBadge") || document.getElementById("verifiedBadge");
  if (agentBadge) {
    if (isVerified) {
      agentBadge.textContent = "✓ Verified Agent";
      agentBadge.className = "badge-verified-agent";
      agentBadge.style.display = "inline-flex";
    } else {
      agentBadge.textContent = "⚡ Unverified";
      agentBadge.className = "badge-unverified";
      agentBadge.style.display = "inline-flex";
    }
  }

  const sellerBadge = document.getElementById("sellerVerifiedBadge");
  if (sellerBadge) {
    if (isVerified) {
      sellerBadge.style.display = "inline-flex";
    } else {
      sellerBadge.style.display = "none";
    }
  }

  // Profile modal status pill
  const modalRole = document.getElementById("modalRole");
  if (modalRole) {
    const planPill = `<span class="badge-plan-pill plan-${currentSubscriptionState.plan}">${currentSubscriptionState.plan} PLAN</span>`;
    const verBadge = isVerified
      ? `<span class="${isAgent ? 'badge-verified-agent' : 'badge-verified-seller'}">${verifiedBadgeText}</span>`
      : `<span class="badge-unverified" style="cursor:pointer;" onclick="window.openPaddleModal && window.openPaddleModal()" title="Upgrade to Pro or Elite to get Verified">⚡ Unverified Account (Upgrade to Verify)</span>`;
    modalRole.innerHTML = `${isAgent ? 'Licensed Real Estate Agent' : 'Property Seller'} · ${planPill} ${verBadge}`;
  }
}

function renderQuotaWidgetUI() {
  const count = currentSubscriptionState.activeListingsCount || 0;
  const limit = currentSubscriptionState.listingLimit || 2;
  const plan = currentSubscriptionState.plan || "FREE";
  const isElite = plan === "ELITE";

  const fillEl = document.getElementById("quotaBarFill");
  const usageText = document.getElementById("quotaUsageText");
  const limitText = document.getElementById("quotaLimitText");
  const planPill = document.getElementById("quotaPlanPill");
  const slotsRemainingBadge = document.getElementById("quotaSlotsRemainingBadge");

  const role = currentSubscriptionState.userRole || localStorage.getItem("userRole") || "";

  if (role === "SELLER") {
    const sellerActiveCount = document.getElementById("sellerActiveSlotCount");
    if (sellerActiveCount) {
      sellerActiveCount.innerHTML = `Active listing slot: <strong>${count} / 1</strong> used`;
    }

    const sellerFillEl = document.getElementById("sellerQuotaBarFill");
    if (sellerFillEl) {
      const pct = count >= 1 ? 100 : 0;
      sellerFillEl.style.width = `${pct}%`;
      sellerFillEl.style.background = pct >= 100 ? "linear-gradient(90deg, #ea580c, #dc2626)" : "linear-gradient(90deg, #10b981, #059669)";
    }

    const sellerRemaining = document.getElementById("sellerSlotsRemainingBadge");
    if (sellerRemaining) {
      const rem = Math.max(0, 1 - count);
      sellerRemaining.textContent = `${rem} slot${rem === 1 ? '' : 's'} available`;
      sellerRemaining.style.background = rem > 0 ? "#ecfdf5" : "#fff1f2";
      sellerRemaining.style.color = rem > 0 ? "#065f46" : "#be123c";
      sellerRemaining.style.border = rem > 0 ? "1px solid #a7f3d0" : "1px solid #fecdd3";
    }

    const sellerQuotaDesc = document.getElementById("sellerQuotaDesc");
    if (sellerQuotaDesc) {
      if (count >= 1) {
        sellerQuotaDesc.innerHTML = `All allocated listing slots in use. To list an additional apartment, purchase an <strong style="color:var(--ink);">Extra Listing Pass (LKR 2,500)</strong> or <a href="javascript:void(0)" onclick="window.openBecomeAgentModal && window.openBecomeAgentModal()" style="color:#e8785a; text-decoration:underline; font-weight:bold;">Become an Agent</a>.`;
      } else {
        sellerQuotaDesc.textContent = "Sellers can list 1 apartment at a time. Upgrade to Agent for multiple listings.";
      }
    }
  } else {
    if (planPill) {
      planPill.textContent = `${plan} PLAN`;
      planPill.className = `badge-plan-pill plan-${plan}`;
    }

    if (usageText) {
      if (isElite) {
        usageText.innerHTML = `Active listings: <strong>${count}</strong> (Unlimited capacity)`;
      } else {
        const extraNote = currentSubscriptionState.extraListingSlots > 0 ? ` <span style="font-size:10px; color:#059669; font-weight:bold;">(+${currentSubscriptionState.extraListingSlots} extra slot${currentSubscriptionState.extraListingSlots === 1 ? '' : 's'})</span>` : '';
        usageText.innerHTML = `Active listings: <strong>${count} / ${limit}</strong> slots used${extraNote}`;
      }
    }

    if (slotsRemainingBadge) {
      if (isElite) {
        slotsRemainingBadge.textContent = "Unlimited slots";
        slotsRemainingBadge.style.background = "#ecfdf5";
        slotsRemainingBadge.style.color = "#065f46";
        slotsRemainingBadge.style.border = "1px solid #a7f3d0";
      } else {
        const rem = Math.max(0, limit - count);
        slotsRemainingBadge.textContent = `${rem} slot${rem === 1 ? '' : 's'} remaining`;
        slotsRemainingBadge.style.background = rem > 0 ? "#f1f5f9" : "#fff1f2";
        slotsRemainingBadge.style.color = rem > 0 ? "#475569" : "#be123c";
        slotsRemainingBadge.style.border = rem > 0 ? "1px solid #cbd5e1" : "1px solid #fecdd3";
      }
    }

    if (limitText) {
      if (isElite) {
        limitText.textContent = "Enterprise Tier · Max Exposure & Priority Verification";
        limitText.style.color = "#10b981";
      } else if (count >= limit) {
        limitText.innerHTML = `Quota full (0 slots remaining) · Add listing to unlock single pass or upgrade plan`;
        limitText.style.color = "#ef4444";
      } else {
        limitText.textContent = `${limit - count} listing slot${limit - count === 1 ? '' : 's'} remaining in your plan`;
        limitText.style.color = "#64748b";
      }
    }

    const upgradeBtn = document.getElementById("widgetUpgradeBtn");
    if (upgradeBtn) {
      if (isElite || (plan === "PRO" && count < limit)) {
        upgradeBtn.style.display = "none";
      } else {
        upgradeBtn.style.display = "inline-flex";
      }
    }

    if (fillEl) {
      if (isElite) {
        fillEl.style.width = "100%";
        fillEl.style.background = "linear-gradient(90deg, #10b981, #059669)";
      } else {
        const pct = Math.min(100, Math.round((count / limit) * 100));
        fillEl.style.width = `${pct}%`;
        if (pct >= 100) {
          fillEl.style.background = "linear-gradient(90deg, #ef4444, #dc2626)";
        } else if (pct >= 80) {
          fillEl.style.background = "linear-gradient(90deg, #f59e0b, #d97706)";
        } else {
          fillEl.style.background = "linear-gradient(90deg, #10b981, #059669)";
        }
      }
    }
  }
}

function checkListingQuotaBeforeAdd() {
  const count = currentSubscriptionState.activeListingsCount || 0;
  const limit = currentSubscriptionState.listingLimit || 2;
  const plan = currentSubscriptionState.plan || "FREE";
  const role = currentSubscriptionState.userRole || localStorage.getItem("userRole") || "";

  if (role === "SELLER" && count >= limit) {
    if (typeof window.openSellerQuotaModal === "function") {
      window.openSellerQuotaModal();
    } else if (typeof window.openBecomeAgentModal === "function") {
      window.openBecomeAgentModal();
    } else {
      alert("Sellers can only list 1 apartment at a time until sold. To manage multiple listings, please upgrade to an Agent account or purchase an Extra Listing Pass.");
    }
    return false;
  }

  if (role === "AGENT" && plan !== "ELITE" && count >= limit) {
    window.pendingAddListingAfterSlot = true;
    openPaddlePricingModal();
    return false;
  }
  return true;
}

function showSuccessBanner(msg) {
  const banner = document.createElement("div");
  banner.style.cssText = "position:fixed; top:20px; right:20px; background:#10b981; color:white; padding:12px 20px; border-radius:10px; font-weight:bold; font-size:13px; z-index:3000; box-shadow:0 10px 30px rgba(0,0,0,0.15); animation:fadeIn .3s ease;";
  banner.textContent = "✓ " + msg;
  document.body.appendChild(banner);
  setTimeout(() => {
    banner.remove();
  }, 4000);
}
