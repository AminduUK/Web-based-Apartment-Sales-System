package lk.ac.sliit.web_based_apartment_sales_system.pattern.strategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Strategy Pattern - Context Class.
 * Maintains a reference to one of the concrete Strategy objects and communicates
 * with it solely through the PaymentStrategy interface.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentContext {

    private final List<PaymentStrategy> paymentStrategies;
    private final CardPaymentStrategy fallbackStrategy;

    /**
     * Resolves the matching strategy based on the client's paymentMethod input
     * and delegates payment processing.
     *
     * @param amount The monetary amount
     * @param paymentMethod The requested method (e.g., "Card", "Bank Transfer")
     * @param transactionReference Client or generated reference
     * @param customerEmail Customer identifier
     * @return PaymentResult
     */
    public PaymentResult executePayment(Double amount, String paymentMethod, String transactionReference, String customerEmail) {
        PaymentStrategy selectedStrategy = paymentStrategies.stream()
                .filter(strategy -> strategy.supports(paymentMethod))
                .findFirst()
                .orElse(fallbackStrategy);

        log.info("[PaymentContext] Delegating payment execution to strategy: {}", selectedStrategy.getStrategyName());
        return selectedStrategy.processPayment(amount, transactionReference, customerEmail);
    }

}
