package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.CreateBookingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.booking.BookingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.BookingMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.BookingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final List<Booking.Status> ACTIVE_STATUSES =
            List.of(Booking.Status.PENDING, Booking.Status.ACCEPTED);

    private final BookingRepository bookingRepository;
    private final ListingRepository listingRepository;

    @Override
    public BookingResponse submitBookingRequest(CreateBookingRequest request, Buyer buyer) {
        Listing listing = listingRepository.findById(request.getListingId())
                .filter(l -> l.getStatus() == Listing.Status.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Listing not found or not available for booking: " + request.getListingId()));

        if (bookingRepository.existsByBuyerIdAndListingIdAndStatusIn(
                buyer.getId(), listing.getId(), ACTIVE_STATUSES)) {
            throw new IllegalArgumentException("You already have an active booking request for this listing");
        }

        Booking booking = new Booking(buyer, listing, request.getViewingDate());
        Booking saved = bookingRepository.save(booking);

        return BookingMapper.toResponse(saved);
    }

    @Override
    public List<BookingResponse> getMyBookings(Buyer buyer) {
        return bookingRepository.findByBuyerId(buyer.getId()).stream()
                .map(BookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getIncomingBookings(User currentUser) {
        List<Booking> bookings;

        if (currentUser instanceof Seller) {
            bookings = bookingRepository.findByListing_SellerId(currentUser.getId());
        } else if (currentUser instanceof Agent) {
            bookings = bookingRepository.findByListing_AgentId(currentUser.getId());
        } else {
            // Defense in depth - @PreAuthorize should already block anyone else.
            throw new AccessDeniedException("Only Sellers and Agents receive booking requests");
        }

        return bookings.stream()
                .map(BookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponse acceptBooking(Long bookingId, User currentUser) {
        Booking booking = getOwnedPendingBookingOrThrow(bookingId, currentUser);
        booking.setStatus(Booking.Status.ACCEPTED);
        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    @Override
    public BookingResponse rejectBooking(Long bookingId, User currentUser) {
        Booking booking = getOwnedPendingBookingOrThrow(bookingId, currentUser);
        booking.setStatus(Booking.Status.REJECTED);
        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    @Override
    public BookingResponse cancelBooking(Long bookingId, Buyer buyer) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!booking.getBuyer().getId().equals(buyer.getId())) {
            throw new AccessDeniedException("You do not own this booking");
        }

        if (!ACTIVE_STATUSES.contains(booking.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending or accepted bookings can be cancelled (current status: "
                            + booking.getStatus() + ")");
        }

        booking.setStatus(Booking.Status.CANCELLED);
        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    @Override
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByRequestDateDesc().stream()
                .map(BookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponse confirmViewingCompleted(Long bookingId, BookingManager manager) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != Booking.Status.ACCEPTED) {
            throw new IllegalArgumentException(
                    "Only accepted bookings can be marked as completed (current status: "
                            + booking.getStatus() + ")");
        }

        if (booking.getViewingDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot confirm a viewing that hasn't happened yet");
        }

        booking.setStatus(Booking.Status.COMPLETED);
        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    private Booking getOwnedPendingBookingOrThrow(Long bookingId, User currentUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        Listing listing = booking.getListing();
        boolean isOwner = (listing.getSeller() != null && listing.getSeller().getId().equals(currentUser.getId()))
                || (listing.getAgent() != null && listing.getAgent().getId().equals(currentUser.getId()));

        if (!isOwner) {
            throw new AccessDeniedException("You do not own the listing this booking is for");
        }

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new IllegalArgumentException(
                    "Booking has already been decided (current status: " + booking.getStatus() + ")");
        }

        return booking;
    }
}

