package lk.ac.sliit.web_based_apartment_sales_system.mapper;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.booking.BookingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Booking;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Buyer;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Listing;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;

public final class BookingMapper {

    private BookingMapper() {
    }

    public static BookingResponse toResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());

        Listing listing = booking.getListing();
        response.setListingId(listing.getId());
        response.setListingTitle(listing.getTitle());
        response.setListingCity(listing.getAddress().getCity());

        Buyer buyer = booking.getBuyer();
        response.setBuyerId(buyer.getId());
        response.setBuyerName(buyer.getFirstName() + " " + buyer.getLastName());
        response.setBuyerEmail(buyer.getEmail());

        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        response.setOwnerType(owner.getRole().name());
        response.setOwnerName(owner.getFirstName() + " " + owner.getLastName());
        response.setOwnerEmail(owner.getEmail());

        response.setViewingDate(booking.getViewingDate());
        response.setRequestDate(booking.getRequestDate());
        response.setStatus(booking.getStatus().name());

        return response;
    }
}
