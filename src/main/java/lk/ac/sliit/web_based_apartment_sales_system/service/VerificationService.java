package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import java.util.List;

public interface VerificationService {

    List<ListingResponse> getPendingListings();

    ListingResponse approveListing(Long listingId, User officer);

    ListingResponse rejectListing(Long listingId, String comment, User officer);

    ListingResponse requestMoreDocuments(Long listingId, String notes, User officer);

    List<lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse> getListingDocuments(Long listingId);

    ListingResponse adminOverrideListing(Long listingId, String reason, String action, User adminUser);

}