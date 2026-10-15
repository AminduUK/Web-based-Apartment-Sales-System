package lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private Long id;
    private Long listingId;
    private String documentType;
    private String fileName;
    private String fileUrl;
    private LocalDate uploadDate;

}
