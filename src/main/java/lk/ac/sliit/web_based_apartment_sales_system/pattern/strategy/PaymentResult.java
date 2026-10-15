package lk.ac.sliit.web_based_apartment_sales_system.pattern.strategy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Strategy Pattern - Result DTO representing the outcome of an executed PaymentStrategy.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResult {

    private boolean success;
    private String transactionReference;
    private String paymentStatus; // e.g., "PAID", "AUTHORIZED", "PENDING_VERIFICATION"
    private String paymentMethod;
    private Double amount;
    private String authorizationCode;
    private String gatewayMessage;
    private LocalDateTime processedAt;

}
