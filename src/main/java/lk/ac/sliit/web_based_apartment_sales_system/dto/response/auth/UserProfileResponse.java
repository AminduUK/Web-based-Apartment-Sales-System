package lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    private String status;
    private LocalDate registrationDate;
    private String licenseNumber;
    private Double rating;

    private String subscriptionPlan;
    private String billingCycle;
    private Integer listingLimit;
    private Integer extraListingSlots;
    private Long activeListingsCount;
    private Boolean verified;
}
