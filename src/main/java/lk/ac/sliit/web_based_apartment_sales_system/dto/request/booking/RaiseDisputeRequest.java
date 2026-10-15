package lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RaiseDisputeRequest {

    @NotBlank(message = "Dispute reason is required")
    private String reason;

    @NotBlank(message = "Dispute details / explanation is required")
    private String details;
}
