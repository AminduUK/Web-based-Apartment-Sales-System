package lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BecomeAgentRequest {

    @NotBlank(message = "License number is required to become a real estate agent")
    private String licenseNumber;

    private String agencyName;
}
