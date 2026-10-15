package lk.ac.sliit.web_based_apartment_sales_system.mapper;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Listing;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;

import java.util.stream.Collectors;

public final class ListingMapper {

    private ListingMapper() {
    }

    public static ListingResponse toResponse(Listing listing) {
        ListingResponse response = new ListingResponse();
        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setDescription(listing.getDescription());
        response.setPrice(listing.getPrice());
        response.setStreet(listing.getAddress().getStreet());
        response.setCity(listing.getAddress().getCity());
        response.setPostalCode(listing.getAddress().getPostalCode());
        response.setPropertyType(listing.getPropertyType());
        response.setStatus(listing.getStatus().name());
        response.setDatePosted(listing.getDatePosted());
        response.setFloorPlanUrl(listing.getFloorPlanUrl());
        response.setImageUrl(listing.getImageUrl());
        response.setViewCount(listing.getViewCount());
        response.setFavoriteCount(listing.getFavoriteCount());
        response.setAvailabilitySchedule(listing.getAvailabilitySchedule());

        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        if (owner != null) {
            response.setOwnerId(owner.getId());
            response.setOwnerType(owner.getRole() != null ? owner.getRole().name() : "");
            response.setOwnerName(owner.getFirstName() + " " + owner.getLastName());
            response.setOwnerEmail(owner.getEmail());
            response.setOwnerPhone(owner.getPhone() != null && !owner.getPhone().isBlank() ? owner.getPhone() : "+94 77 123 4567");
            response.setOwnerVerified(Boolean.TRUE.equals(owner.getVerified()));
            response.setOwnerPlan(owner.getRole() == User.Role.AGENT ? (owner.getSubscriptionPlan() != null ? owner.getSubscriptionPlan().name() : "FREE") : null);

            if (listing.getAgent() != null) {
                response.setOwnerLicenseNumber(listing.getAgent().getLicenseNumber() != null && !listing.getAgent().getLicenseNumber().isBlank()
                        ? listing.getAgent().getLicenseNumber()
                        : "AGT-2026-" + String.format("%04d", listing.getAgent().getId()));
            }
        }

        response.setAmenities(listing.getAmenities().stream()
                .map(Amenity::getName)
                .collect(Collectors.toList()));

        if (listing.getDocuments() != null && !listing.getDocuments().isEmpty()) {
            response.setDocuments(listing.getDocuments().stream()
                    .map(doc -> lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse.builder()
                            .id(doc.getId())
                            .listingId(listing.getId())
                            .documentType(doc.getDocumentType())
                            .fileName(doc.getFileName() != null ? doc.getFileName() : "Document-" + doc.getId())
                            .fileUrl(doc.getFileUrl())
                            .uploadDate(doc.getUploadDate())
                            .build())
                    .collect(Collectors.toList()));
        } else {
            response.setDocuments(new java.util.ArrayList<>());
        }

        return response;
    }
}
