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

    ListingResponse markAsSold(Long listingId, User currentUser);

    String uploadImage(org.springframework.web.multipart.MultipartFile file, User currentUser);

    lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse uploadDocument(
            org.springframework.web.multipart.MultipartFile file, String documentType, User currentUser);

    lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse addDocumentToListing(
            Long listingId, org.springframework.web.multipart.MultipartFile file, String documentType, User currentUser);

    lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse attachDocumentToListing(
            Long listingId, lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing.DocumentRequest documentRequest, User currentUser);

    List<lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse> getListingDocuments(
            Long listingId, User currentUser);

    ListingResponse updateListingAmenities(Long listingId, List<Long> amenityIds, User currentUser);

    ListingResponse updateAvailabilitySchedule(Long listingId, String scheduleJson, User currentUser);

    int toggleFavorite(Long listingId, boolean isFavorite);
}

