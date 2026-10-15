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
        response.setBuyerPhone(buyer.getPhone());

        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        response.setOwnerType(owner.getRole().name());
        response.setOwnerName(owner.getFirstName() + " " + owner.getLastName());
        response.setOwnerEmail(owner.getEmail());

        response.setViewingDate(booking.getViewingDate());
        response.setViewingTime(booking.getViewingTime());
        response.setRequestDate(booking.getRequestDate());
        response.setStatus(booking.getStatus().name());

        response.setAdvancePaymentAmount(booking.getAdvancePaymentAmount());
        response.setPaymentStatus(booking.getPaymentStatus());
        response.setPaymentMethod(booking.getPaymentMethod());
        response.setTransactionReference(booking.getTransactionReference());
        response.setPaymentDate(booking.getPaymentDate());
        response.setRefundAmount(booking.getRefundAmount());
        response.setRefundStatus(booking.getRefundStatus());
        response.setCancelledAfterAccepted(Boolean.TRUE.equals(booking.getCancelledAfterAccepted()));

        response.setIsDisputed(Boolean.TRUE.equals(booking.getIsDisputed()));
        response.setDisputeStatus(booking.getDisputeStatus() != null ? booking.getDisputeStatus() : "NONE");
        response.setDisputeRaisedBy(booking.getDisputeRaisedBy());
        response.setDisputeReason(booking.getDisputeReason());
        response.setDisputeDetails(booking.getDisputeDetails());
        response.setDisputeDate(booking.getDisputeDate());
        response.setResolutionDecision(booking.getResolutionDecision());
        response.setResolutionNotes(booking.getResolutionNotes());
        response.setResolutionDate(booking.getResolutionDate());
        response.setResolvedByManagerName(booking.getResolvedByManagerName());

        response.setIsRescheduled(Boolean.TRUE.equals(booking.getIsRescheduled()));
        response.setRescheduledDate(booking.getRescheduledDate());
        response.setRescheduledTime(booking.getRescheduledTime());
        response.setOriginalViewingDate(booking.getOriginalViewingDate());
        response.setOriginalViewingTime(booking.getOriginalViewingTime());

        return response;
    }
}
