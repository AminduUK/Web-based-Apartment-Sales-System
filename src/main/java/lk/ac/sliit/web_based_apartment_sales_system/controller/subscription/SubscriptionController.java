package lk.ac.sliit.web_based_apartment_sales_system.controller.subscription;

import jakarta.validation.Valid;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.subscription.UpgradeSubscriptionRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.UserProfileResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lk.ac.sliit.web_based_apartment_sales_system.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/subscription")
@PreAuthorize("isAuthenticated()")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/status")
    public ResponseEntity<UserProfileResponse> getSubscriptionStatus(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(subscriptionService.getSubscriptionStatus(currentUser));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<UserProfileResponse> upgradeSubscription(
            @Valid @RequestBody UpgradeSubscriptionRequest request,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(subscriptionService.upgradeSubscription(request, currentUser));
    }

    @PostMapping("/purchase-slot")
    public ResponseEntity<UserProfileResponse> purchaseListingSlot(
            @Valid @RequestBody lk.ac.sliit.web_based_apartment_sales_system.dto.request.subscription.PurchaseListingSlotRequest request,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(subscriptionService.purchaseListingSlots(request, currentUser));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
