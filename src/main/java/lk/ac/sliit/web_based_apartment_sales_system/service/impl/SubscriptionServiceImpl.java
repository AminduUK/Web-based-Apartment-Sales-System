package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.subscription.UpgradeSubscriptionRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.UserProfileResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Agent;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Listing;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Notification;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Seller;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.NotificationRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.UserRepository;
import lk.ac.sliit.web_based_apartment_sales_system.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final NotificationRepository notificationRepository;
    private final lk.ac.sliit.web_based_apartment_sales_system.pattern.strategy.PaymentContext paymentContext;
    private final lk.ac.sliit.web_based_apartment_sales_system.service.SystemSettingService systemSettingService;
    private final lk.ac.sliit.web_based_apartment_sales_system.repository.PaymentTransactionRepository paymentTransactionRepository;

    @Override
    @Transactional
    public UserProfileResponse upgradeSubscription(UpgradeSubscriptionRequest request, User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + currentUser.getId()));

        if (user.getRole() != User.Role.AGENT) {
            throw new IllegalArgumentException("Subscription plans are only available for Real Estate Agents. Sellers do not require a subscription plan (individual sellers can list 1 apartment at a time, or upgrade to an Agent account to manage multiple listings).");
        }

        User.SubscriptionPlan newPlan;
        try {
            newPlan = User.SubscriptionPlan.valueOf(request.getPlan().toUpperCase().trim());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid plan: '" + request.getPlan() + "'. Accepted plans are: FREE, PRO, ELITE");
        }

        User.BillingCycle billingCycle = User.BillingCycle.MONTHLY;
        if (request.getBillingCycle() != null && !request.getBillingCycle().isBlank()) {
            try {
                billingCycle = User.BillingCycle.valueOf(request.getBillingCycle().toUpperCase().trim());
            } catch (Exception e) {
                billingCycle = User.BillingCycle.MONTHLY;
            }
        }

        user.setSubscriptionPlan(newPlan);
        user.setBillingCycle(billingCycle);
        // Only paid plans (PRO and ELITE) grant the verified badge! FREE plan is unverified
        boolean isPaidPlan = (newPlan == User.SubscriptionPlan.PRO || newPlan == User.SubscriptionPlan.ELITE);
        user.setVerified(isPaidPlan);
        userRepository.save(user);

        // Execute Strategy Pattern for Subscription Payment if paid tier
        String paymentMethodText = (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                ? request.getPaymentMethod()
                : "Card (Paddle Sandbox)";
        String cycleText = (billingCycle == User.BillingCycle.ANNUAL) ? "Annual (Save 20%)" : "Monthly";
        if (isPaidPlan) {
            Double proPrice = systemSettingService.getDoubleSetting("SUBSCRIPTION_PRO_PRICE", 4900.0);
            Double elitePrice = systemSettingService.getDoubleSetting("SUBSCRIPTION_ELITE_PRICE", 12900.0);
            Double planFee = (newPlan == User.SubscriptionPlan.PRO) ? proPrice : elitePrice;
            String txnRef = "SUB-" + System.currentTimeMillis();
            paymentContext.executePayment(planFee, paymentMethodText, txnRef, user.getEmail());

            paymentTransactionRepository.save(new lk.ac.sliit.web_based_apartment_sales_system.entity.PaymentTransaction(
                    txnRef,
                    newPlan == User.SubscriptionPlan.PRO ? "SUBSCRIPTION_PRO" : "SUBSCRIPTION_ELITE",
                    "AGENT_SUBSCRIPTION",
                    user.getId(),
                    user.getFirstName() + " " + user.getLastName(),
                    user.getEmail(),
                    "AGENT",
                    planFee,
                    paymentMethodText,
                    "PAID",
                    "Agent " + newPlan.name() + " Plan Subscription (" + cycleText + ")",
                    java.time.LocalDateTime.now()
            ));
        }

        // Send confirmation notification
        String limitText = (newPlan == User.SubscriptionPlan.ELITE) ? "unlimited" : String.valueOf(user.getListingLimit());
        String badgeMsg = isPaidPlan ? "with an official verified badge." : "without a verified badge. Upgrade to Pro or Elite to become verified.";

        notificationRepository.save(new Notification(
                user,
                "Subscription Plan Active: " + newPlan.name(),
                "Your account is now on the " + newPlan.name() + " (" + cycleText + ") plan via " 
                        + paymentMethodText + ". You can actively manage up to " + limitText + " listings " + badgeMsg,
                null,
                null
        ));

        // Notify Admins
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        for (User admin : admins) {
            notificationRepository.save(new Notification(
                    admin,
                    "💎 Subscription Upgraded: " + newPlan.name(),
                    user.getFirstName() + " " + user.getLastName() + " (" + user.getEmail() + ") upgraded to " 
                            + newPlan.name() + " (" + cycleText + ") via " + paymentMethodText + ".",
                    null,
                    null
            ));
        }

        return buildProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse purchaseListingSlots(lk.ac.sliit.web_based_apartment_sales_system.dto.request.subscription.PurchaseListingSlotRequest request, User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + currentUser.getId()));

        if (user.getRole() != User.Role.SELLER && user.getRole() != User.Role.AGENT) {
            throw new IllegalArgumentException("Only Property Sellers and Real Estate Agents can purchase additional listing slots.");
        }

        int slotsToAdd = (request != null && request.getSlots() > 0) ? request.getSlots() : 1;
        user.setExtraListingSlots(user.getExtraListingSlots() + slotsToAdd);
        userRepository.save(user);

        String paymentMethod = (request != null && request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                ? request.getPaymentMethod()
                : "Card (Paddle Sandbox)";

        String roleLabel = (user.getRole() == User.Role.SELLER) ? "Seller Single Listing Pass" : "Agent Pay-Per-Listing Slot";
        Double sellerPrice = systemSettingService.getDoubleSetting("PRICING_SELLER_SLOT", 2500.0);
        Double agentPrice = systemSettingService.getDoubleSetting("PRICING_AGENT_SLOT", 2500.0);
        Double slotPrice = (user.getRole() == User.Role.SELLER) ? sellerPrice : agentPrice;
        if (request != null && request.getAmountPaid() != null && request.getAmountPaid().doubleValue() > 0) {
            slotPrice = request.getAmountPaid().doubleValue();
        }

        String txnRef = (request != null && request.getTransactionReference() != null && !request.getTransactionReference().isBlank())
                ? request.getTransactionReference()
                : "SLOT-" + System.currentTimeMillis();

        // Strategy Pattern Execution: Delegate slot charge to appropriate PaymentStrategy
        paymentContext.executePayment(slotPrice, paymentMethod, txnRef, user.getEmail());

        paymentTransactionRepository.save(new lk.ac.sliit.web_based_apartment_sales_system.entity.PaymentTransaction(
                txnRef,
                user.getRole() == User.Role.SELLER ? "SELLER_SINGLE_PASS" : "AGENT_EXTRA_SLOT",
                "PAY_PER_LISTING",
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                slotPrice,
                paymentMethod,
                "PAID",
                roleLabel + " (+" + slotsToAdd + " Slot" + (slotsToAdd > 1 ? "s" : "") + ")",
                java.time.LocalDateTime.now()
        ));

        String priceText = "LKR " + String.format("%,.2f", slotPrice);

        notificationRepository.save(new Notification(
                user,
                "Listing Capacity Increased: +" + slotsToAdd + " Slot(s)",
                "Successfully purchased " + slotsToAdd + " extra listing slot(s) (" + roleLabel + ") for " 
                        + priceText + " via " + paymentMethod + ". Your active listing limit is now " 
                        + user.getListingLimit() + " properties.",
                null,
                null
        ));

        // Notify Admins
        List<User> adminList = userRepository.findByRole(User.Role.ADMIN);
        for (User admin : adminList) {
            notificationRepository.save(new Notification(
                    admin,
                    "💰 Extra Listing Slot Purchased",
                    user.getFirstName() + " " + user.getLastName() + " (" + user.getEmail() + ") purchased " 
                            + slotsToAdd + " extra slot (" + roleLabel + ") for " + priceText + " via " + paymentMethod + ".",
                    null,
                    null
            ));
        }

        return buildProfileResponse(user);
    }

    @Override
    public UserProfileResponse getSubscriptionStatus(User currentUser) {
        User user = userRepository.findById(currentUser.getId()).orElse(currentUser);
        return buildProfileResponse(user);
    }

    private UserProfileResponse buildProfileResponse(User user) {
        long activeCount = 0;
        if (user instanceof Seller) {
            activeCount = listingRepository.countBySellerIdAndStatusNotIn(user.getId(), java.util.List.of(Listing.Status.WITHDRAWN, Listing.Status.SOLD));
        } else if (user instanceof Agent) {
            activeCount = listingRepository.countByAgentIdAndStatusNotIn(user.getId(), java.util.List.of(Listing.Status.WITHDRAWN, Listing.Status.SOLD));
        }

        String licenseNumber = (user instanceof Agent agent) ? agent.getLicenseNumber() : null;

        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .registrationDate(user.getRegistrationDate())
                .licenseNumber(licenseNumber)
                .rating(null)
                .subscriptionPlan(user.getRole() == User.Role.AGENT ? (user.getSubscriptionPlan() != null ? user.getSubscriptionPlan().name() : "FREE") : null)
                .billingCycle(user.getRole() == User.Role.AGENT ? (user.getBillingCycle() != null ? user.getBillingCycle().name() : "MONTHLY") : null)
                .listingLimit(user.getListingLimit(systemSettingService))
                .extraListingSlots(user.getExtraListingSlots())
                .activeListingsCount(activeCount)
                .verified(user.getVerified() != null ? user.getVerified() : false)
                .build();
    }
}
