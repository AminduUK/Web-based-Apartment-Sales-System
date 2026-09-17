package lk.ac.sliit.web_based_apartment_sales_system.mapper;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.amenity.AmenityResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity;

public final class AmenityMapper {

    private AmenityMapper() {
    }

    public static AmenityResponse toResponse(Amenity amenity) {
        AmenityResponse response = new AmenityResponse();
        response.setId(amenity.getId());
        response.setName(amenity.getName());
        return response;
    }
}