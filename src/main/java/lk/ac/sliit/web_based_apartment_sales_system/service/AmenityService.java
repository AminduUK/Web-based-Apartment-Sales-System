package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.amenity.CreateAmenityRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.amenity.AmenityResponse;

import java.util.List;

public interface AmenityService {

    /**
     * Every amenity in the system - open to any authenticated user so
     * Sellers/Agents can pick from real options when creating a listing.
     */
    List<AmenityResponse> getAllAmenities();

    /**
     * Admin-only: add a new amenity to the system-wide list.
     */
    AmenityResponse createAmenity(CreateAmenityRequest request);

    /**
     * Admin-only: rename an existing amenity.
     */
    AmenityResponse updateAmenity(Long id, CreateAmenityRequest request);

    /**
     * Admin-only: remove an amenity, but only if no listing currently uses it.
     */
    void deleteAmenity(Long id);
}