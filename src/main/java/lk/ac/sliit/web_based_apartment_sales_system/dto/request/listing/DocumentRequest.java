package lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequest {

    private String documentType;
    private String fileName;
    private String fileUrl; // Saved URL or Base64 data URI

}
