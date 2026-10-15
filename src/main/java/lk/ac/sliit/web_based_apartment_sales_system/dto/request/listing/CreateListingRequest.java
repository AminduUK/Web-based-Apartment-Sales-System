package lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateListingRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0. Zero and negative values are not allowed.")
    private BigDecimal price;

    @NotBlank
    private String street;

    @NotBlank
    private String city;

    @NotBlank
    private String postalCode;

    @NotBlank
    private String propertyType;

    // Optional - can be added/changed later via edit
    private String floorPlanUrl;

    // Optional - Apartment photo URL (e.g. Unsplash URL or uploaded image URL)
    private String imageUrl;

    // Optional - IDs of existing Amenity records
    private List<Long> amenityIds;

    // Legal documents submitted with listing (Title Deed, COC, etc.)
    private List<DocumentRequest> documents;

}