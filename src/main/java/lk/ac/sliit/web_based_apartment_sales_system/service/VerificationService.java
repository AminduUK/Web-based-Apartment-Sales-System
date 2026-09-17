package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.VerificationOfficer;
import java.util.List;

public interface VerificationService {

    List<ListingResponse> getPendingListings();

    ListingResponse approveListing(Long listingId, VerificationOfficer officer);

    ListingResponse rejectListing(Long listingId, String comment, VerificationOfficer officer);

}