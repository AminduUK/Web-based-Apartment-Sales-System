package lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ListingResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private String street;
    private String city;
    private String postalCode;
    private String propertyType;
    private String status;
    private LocalDate datePosted;
    private String floorPlanUrl;
    private int viewCount;
    private int favoriteCount;

    // Owner info (either the Seller or the Agent who created it)
    private String ownerType;
    private String ownerName;
    private String ownerEmail;

    private List<String> amenities;

    // Only populated in "my listings" when status = REJECTED
    private String rejectionReason;

}
