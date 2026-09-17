package lk.ac.sliit.web_based_apartment_sales_system.dto.response.booking;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {

    private Long id;

    private Long listingId;
    private String listingTitle;
    private String listingCity;

    private Long buyerId;
    private String buyerName;
    private String buyerEmail;

    private String ownerType;
    private String ownerName;
    private String ownerEmail;

    private LocalDate viewingDate;
    private LocalDate requestDate;
    private String status;
}

