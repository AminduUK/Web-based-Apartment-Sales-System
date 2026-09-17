package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing.CreateListingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.ListingMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.AmenityRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.VerificationRecordRepository;
import lk.ac.sliit.web_based_apartment_sales_system.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListingServiceImpl implements ListingService {

    private final ListingRepository listingRepository;
    private final AmenityRepository amenityRepository;
    private final VerificationRecordRepository verificationRecordRepository;

    @Override
    public ListingResponse createListing(CreateListingRequest request, User currentUser) {
        Listing listing = new Listing();
        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setAddress(new Address(request.getStreet(), request.getCity(), request.getPostalCode()));
        listing.setPropertyType(request.getPropertyType());
        listing.setFloorPlanUrl(request.getFloorPlanUrl());
        listing.setStatus(Listing.Status.PENDING);
        listing.setDatePosted(LocalDate.now());

        assignOwner(listing, currentUser);
        assignAmenities(listing, request.getAmenityIds());

        Listing saved = listingRepository.save(listing);
        return ListingMapper.toResponse(saved);
    }

    @Override
    public List<ListingResponse> getPublishedListings() {
        return listingRepository.findByStatus(Listing.Status.PUBLISHED).stream()
                .map(ListingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ListingResponse getPublishedListingById(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .filter(l -> l.getStatus() == Listing.Status.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        listing.setViewCount(listing.getViewCount() + 1);
        listingRepository.save(listing);

        return ListingMapper.toResponse(listing);
    }

    @Override
    public List<ListingResponse> getMyListings(User currentUser) {
        List<Listing> listings;

        if (currentUser instanceof Seller) {
            listings = listingRepository.findBySellerId(currentUser.getId());
        } else if (currentUser instanceof Agent) {
            listings = listingRepository.findByAgentId(currentUser.getId());
        } else {
            // Defense in depth - @PreAuthorize on the controller should already
            // have blocked anyone who isn't a Seller or Agent from reaching here.
            throw new AccessDeniedException("Only Sellers and Agents have a listings dashboard");
        }

        return listings.stream()
                .map(this::mapWithRejectionReasonIfRejected)
                .collect(Collectors.toList());
    }

    @Override
    public ListingResponse updateListing(Long listingId, CreateListingRequest request, User currentUser) {
        Listing listing = getOwnedPublishedListingOrThrow(listingId, currentUser);

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setAddress(new Address(request.getStreet(), request.getCity(), request.getPostalCode()));
        listing.setPropertyType(request.getPropertyType());
        listing.setFloorPlanUrl(request.getFloorPlanUrl());

        assignAmenities(listing, request.getAmenityIds());

        Listing saved = listingRepository.save(listing);
        return ListingMapper.toResponse(saved);
    }

    @Override
    public void deleteListing(Long listingId, User currentUser) {
        Listing listing = getOwnedPublishedListingOrThrow(listingId, currentUser);
        // Soft delete: preserves the VerificationRecord audit trail and avoids
        // a foreign-key violation, while still fully hiding it from search.
        listing.setStatus(Listing.Status.WITHDRAWN);
        listingRepository.save(listing);
    }

    private void assignOwner(Listing listing, User currentUser) {
        if (currentUser instanceof Seller seller) {
            listing.setSeller(seller);
        } else if (currentUser instanceof Agent agent) {
            listing.setAgent(agent);
        } else {
            // Defense in depth - @PreAuthorize on the controller should already
            // have blocked anyone who isn't a Seller or Agent from reaching here.
            throw new AccessDeniedException("Only Sellers and Agents can create listings");
        }
    }

    private void assignAmenities(Listing listing, List<Long> amenityIds) {
        if (amenityIds == null || amenityIds.isEmpty()) {
            // Full-replace semantics: an empty/absent list clears any existing amenities.
            listing.setAmenities(new HashSet<>());
            return;
        }

        Set<Amenity> amenities = new HashSet<>(amenityRepository.findAllById(amenityIds));
        if (amenities.size() != amenityIds.size()) {
            throw new IllegalArgumentException("One or more amenity IDs are invalid");
        }

        listing.setAmenities(amenities);
    }

    private ListingResponse mapWithRejectionReasonIfRejected(Listing listing) {
        ListingResponse response = ListingMapper.toResponse(listing);

        if (listing.getStatus() == Listing.Status.REJECTED) {
            verificationRecordRepository.findTopByListingIdOrderByDecisionDateDesc(listing.getId())
                    .ifPresent(record -> response.setRejectionReason(record.getComment()));
        }

        return response;
    }

    private Listing getOwnedPublishedListingOrThrow(Long listingId, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (!isOwner(listing, currentUser)) {
            throw new AccessDeniedException("You do not own this listing");
        }

        if (listing.getStatus() != Listing.Status.PUBLISHED) {
            throw new IllegalArgumentException(
                    "Listing can only be updated or removed once it has been approved (current status: "
                            + listing.getStatus() + ")");
        }

        return listing;
    }

    private boolean isOwner(Listing listing, User currentUser) {
        Long userId = currentUser.getId();
        return (listing.getSeller() != null && listing.getSeller().getId().equals(userId))
                || (listing.getAgent() != null && listing.getAgent().getId().equals(userId));
    }

}
