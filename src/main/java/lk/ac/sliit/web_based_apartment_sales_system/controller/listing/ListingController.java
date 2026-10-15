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

    @GetMapping({"/my", "/my-listings"})
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

    @PutMapping("/{id}/amenities")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT', 'ADMIN')")
    public ResponseEntity<ListingResponse> updateListingAmenities(
            @PathVariable Long id,
            @RequestBody List<Long> amenityIds,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(listingService.updateListingAmenities(id, amenityIds, currentUser));
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT', 'ADMIN')")
    public ResponseEntity<ListingResponse> updateAvailability(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        String schedule = body.getOrDefault("availabilitySchedule", "");
        return ResponseEntity.ok(listingService.updateAvailabilitySchedule(id, schedule, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<Void> deleteListing(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        listingService.deleteListing(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/sold")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<ListingResponse> markAsSold(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(listingService.markAsSold(id, currentUser));
    }

    @PostMapping(value = "/upload-image", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> uploadImage(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        String url = listingService.uploadImage(file, currentUser);
        return ResponseEntity.ok(java.util.Map.of("imageUrl", url));
    }

    @PostMapping(value = "/upload-document", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT', 'ADMIN')")
    public ResponseEntity<lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse> uploadDocument(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "documentType", required = false) String documentType,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(listingService.uploadDocument(file, documentType, currentUser));
    }

    @PostMapping(value = "/{id}/documents/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT', 'ADMIN')")
    public ResponseEntity<lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse> uploadDocumentToListing(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "documentType", required = false) String documentType,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(listingService.addDocumentToListing(id, file, documentType, currentUser));
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT', 'ADMIN')")
    public ResponseEntity<lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse> attachDocumentToListing(
            @PathVariable Long id,
            @RequestBody lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing.DocumentRequest documentRequest,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(listingService.attachDocumentToListing(id, documentRequest, currentUser));
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse>> getListingDocuments(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(listingService.getListingDocuments(id, currentUser));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<java.util.Map<String, Object>> toggleFavorite(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        boolean isFav = true;
        if (body != null && body.containsKey("isFavorite")) {
            isFav = Boolean.parseBoolean(String.valueOf(body.get("isFavorite")));
        }
        int count = listingService.toggleFavorite(id, isFav);
        return ResponseEntity.ok(java.util.Map.of("listingId", id, "favoriteCount", count, "isFavorite", isFav));
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
