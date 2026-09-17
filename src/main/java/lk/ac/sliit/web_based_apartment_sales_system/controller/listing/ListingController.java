package lk.ac.sliit.web_based_apartment_sales_system.controller.listing;

import jakarta.validation.Valid;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing.CreateListingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<ListingResponse> createListing(
            @Valid @RequestBody CreateListingRequest request,
            @AuthenticationPrincipal User currentUser) {

        ListingResponse response = listingService.createListing(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Open to any authenticated user (buyers searching, but nothing stops
    // a seller/agent/VO from browsing too) - published listings only.
    @GetMapping
    public ResponseEntity<List<ListingResponse>> getPublishedListings() {
        return ResponseEntity.ok(listingService.getPublishedListings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingResponse> getListingById(@PathVariable Long id) {
        return ResponseEntity.ok(listingService.getPublishedListingById(id));
    }

    // The seller/agent's dashboard - every listing they own, any status.
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<List<ListingResponse>> getMyListings(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(listingService.getMyListings(currentUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<ListingResponse> updateListing(
            @PathVariable Long id,
            @Valid @RequestBody CreateListingRequest request,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(listingService.updateListing(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<Void> deleteListing(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        listingService.deleteListing(id, currentUser);
        return ResponseEntity.noContent().build();
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
