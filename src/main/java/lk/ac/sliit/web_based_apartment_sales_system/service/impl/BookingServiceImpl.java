package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.CreateBookingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.RaiseDisputeRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.ResolveDisputeRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.booking.BookingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.BookingMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.BookingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.NotificationRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.UserRepository;
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
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final lk.ac.sliit.web_based_apartment_sales_system.pattern.strategy.PaymentContext paymentContext;
    private final lk.ac.sliit.web_based_apartment_sales_system.service.SystemSettingService systemSettingService;
    private final lk.ac.sliit.web_based_apartment_sales_system.repository.PaymentTransactionRepository paymentTransactionRepository;
    private final lk.ac.sliit.web_based_apartment_sales_system.repository.BookingRescheduleRepository bookingRescheduleRepository;

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

        String timeSlot = request.getViewingTime() != null ? request.getViewingTime().trim() : null;

        // 1. Check if the listing itself is already booked on this date/time slot
        if (timeSlot != null && !timeSlot.isEmpty()) {
            if (bookingRepository.existsByListingIdAndViewingDateAndViewingTimeAndStatusIn(
                    listing.getId(), request.getViewingDate(), timeSlot, ACTIVE_STATUSES)) {
                throw new IllegalArgumentException("This property is already booked for a viewing on " 
                        + request.getViewingDate() + " (" + timeSlot + "). Please choose another date or time slot.");
            }
        } else {
            if (bookingRepository.existsByListingIdAndViewingDateAndStatusIn(
                    listing.getId(), request.getViewingDate(), ACTIVE_STATUSES)) {
                throw new IllegalArgumentException("This property is already booked for a viewing on " 
                        + request.getViewingDate() + ". Please choose another date or time slot.");
            }
        }

        // 2. Check if the listing's assigned Seller or Agent already has a booking on this date/time slot
        if (listing.getSeller() != null) {
            Long sellerId = listing.getSeller().getId();
            if (timeSlot != null && !timeSlot.isEmpty()) {
                if (bookingRepository.existsByListing_SellerIdAndViewingDateAndViewingTimeAndStatusIn(
                        sellerId, request.getViewingDate(), timeSlot, ACTIVE_STATUSES)) {
                    throw new IllegalArgumentException("The property owner (Seller) already has a viewing scheduled on " 
                            + request.getViewingDate() + " (" + timeSlot + "). Please select another time slot or date.");
                }
            } else {
                if (bookingRepository.existsByListing_SellerIdAndViewingDateAndStatusIn(
                        sellerId, request.getViewingDate(), ACTIVE_STATUSES)) {
                    throw new IllegalArgumentException("The property owner (Seller) already has a viewing scheduled on " 
                            + request.getViewingDate() + ". Please select another date.");
                }
            }
        } else if (listing.getAgent() != null) {
            Long agentId = listing.getAgent().getId();
            if (timeSlot != null && !timeSlot.isEmpty()) {
                if (bookingRepository.existsByListing_AgentIdAndViewingDateAndViewingTimeAndStatusIn(
                        agentId, request.getViewingDate(), timeSlot, ACTIVE_STATUSES)) {
                    throw new IllegalArgumentException("The assigned Agent already has an appointment scheduled on " 
                            + request.getViewingDate() + " (" + timeSlot + "). Please select another time slot or date.");
                }
            } else {
                if (bookingRepository.existsByListing_AgentIdAndViewingDateAndStatusIn(
                        agentId, request.getViewingDate(), ACTIVE_STATUSES)) {
                    throw new IllegalArgumentException("The assigned Agent already has an appointment scheduled on " 
                            + request.getViewingDate() + ". Please select another date.");
                }
            }
        }

        Double defaultAdvance = systemSettingService != null 
                ? systemSettingService.getDoubleSetting("PRICING_BOOKING_ADVANCE", 5000.0) 
                : 5000.0;
        Double advanceAmount = request.getAdvancePaymentAmount() != null && request.getAdvancePaymentAmount() > 0
                ? request.getAdvancePaymentAmount() : defaultAdvance;
        String requestedMethod = request.getPaymentMethod() != null && !request.getPaymentMethod().trim().isEmpty()
                ? request.getPaymentMethod() : "Card (Paddle Sandbox)";
        String txnRef = request.getTransactionReference() != null && !request.getTransactionReference().trim().isEmpty()
                ? request.getTransactionReference() : "TXN-BK-" + System.currentTimeMillis();

        // Strategy Pattern Execution: Delegate payment to appropriate PaymentStrategy via PaymentContext
        lk.ac.sliit.web_based_apartment_sales_system.pattern.strategy.PaymentResult paymentResult =
                paymentContext.executePayment(advanceAmount, requestedMethod, txnRef, buyer.getEmail());

        Booking booking = new Booking(buyer, listing, request.getViewingDate(), timeSlot);
        booking.setAdvancePaymentAmount(paymentResult.getAmount());
        booking.setPaymentStatus(paymentResult.getPaymentStatus());
        booking.setPaymentMethod(paymentResult.getPaymentMethod());
        booking.setTransactionReference(paymentResult.getTransactionReference());
        booking.setPaymentDate(LocalDate.now());
        booking.setRefundStatus("NONE");
        booking.setRefundAmount(0.0);
        booking.setCancelledAfterAccepted(false);

        Booking saved = bookingRepository.save(booking);

        // Save to centralized payment_transactions table
        paymentTransactionRepository.save(new lk.ac.sliit.web_based_apartment_sales_system.entity.PaymentTransaction(
                paymentResult.getTransactionReference(),
                "VIEWING_ADVANCE",
                "VIEWING_DEPOSIT",
                buyer.getId(),
                buyer.getFirstName() + " " + buyer.getLastName(),
                buyer.getEmail(),
                "BUYER",
                paymentResult.getAmount(),
                paymentResult.getPaymentMethod(),
                paymentResult.getPaymentStatus(),
                "Viewing Advance Deposit: " + listing.getTitle() + " (" + (listing.getAddress() != null ? listing.getAddress().getCity() : "Colombo") + ")",
                java.time.LocalDateTime.now()
        ));

        String dateTimeDisplay = request.getViewingDate() + (timeSlot != null && !timeSlot.isEmpty() ? " at " + timeSlot : "");

        // Notify Buyer
        notificationRepository.save(new Notification(
                buyer,
                "Viewing Request Submitted",
                "Your viewing request for '" + listing.getTitle() + "' on " + dateTimeDisplay 
                        + " has been received with an advance deposit of LKR " + String.format("%,.2f", advanceAmount) 
                        + " (Ref: " + txnRef + ") and is awaiting confirmation from the Booking Manager.",
                saved.getId(),
                listing.getId()
        ));

        // Notify Booking Managers
        List<User> managers = userRepository.findByRole(User.Role.BOOKING_MANAGER);
        for (User manager : managers) {
            notificationRepository.save(new Notification(
                    manager,
                    "New Booking Request (Advance Paid)",
                    "Buyer " + buyer.getFirstName() + " " + buyer.getLastName() + " requested a viewing for '" 
                            + listing.getTitle() + "' on " + dateTimeDisplay + ". Advance deposit of LKR " 
                            + String.format("%,.2f", advanceAmount) + " PAID via " + paymentResult.getPaymentMethod() + " (Ref: " + txnRef + ").",
                    saved.getId(),
                    listing.getId()
            ));
        }

        // Notify Listing Owner (Seller or Agent)
        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        if (owner != null) {
            notificationRepository.save(new Notification(
                    owner,
                    "📅 New Apartment Viewing Booked",
                    "Buyer " + buyer.getFirstName() + " " + buyer.getLastName() + " requested a viewing for your property '" 
                            + listing.getTitle() + "' on " + dateTimeDisplay + ". Advance deposit: LKR " 
                            + String.format("%,.2f", advanceAmount) + " (" + paymentResult.getPaymentMethod() + "). Check your Upcoming Bookings!",
                    saved.getId(),
                    listing.getId()
            ));
        }

        // Notify Admins
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        for (User admin : admins) {
            notificationRepository.save(new Notification(
                    admin,
                    "📅 New Viewing Booked & Deposit Paid",
                    "Viewing booked for '" + listing.getTitle() + "' on " + dateTimeDisplay + ". Advance deposit: LKR " 
                            + String.format("%,.2f", advanceAmount) + " paid by " + buyer.getFirstName() + " " + buyer.getLastName() + ".",
                    saved.getId(),
                    listing.getId()
            ));
        }

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
            bookings = bookingRepository.findByListing_SellerIdOrderByIdDesc(currentUser.getId());
        } else if (currentUser instanceof Agent) {
            bookings = bookingRepository.findByListing_AgentIdOrderByIdDesc(currentUser.getId());
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
        Booking saved = bookingRepository.save(booking);

        notificationRepository.save(new Notification(
                booking.getBuyer(),
                "Viewing Request Accepted",
                "Your viewing request for '" + booking.getListing().getTitle() + "' on " + booking.getViewingDate() 
                        + " has been accepted by the property " + (currentUser.getRole() == User.Role.SELLER ? "seller" : "agent") + ".",
                saved.getId(),
                booking.getListing().getId()
        ));

        return BookingMapper.toResponse(saved);
    }

    @Override
    public BookingResponse rejectBooking(Long bookingId, User currentUser) {
        return cancelBookingByOwner(bookingId, currentUser);
    }

    @Override
    public BookingResponse cancelBookingByOwner(Long bookingId, User currentUser) {
        Booking booking = getOwnedActiveBookingOrThrow(bookingId, currentUser);
        booking.setStatus(Booking.Status.CANCELLED);

        // When seller or agent cancels, the buyer receives a 100% FULL REFUND
        double advance = booking.getAdvancePaymentAmount() != null ? booking.getAdvancePaymentAmount() : 5000.0;
        booking.setRefundAmount(advance);
        booking.setRefundStatus("PENDING");

        Booking saved = bookingRepository.save(booking);

        String ownerRole = currentUser.getRole() == User.Role.SELLER ? "seller" : "agent";

        // Notify Buyer of 100% Full Refund
        notificationRepository.save(new Notification(
                booking.getBuyer(),
                "Appointment Cancelled by Property " + (currentUser.getRole() == User.Role.SELLER ? "Seller" : "Agent") + " - 100% Full Refund",
                "Your viewing appointment for '" + booking.getListing().getTitle() + "' on " + booking.getViewingDate() 
                        + " was cancelled by the property " + ownerRole + ". Since the cancellation was made by the property owner, you are entitled to a 100% FULL REFUND of LKR " 
                        + String.format("%,.2f", advance) + " which will be authorized by the Booking Manager.",
                saved.getId(),
                booking.getListing().getId()
        ));

        // Notify Booking Managers
        List<User> managers = userRepository.findByRole(User.Role.BOOKING_MANAGER);
        for (User manager : managers) {
            notificationRepository.save(new Notification(
                    manager,
                    "Owner Cancellation: 100% Full Refund Required",
                    (currentUser.getRole() == User.Role.SELLER ? "Seller" : "Agent") + " " + currentUser.getFirstName() + " " + currentUser.getLastName()
                            + " cancelled booking #" + booking.getId() + " for '" + booking.getListing().getTitle() 
                            + "'. Please authorize a 100% full refund of LKR " + String.format("%,.2f", advance) 
                            + " to buyer " + booking.getBuyer().getFirstName() + " " + booking.getBuyer().getLastName() + ".",
                    booking.getId(),
                    booking.getListing().getId()
            ));
        }

        return BookingMapper.toResponse(saved);
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

        boolean wasAccepted = booking.getStatus() == Booking.Status.ACCEPTED;
        booking.setStatus(Booking.Status.CANCELLED);

        double advance = booking.getAdvancePaymentAmount() != null ? booking.getAdvancePaymentAmount() : 5000.0;

        if (wasAccepted) {
            booking.setCancelledAfterAccepted(true);
            double partialRefund = advance * 0.50; // 50% partial refund as per cancellation policy
            booking.setRefundAmount(partialRefund);
            booking.setRefundStatus("PENDING"); // Pending booking manager authorization

            // Notify Booking Managers of cancellation requiring partial refund
            List<User> managers = userRepository.findByRole(User.Role.BOOKING_MANAGER);
            for (User manager : managers) {
                notificationRepository.save(new Notification(
                        manager,
                        "Cancellation: Partial Refund Pending",
                        "Buyer " + buyer.getFirstName() + " " + buyer.getLastName() + " cancelled their confirmed viewing for '" 
                                + booking.getListing().getTitle() + "'. A 50% partial refund of LKR " 
                                + String.format("%,.2f", partialRefund) + " is pending your authorization.",
                        booking.getId(),
                        booking.getListing().getId()
                ));
            }

            // Notify Buyer
            notificationRepository.save(new Notification(
                    buyer,
                    "Booking Cancelled - Partial Refund Pending",
                    "Your booking for '" + booking.getListing().getTitle() + "' has been cancelled. In accordance with our cancellation policy, a 50% partial refund of LKR " 
                            + String.format("%,.2f", partialRefund) + " has been initiated and will be processed by the Booking Manager.",
                    booking.getId(),
                    booking.getListing().getId()
            ));
        } else {
            booking.setRefundAmount(advance);
            booking.setRefundStatus("PENDING");
        }

        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    @Override
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByIdDesc().stream()
                .map(BookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponse confirmViewingCompleted(Long bookingId, User manager) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != Booking.Status.ACCEPTED && booking.getStatus() != Booking.Status.PENDING) {
            throw new IllegalArgumentException(
                    "Only accepted or pending bookings can be marked as completed (current status: "
                            + booking.getStatus() + ")");
        }

        booking.setStatus(Booking.Status.COMPLETED);
        Booking saved = bookingRepository.save(booking);

        Listing listing = booking.getListing();
        Buyer buyer = booking.getBuyer();

        // 1. Notify Buyer
        if (buyer != null && notificationRepository != null) {
            notificationRepository.save(new Notification(
                    buyer,
                    "Viewing Completed",
                    "Your apartment viewing for '" + (listing != null ? listing.getTitle() : "Listing") + "' has been successfully completed.",
                    saved.getId(),
                    listing != null ? listing.getId() : null
            ));
        }

        // 2. Notify Owner (Seller or Agent)
        if (listing != null && notificationRepository != null) {
            User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
            if (owner != null) {
                notificationRepository.save(new Notification(
                        owner,
                        "Viewing Completed",
                        "The viewing appointment for '" + listing.getTitle() + "' with buyer "
                                + (buyer != null ? buyer.getFirstName() + " " + buyer.getLastName() : "Buyer")
                                + " has been marked as completed by operations.",
                        saved.getId(),
                        listing.getId()
                ));
            }
        }

        return BookingMapper.toResponse(saved);
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

    private Booking getOwnedActiveBookingOrThrow(Long bookingId, User currentUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        Listing listing = booking.getListing();
        boolean isOwner = (listing.getSeller() != null && listing.getSeller().getId().equals(currentUser.getId()))
                || (listing.getAgent() != null && listing.getAgent().getId().equals(currentUser.getId()));

        if (!isOwner) {
            throw new AccessDeniedException("You do not own the listing this booking is for");
        }

        if (booking.getStatus() != Booking.Status.PENDING && booking.getStatus() != Booking.Status.ACCEPTED) {
            throw new IllegalArgumentException(
                    "Booking cannot be cancelled in its current status: " + booking.getStatus());
        }

        return booking;
    }

    @Override
    public BookingResponse acceptBookingByManager(Long bookingId, User manager) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new IllegalArgumentException(
                    "Only pending bookings can be accepted (current status: " + booking.getStatus() + ")");
        }

        booking.setStatus(Booking.Status.ACCEPTED);
        Booking saved = bookingRepository.save(booking);

        Listing listing = booking.getListing();
        Buyer buyer = booking.getBuyer();

        String timeInfo = booking.getViewingTime() != null && !booking.getViewingTime().isEmpty() ? " at " + booking.getViewingTime() : "";

        // 1. Notify the listing owner (Seller or Agent)
        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        if (owner != null) {
            notificationRepository.save(new Notification(
                    owner,
                    "Viewing Booking Confirmed",
                    "A viewing booking has been confirmed for your property '" + listing.getTitle() + "' with buyer "
                            + buyer.getFirstName() + " " + buyer.getLastName()
                            + (buyer.getPhone() != null ? " (Phone: " + buyer.getPhone() + ")" : "")
                            + " for date " + booking.getViewingDate() + timeInfo + ".",
                    saved.getId(),
                    listing.getId()
            ));
        }

        // 2. Notify the Buyer
        notificationRepository.save(new Notification(
                buyer,
                "Booking Confirmed!",
                "Great news! Your viewing booking for '" + listing.getTitle() + "' on "
                        + booking.getViewingDate() + timeInfo + " has been confirmed by the Booking Manager.",
                saved.getId(),
                listing.getId()
        ));

        return BookingMapper.toResponse(saved);
    }

    @Override
    public BookingResponse rejectBookingByManager(Long bookingId, User manager) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new IllegalArgumentException(
                    "Only pending bookings can be rejected (current status: " + booking.getStatus() + ")");
        }

        booking.setStatus(Booking.Status.REJECTED);
        Booking saved = bookingRepository.save(booking);

        String timeInfo = booking.getViewingTime() != null && !booking.getViewingTime().isEmpty() ? " at " + booking.getViewingTime() : "";

        // Notify Buyer
        notificationRepository.save(new Notification(
                booking.getBuyer(),
                "Booking Update",
                "Your viewing request for '" + booking.getListing().getTitle() + "' on "
                        + booking.getViewingDate() + timeInfo + " could not be confirmed.",
                saved.getId(),
                booking.getListing().getId()
        ));

        return BookingMapper.toResponse(saved);
    }

    @Override
    public List<BookingResponse> getBookedSlotsForListing(Long listingId) {
        return bookingRepository.findByListingIdAndStatusIn(listingId, ACTIVE_STATUSES).stream()
                .map(BookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponse processPartialRefund(Long bookingId, User manager) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != Booking.Status.CANCELLED) {
            throw new IllegalArgumentException("Only cancelled bookings can be refunded (current status: " + booking.getStatus() + ")");
        }

        double advance = booking.getAdvancePaymentAmount() != null ? booking.getAdvancePaymentAmount() : 5000.0;
        double refund = booking.getRefundAmount() != null && booking.getRefundAmount() > 0 ? booking.getRefundAmount() : advance * 0.50;
        boolean isFull = refund >= (advance - 0.01);

        booking.setRefundAmount(refund);
        booking.setRefundStatus(isFull ? "REFUNDED" : "PARTIALLY_REFUNDED");
        booking.setPaymentStatus(isFull ? "REFUNDED" : "PARTIALLY_REFUNDED");
        Booking saved = bookingRepository.save(booking);

        // Notify Buyer
        String refundTitle = isFull ? "100% Full Refund Processed" : "Partial Refund Processed";
        String refundMsg = isFull
                ? "Your 100% full refund of LKR " + String.format("%,.2f", refund) + " for '" + booking.getListing().getTitle()
                + "' has been authorized and issued to your " + (booking.getPaymentMethod() != null ? booking.getPaymentMethod() : "payment method") + "."
                : "Your partial refund of LKR " + String.format("%,.2f", refund) + " (50% of LKR " 
                + String.format("%,.2f", advance) + " advance) for '" + booking.getListing().getTitle() 
                + "' has been successfully processed to your " + (booking.getPaymentMethod() != null ? booking.getPaymentMethod() : "payment method") + ".";

        notificationRepository.save(new Notification(
                booking.getBuyer(),
                refundTitle,
                refundMsg,
                saved.getId(),
                booking.getListing().getId()
        ));

        return BookingMapper.toResponse(saved);
    }

    @Override
    public List<BookingResponse> getDisputedBookings() {
        return bookingRepository.findByIsDisputedTrueOrderByIdDesc().stream()
                .map(BookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponse raiseDispute(Long bookingId, RaiseDisputeRequest request, User currentUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        Listing listing = booking.getListing();
        Buyer buyer = booking.getBuyer();
        User seller = listing != null ? listing.getSeller() : null;
        User agent = listing != null ? listing.getAgent() : null;

        boolean isBuyer = buyer != null && buyer.getId().equals(currentUser.getId());
        boolean isSeller = seller != null && seller.getId().equals(currentUser.getId());
        boolean isAgent = agent != null && agent.getId().equals(currentUser.getId());
        boolean isStaff = currentUser.getRole() == User.Role.BOOKING_MANAGER || currentUser.getRole() == User.Role.ADMIN;

        if (!isBuyer && !isSeller && !isAgent && !isStaff) {
            throw new AccessDeniedException("You are not authorized to raise a dispute on this booking.");
        }

        if (Boolean.TRUE.equals(booking.getIsDisputed()) && "OPEN".equalsIgnoreCase(booking.getDisputeStatus())) {
            throw new IllegalArgumentException("A dispute is already active and currently under review by the Booking Manager.");
        }

        String raisedByRole = isBuyer ? "BUYER" : (isSeller ? "SELLER" : (isAgent ? "AGENT" : currentUser.getRole().name()));
        String complainantName = currentUser.getFirstName() + " " + currentUser.getLastName();

        booking.setIsDisputed(true);
        booking.setDisputeStatus("OPEN");
        booking.setDisputeRaisedBy(raisedByRole);
        booking.setDisputeReason(request.getReason() != null ? request.getReason().trim() : "GENERAL_DISPUTE");
        booking.setDisputeDetails(request.getDetails() != null ? request.getDetails().trim() : "");
        booking.setDisputeDate(LocalDate.now());

        Booking saved = bookingRepository.save(booking);

        // 1. Notify Booking Managers for urgent review
        List<User> managers = userRepository.findByRole(User.Role.BOOKING_MANAGER);
        for (User manager : managers) {
            notificationRepository.save(new Notification(
                    manager,
                    "⚠️ New Dispute Flagged: Booking #" + saved.getId(),
                    "Dispute raised by " + raisedByRole + " (" + complainantName + ") for property '" 
                            + (listing != null ? listing.getTitle() : "Listing") + "'. Reason: " + booking.getDisputeReason() 
                            + ". Please review the operations dispute queue to record a documented outcome.",
                    saved.getId(),
                    listing != null ? listing.getId() : null
            ));
        }

        // 2. Notify Opposing Party
        if (isBuyer) {
            User owner = seller != null ? seller : agent;
            if (owner != null) {
                notificationRepository.save(new Notification(
                        owner,
                        "Dispute Raised on Viewing #" + saved.getId(),
                        "The buyer (" + complainantName + ") has flagged a dispute regarding viewing for '" 
                                + (listing != null ? listing.getTitle() : "Listing") + "'. Reason: " + booking.getDisputeReason() 
                                + ". The Booking Manager has been assigned to mediate and resolve the issue.",
                        saved.getId(),
                        listing != null ? listing.getId() : null
                ));
            }
        } else {
            if (buyer != null) {
                notificationRepository.save(new Notification(
                        buyer,
                        "Dispute Raised on Booking #" + saved.getId(),
                        "The listing owner/agent (" + complainantName + ") has flagged a dispute for '" 
                                + (listing != null ? listing.getTitle() : "Listing") + "'. Reason: " + booking.getDisputeReason() 
                                + ". The Booking Manager will review all details and contact both parties.",
                        saved.getId(),
                        listing != null ? listing.getId() : null
                ));
            }
        }

        // 3. Notify Admins
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        for (User admin : admins) {
            notificationRepository.save(new Notification(
                    admin,
                    "⚠️ New Dispute Flagged: Booking #" + saved.getId(),
                    "Dispute raised by " + raisedByRole + " (" + complainantName + ") for property '" 
                            + (listing != null ? listing.getTitle() : "Listing") + "'. Reason: " + booking.getDisputeReason(),
                    saved.getId(),
                    listing != null ? listing.getId() : null
            ));
        }

        return BookingMapper.toResponse(saved);
    }

    @Override
    public BookingResponse resolveDispute(Long bookingId, ResolveDisputeRequest request, User manager) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        Listing listing = booking.getListing();
        Buyer buyer = booking.getBuyer();
        User owner = listing != null ? (listing.getSeller() != null ? listing.getSeller() : listing.getAgent()) : null;

        String decision = request.getDecision() != null ? request.getDecision().trim().toUpperCase() : "DISMISSED";
        String notes = request.getResolutionNotes() != null ? request.getResolutionNotes().trim() : "Resolution documented by Booking Manager.";
        String managerSignature = manager.getFirstName() + " " + manager.getLastName();

        booking.setIsDisputed(true);
        booking.setResolutionDecision(decision);
        booking.setResolutionNotes(notes);
        booking.setResolutionDate(LocalDate.now());
        booking.setResolvedByManagerName(managerSignature);

        double advance = booking.getAdvancePaymentAmount() != null ? booking.getAdvancePaymentAmount() : 5000.0;

        switch (decision) {
            case "FULL_REFUND":
                booking.setRefundAmount(advance);
                booking.setRefundStatus("REFUNDED");
                booking.setPaymentStatus("REFUNDED");
                booking.setStatus(Booking.Status.CANCELLED);
                booking.setDisputeStatus("RESOLVED");
                break;

            case "PARTIAL_REFUND":
                double partial = request.getCustomRefundAmount() != null && request.getCustomRefundAmount() > 0
                        ? request.getCustomRefundAmount() : advance * 0.50;
                booking.setRefundAmount(partial);
                booking.setRefundStatus("PARTIALLY_REFUNDED");
                booking.setPaymentStatus("PARTIALLY_REFUNDED");
                booking.setStatus(Booking.Status.CANCELLED);
                booking.setDisputeStatus("RESOLVED");
                break;

            case "NO_REFUND":
            case "FORFEIT":
                booking.setRefundAmount(0.0);
                booking.setRefundStatus("FORFEITED");
                booking.setPaymentStatus("FORFEITED");
                booking.setDisputeStatus("RESOLVED");
                break;

            case "RESCHEDULE":
                LocalDate origDate = booking.getViewingDate();
                String origTime = booking.getViewingTime();

                booking.setIsRescheduled(true);
                booking.setOriginalViewingDate(origDate);
                booking.setOriginalViewingTime(origTime);

                LocalDate newDate = request.getRescheduledDate() != null ? request.getRescheduledDate() : origDate;
                String newTime = (request.getRescheduledTime() != null && !request.getRescheduledTime().trim().isEmpty())
                        ? request.getRescheduledTime().trim() : origTime;

                booking.setRescheduledDate(newDate);
                booking.setRescheduledTime(newTime);
                booking.setViewingDate(newDate);
                booking.setViewingTime(newTime);
                booking.setStatus(Booking.Status.ACCEPTED);
                booking.setDisputeStatus("RESOLVED");

                if (!notes.contains("[Rescheduled:")) {
                    notes = notes + " [Rescheduled: " + newDate + (newTime != null ? " at " + newTime : "") 
                            + " | Prior: " + (origDate != null ? origDate : "N/A") + "]";
                    booking.setResolutionNotes(notes);
                }

                bookingRescheduleRepository.save(new lk.ac.sliit.web_based_apartment_sales_system.entity.BookingReschedule(
                        booking.getId(),
                        origDate,
                        origTime,
                        newDate,
                        newTime,
                        manager != null ? manager.getId() : null,
                        managerSignature,
                        notes
                ));
                break;

            case "ESCALATED_ADMIN":
                booking.setDisputeStatus("ESCALATED_TO_ADMIN");
                break;

            case "DISMISSED":
            default:
                booking.setDisputeStatus("RESOLVED");
                break;
        }

        Booking saved = bookingRepository.save(booking);

        // System dual-notification to both parties
        if ("ESCALATED_TO_ADMIN".equals(saved.getDisputeStatus())) {
            // Notify Admins
            List<User> admins = userRepository.findByRole(User.Role.ADMIN);
            for (User admin : admins) {
                notificationRepository.save(new Notification(
                        admin,
                        "🚨 Escalated Dispute: Booking #" + saved.getId(),
                        "Booking Manager " + managerSignature + " has escalated a dispute between buyer " 
                                + (buyer != null ? buyer.getFirstName() + " " + buyer.getLastName() : "Buyer") 
                                + " and owner (" + (owner != null ? owner.getFirstName() + " " + owner.getLastName() : "Owner") 
                                + ") for '" + (listing != null ? listing.getTitle() : "Listing") + "'. Brief: " + notes,
                        saved.getId(),
                        listing != null ? listing.getId() : null
                ));
            }
            if (buyer != null) {
                notificationRepository.save(new Notification(
                        buyer,
                        "Dispute Escalated to Platform Administration",
                        "Your booking dispute for '" + (listing != null ? listing.getTitle() : "Listing") 
                                + "' has been escalated by the Booking Manager to Senior Administration for final arbitration. Notes: " + notes,
                        saved.getId(),
                        listing != null ? listing.getId() : null
                ));
            }
            if (owner != null) {
                notificationRepository.save(new Notification(
                        owner,
                        "Dispute Escalated to Platform Administration",
                        "The booking dispute for '" + (listing != null ? listing.getTitle() : "Listing") 
                                + "' has been escalated by the Booking Manager to Senior Administration. Notes: " + notes,
                        saved.getId(),
                        listing != null ? listing.getId() : null
                ));
            }
        } else {
            // Notify Buyer
            if (buyer != null) {
                String buyerMsg = "Booking Manager " + managerSignature + " has resolved the dispute with decision: " 
                        + decision.replace('_', ' ') + ". Resolution details: " + notes;
                if ("FULL_REFUND".equals(decision)) {
                    buyerMsg += " (Full refund of LKR " + String.format("%,.2f", advance) + " credited to original payment method).";
                } else if ("PARTIAL_REFUND".equals(decision)) {
                    buyerMsg += " (Partial refund of LKR " + String.format("%,.2f", saved.getRefundAmount()) + " credited).";
                } else if ("RESCHEDULE".equals(decision)) {
                    buyerMsg += " (New viewing date: " + saved.getViewingDate() + (saved.getViewingTime() != null ? " at " + saved.getViewingTime() : "") + ").";
                }
                notificationRepository.save(new Notification(
                        buyer,
                        "Dispute Resolved: " + decision.replace('_', ' '),
                        buyerMsg,
                        saved.getId(),
                        listing != null ? listing.getId() : null
                ));
            }

            // Notify Listing Owner
            if (owner != null) {
                String ownerMsg = "Booking Manager " + managerSignature + " has recorded a formal resolution for dispute on '" 
                        + (listing != null ? listing.getTitle() : "Listing") + "'. Outcome: " + decision.replace('_', ' ') + ". Manager Notes: " + notes;
                notificationRepository.save(new Notification(
                        owner,
                        "Dispute Resolved: " + decision.replace('_', ' '),
                        ownerMsg,
                        saved.getId(),
                        listing != null ? listing.getId() : null
                ));
            }
        }

        return BookingMapper.toResponse(saved);
    }
}

