package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.subscription.PurchaseListingSlotRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.subscription.UpgradeSubscriptionRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.UserProfileResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;

public interface SubscriptionService {

    UserProfileResponse upgradeSubscription(UpgradeSubscriptionRequest request, User currentUser);

    UserProfileResponse getSubscriptionStatus(User currentUser);

    UserProfileResponse purchaseListingSlots(PurchaseListingSlotRequest request, User currentUser);
}
