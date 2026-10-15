package lk.ac.sliit.web_based_apartment_sales_system.dto.request.booking;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResolveDisputeRequest {

    @NotBlank(message = "Resolution decision is required")
    private String decision; // FULL_REFUND, PARTIAL_REFUND, NO_REFUND, RESCHEDULE, DISMISSED, ESCALATED_ADMIN

    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;

    private Double customRefundAmount;
    private LocalDate rescheduledDate;
    private String rescheduledTime;
}
