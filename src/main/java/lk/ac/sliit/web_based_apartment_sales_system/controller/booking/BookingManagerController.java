package lk.ac.sliit.web_based_apartment_sales_system.controller.booking;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.booking.BookingResponse;
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
@RequestMapping("/api/bookings/manage")
@PreAuthorize("hasAnyRole('BOOKING_MANAGER', 'ADMIN')")
public class BookingManagerController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<BookingResponse> acceptBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentManager) {

        return ResponseEntity.ok(bookingService.acceptBookingByManager(id, currentManager));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentManager) {

        return ResponseEntity.ok(bookingService.rejectBookingByManager(id, currentManager));
    }

    @PatchMapping("/{id}/confirm-viewing")
    public ResponseEntity<BookingResponse> confirmViewingCompleted(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentManager) {

        return ResponseEntity.ok(bookingService.confirmViewingCompleted(id, currentManager));
    }

    @PatchMapping("/{id}/refund-partial")
    public ResponseEntity<BookingResponse> processPartialRefund(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentManager) {

        return ResponseEntity.ok(bookingService.processPartialRefund(id, currentManager));
    }

    @GetMapping("/disputes")
    public ResponseEntity<List<BookingResponse>> getDisputedBookings() {
        return ResponseEntity.ok(bookingService.getDisputedBookings());
    }

    @PatchMapping("/{id}/resolve-dispute")
    public ResponseEntity<BookingResponse> resolveDispute(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.ResolveDisputeRequest request,
            @AuthenticationPrincipal User currentManager) {

        return ResponseEntity.ok(bookingService.resolveDispute(id, request, currentManager));
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