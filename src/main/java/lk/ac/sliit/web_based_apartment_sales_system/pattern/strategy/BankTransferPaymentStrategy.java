package lk.ac.sliit.web_based_apartment_sales_system.pattern.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Concrete Strategy 2: Handles Bank Wire Transfer, Direct Deposit, or Cash verification.
 */
@Slf4j
@Component
public class BankTransferPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult processPayment(Double amount, String transactionReference, String customerEmail) {
        log.info("[Strategy: BankTransferPaymentStrategy] Registering bank deposit for customer: {} - Amount: LKR {}", 
                customerEmail, amount);

        String ref = (transactionReference != null && !transactionReference.isBlank()) 
                ? transactionReference 
                : "DEP-BANK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        String slipCode = "SLIP-REF-" + (int)(100000 + Math.random() * 900000);

        return PaymentResult.builder()
                .success(true)
                .transactionReference(ref)
                .paymentStatus("PAID")
                .paymentMethod("Cash / Bank Transfer")
                .amount(amount)
                .authorizationCode(slipCode)
                .gatewayMessage("Deposit slip ref " + slipCode + " recorded for LKR " + String.format("%,.2f", amount) + ". Subject to bank clearance.")
                .processedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public boolean supports(String paymentMethod) {
        if (paymentMethod == null) return false;
        String m = paymentMethod.trim().toLowerCase();
        return m.contains("cash") || m.contains("bank") || m.contains("deposit") || m.contains("transfer");
    }

    @Override
    public String getStrategyName() {
        return "BANK_TRANSFER_STRATEGY";
    }

}
