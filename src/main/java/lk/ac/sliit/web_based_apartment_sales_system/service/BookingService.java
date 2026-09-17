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

    List<BookingResponse> getAllBookings();

    BookingResponse confirmViewingCompleted(Long bookingId, BookingManager manager);
}