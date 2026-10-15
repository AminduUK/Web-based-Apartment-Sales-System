package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.CreateBookingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.booking.BookingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Buyer;
import lk.ac.sliit.web_based_apartment_sales_system.entity.BookingManager;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import java.util.List;

public interface BookingService {


    BookingResponse submitBookingRequest(CreateBookingRequest request, Buyer buyer);

    List<BookingResponse> getMyBookings(Buyer buyer);

    List<BookingResponse> getIncomingBookings(User currentUser);

    BookingResponse acceptBooking(Long bookingId, User currentUser);

    BookingResponse rejectBooking(Long bookingId, User currentUser);

    BookingResponse cancelBooking(Long bookingId, Buyer buyer);

    BookingResponse cancelBookingByOwner(Long bookingId, User currentUser);

    List<BookingResponse> getAllBookings();

    BookingResponse confirmViewingCompleted(Long bookingId, User manager);

    BookingResponse acceptBookingByManager(Long bookingId, User manager);

    BookingResponse rejectBookingByManager(Long bookingId, User manager);

    List<BookingResponse> getBookedSlotsForListing(Long listingId);

    BookingResponse processPartialRefund(Long bookingId, User manager);

    BookingResponse raiseDispute(Long bookingId, lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.RaiseDisputeRequest request, User currentUser);

    BookingResponse resolveDispute(Long bookingId, lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking.ResolveDisputeRequest request, User manager);

    List<BookingResponse> getDisputedBookings();
}