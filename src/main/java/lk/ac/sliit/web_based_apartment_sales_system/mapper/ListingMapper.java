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
        response.setViewCount(listing.getViewCount());
        response.setFavoriteCount(listing.getFavoriteCount());

        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        response.setOwnerType(owner.getRole().name());
        response.setOwnerName(owner.getFirstName() + " " + owner.getLastName());
        response.setOwnerEmail(owner.getEmail());

        response.setAmenities(listing.getAmenities().stream()
                .map(Amenity::getName)
                .collect(Collectors.toList()));

        return response;
    }
}
