package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing.CreateListingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import java.util.List;

public interface ListingService {

    ListingResponse createListing(CreateListingRequest request, User currentUser);

    List<ListingResponse> getPublishedListings();

    ListingResponse getPublishedListingById(Long listingId);

    List<ListingResponse> getMyListings(User currentUser);

    ListingResponse updateListing(Long listingId, CreateListingRequest request, User currentUser);

    void deleteListing(Long listingId, User currentUser);

}
