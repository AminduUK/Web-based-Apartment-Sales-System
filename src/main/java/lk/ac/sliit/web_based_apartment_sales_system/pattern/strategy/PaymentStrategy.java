package lk.ac.sliit.web_based_apartment_sales_system.pattern.strategy;

/**
 * Strategy Design Pattern - Common interface for all payment algorithm strategies.
 * Defines the contract that concrete strategies (Card, Bank Transfer, etc.) must fulfill.
 */
public interface PaymentStrategy {

    /**
     * Executes the payment processing algorithm for this strategy.
     *
     * @param amount The monetary amount to charge or verify
     * @param transactionReference Client-supplied or generated transaction reference
     * @param customerEmail Email of the customer making the payment
     * @return PaymentResult containing status, authorization code, and receipt metadata
     */
    PaymentResult processPayment(Double amount, String transactionReference, String customerEmail);

    /**
     * Returns true if this strategy can handle the given payment method string.
     *
     * @param paymentMethod The requested payment method (e.g. "Card", "Paddle", "Cash", "Bank Transfer")
     * @return boolean
     */
    boolean supports(String paymentMethod);

    /**
     * Unique identifier for this payment strategy.
     */
    String getStrategyName();

}
