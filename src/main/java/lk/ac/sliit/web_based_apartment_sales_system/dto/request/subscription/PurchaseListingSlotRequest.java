package lk.ac.sliit.web_based_apartment_sales_system.dto.request.subscription;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseListingSlotRequest {

    @Min(value = 1, message = "At least 1 listing slot must be purchased")
    @Builder.Default
    private int slots = 1;

    private String paymentMethod; // e.g., "Card (Paddle)", "Cash / Bank Deposit"

    private BigDecimal amountPaid;

    private String transactionReference;
}
