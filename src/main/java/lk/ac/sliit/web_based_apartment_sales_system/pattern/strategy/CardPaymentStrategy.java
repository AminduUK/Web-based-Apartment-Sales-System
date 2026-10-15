package lk.ac.sliit.web_based_apartment_sales_system.pattern.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Concrete Strategy 1: Handles online Credit/Debit Card and Paddle Sandbox transactions.
 */
@Slf4j
@Component
public class CardPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult processPayment(Double amount, String transactionReference, String customerEmail) {
        log.info("[Strategy: CardPaymentStrategy] Processing card transaction for customer: {} - Amount: LKR {}", 
                customerEmail, amount);

        String ref = (transactionReference != null && !transactionReference.isBlank()) 
                ? transactionReference 
                : "TXN-CARD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        String authCode = "AUTH-" + (int)(100000 + Math.random() * 900000);

        return PaymentResult.builder()
                .success(true)
                .transactionReference(ref)
                .paymentStatus("PAID")
                .paymentMethod("Card (Paddle Sandbox)")
                .amount(amount)
                .authorizationCode(authCode)
                .gatewayMessage("Payment of LKR " + String.format("%,.2f", amount) + " successfully captured via Card Gateway.")
                .processedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public boolean supports(String paymentMethod) {
        if (paymentMethod == null) return false;
        String m = paymentMethod.trim().toLowerCase();
        return m.contains("card") || m.contains("paddle") || m.contains("visa") || m.contains("mastercard");
    }

    @Override
    public String getStrategyName() {
        return "CARD_PADDLE_STRATEGY";
    }

}
