package lk.ac.sliit.web_based_apartment_sales_system.dto.request.verification;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestMoreDocumentsRequest {

    @NotBlank(message = "Notes explaining what additional documents are required must be provided")
    private String notes;

}
