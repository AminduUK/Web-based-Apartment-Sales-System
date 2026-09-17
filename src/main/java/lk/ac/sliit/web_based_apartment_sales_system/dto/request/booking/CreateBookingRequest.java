package lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateBookingRequest {

    @NotNull
    private Long listingId;

    @NotNull
    @FutureOrPresent(message = "Viewing date must be today or in the future")
    private LocalDate viewingDate;
}
