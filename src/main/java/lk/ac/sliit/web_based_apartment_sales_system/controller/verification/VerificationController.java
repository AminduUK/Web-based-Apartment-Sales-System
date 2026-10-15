package lk.ac.sliit.web_based_apartment_sales_system.controller.verification;

import jakarta.validation.Valid;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.verification.RejectListingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
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

@CrossOrigin
@RestController
@RequestMapping("/api/verification")
@PreAuthorize("hasAnyRole('VERIFICATION_OFFICER', 'ADMIN')")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;
    private final lk.ac.sliit.web_based_apartment_sales_system.repository.ListingOverrideRepository listingOverrideRepository;

    @GetMapping("/queue")
    public ResponseEntity<List<ListingResponse>> getPendingListings() {
        return ResponseEntity.ok(verificationService.getPendingListings());
    }

    @PostMapping(value = {"/{listingId}/approve", "/queue/{listingId}/approve"})
    public ResponseEntity<ListingResponse> approveListing(
            @PathVariable Long listingId,
            @AuthenticationPrincipal User currentOfficer) {

        return ResponseEntity.ok(verificationService.approveListing(listingId, currentOfficer));
    }

    @PostMapping(value = {"/{listingId}/reject", "/queue/{listingId}/reject"})
    public ResponseEntity<ListingResponse> rejectListing(
            @PathVariable Long listingId,
            @Valid @RequestBody RejectListingRequest request,
            @AuthenticationPrincipal User currentOfficer) {

        return ResponseEntity.ok(verificationService.rejectListing(listingId, request.getComment(), currentOfficer));
    }

    @PostMapping(value = {"/{listingId}/request-documents", "/queue/{listingId}/request-documents"})
    public ResponseEntity<ListingResponse> requestMoreDocuments(
            @PathVariable Long listingId,
            @Valid @RequestBody lk.ac.sliit.web_based_apartment_sales_system.dto.request.verification.RequestMoreDocumentsRequest request,
            @AuthenticationPrincipal User currentOfficer) {

        return ResponseEntity.ok(verificationService.requestMoreDocuments(listingId, request.getNotes(), currentOfficer));
    }

    @GetMapping(value = {"/{listingId}/documents", "/queue/{listingId}/documents"})
    public ResponseEntity<List<lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse>> getListingDocuments(
            @PathVariable Long listingId) {

        return ResponseEntity.ok(verificationService.getListingDocuments(listingId));
    }

    @PostMapping(value = {"/{listingId}/admin-override", "/queue/{listingId}/admin-override"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ListingResponse> adminOverride(
            @PathVariable Long listingId,
            @Valid @RequestBody lk.ac.sliit.web_based_apartment_sales_system.dto.request.verification.AdminOverrideListingRequest request,
            @AuthenticationPrincipal User currentAdmin) {

        return ResponseEntity.ok(verificationService.adminOverrideListing(listingId, request.getReason(), request.getAction(), currentAdmin));
    }

    @GetMapping(value = {"/overrides", "/queue/overrides"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<lk.ac.sliit.web_based_apartment_sales_system.entity.ListingOverride>> getAllOverrides() {
        return ResponseEntity.ok(listingOverrideRepository.findAllByOrderByOverrideDateDesc());
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
