package lk.ac.sliit.web_based_apartment_sales_system.controller.verification;

import jakarta.validation.Valid;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.verification.RejectListingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.VerificationOfficer;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/verification")
@PreAuthorize("hasRole('VERIFICATION_OFFICER')")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @GetMapping("/queue")
    public ResponseEntity<List<ListingResponse>> getPendingListings() {
        return ResponseEntity.ok(verificationService.getPendingListings());
    }

    @PostMapping("/{listingId}/approve")
    public ResponseEntity<ListingResponse> approveListing(
            @PathVariable Long listingId,
            @AuthenticationPrincipal VerificationOfficer currentOfficer) {

        return ResponseEntity.ok(verificationService.approveListing(listingId, currentOfficer));
    }

    @PostMapping("/{listingId}/reject")
    public ResponseEntity<ListingResponse> rejectListing(
            @PathVariable Long listingId,
            @Valid @RequestBody RejectListingRequest request,
            @AuthenticationPrincipal VerificationOfficer currentOfficer) {

        return ResponseEntity.ok(verificationService.rejectListing(listingId, request.getComment(), currentOfficer));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

}
