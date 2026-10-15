package lk.ac.sliit.web_based_apartment_sales_system.dto.request.verification;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminOverrideListingRequest {

    @NotBlank(message = "Reason for administrator verification override is required")
    private String reason;

    // Optional override action: "UNPUBLISH" / "REJECT" (default) or "DOCUMENTS_REQUESTED" / "REQUEST_DOCUMENTS"
    private String action;
}
