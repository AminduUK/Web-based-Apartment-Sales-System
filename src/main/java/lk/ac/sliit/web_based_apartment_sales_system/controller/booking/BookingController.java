package lk.ac.sliit.web_based_apartment_sales_system.controller.booking;

import jakarta.validation.Valid;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.CreateBookingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.booking.BookingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Buyer;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.service.BookingService;
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
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<BookingResponse> submitBookingRequest(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal Buyer currentBuyer) {

        BookingResponse response = bookingService.submitBookingRequest(request, currentBuyer);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal Buyer currentBuyer) {
        return ResponseEntity.ok(bookingService.getMyBookings(currentBuyer));
    }

    @GetMapping("/incoming")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<List<BookingResponse>> getIncomingBookings(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(bookingService.getIncomingBookings(currentUser));
    }

    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<BookingResponse> acceptBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(bookingService.acceptBooking(id, currentUser));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(bookingService.rejectBooking(id, currentUser));
    }

    @GetMapping("/listing/{listingId}/booked-slots")
    public ResponseEntity<List<BookingResponse>> getBookedSlots(@PathVariable Long listingId) {
        return ResponseEntity.ok(bookingService.getBookedSlotsForListing(listingId));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        if (currentUser instanceof Buyer) {
            return ResponseEntity.ok(bookingService.cancelBooking(id, (Buyer) currentUser));
        } else {
            return ResponseEntity.ok(bookingService.cancelBookingByOwner(id, currentUser));
        }
    }

    @PatchMapping("/{id}/owner-cancel")
    @PreAuthorize("hasAnyRole('SELLER', 'AGENT')")
    public ResponseEntity<BookingResponse> cancelBookingByOwner(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(bookingService.cancelBookingByOwner(id, currentUser));
    }

    @PostMapping("/{id}/dispute")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> raiseDispute(
            @PathVariable Long id,
            @Valid @RequestBody lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.RaiseDisputeRequest request,
            @AuthenticationPrincipal User currentUser) {

        return ResponseEntity.ok(bookingService.raiseDispute(id, request, currentUser));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<java.util.Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Map.of("message", ex.getMessage(), "error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<java.util.Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(java.util.Map.of("message", ex.getMessage(), "error", ex.getMessage()));
    }
}
