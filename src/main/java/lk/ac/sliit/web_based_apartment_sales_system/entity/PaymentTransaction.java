package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payment_transactions")
@AllArgsConstructor
@NoArgsConstructor
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_reference", nullable = false, unique = true)
    private String transactionReference;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType; // "VIEWING_ADVANCE", "SUBSCRIPTION_PRO", "SUBSCRIPTION_ELITE", "SELLER_SINGLE_PASS", "AGENT_EXTRA_SLOT"

    @Column(name = "category", nullable = false)
    private String category; // "VIEWING_DEPOSIT", "AGENT_SUBSCRIPTION", "PAY_PER_LISTING"

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "user_role")
    private String userRole;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus; // "PAID", "COMPLETED", "REFUNDED"

    @Column(name = "item_details", length = 500)
    private String itemDetails;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    public PaymentTransaction(String transactionReference, String transactionType, String category,
                              Long userId, String userName, String userEmail, String userRole,
                              Double amount, String paymentMethod, String paymentStatus,
                              String itemDetails, LocalDateTime transactionDate) {
        this.transactionReference = transactionReference;
        this.transactionType = transactionType;
        this.category = category;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.userRole = userRole;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.itemDetails = itemDetails;
        this.transactionDate = (transactionDate != null) ? transactionDate : LocalDateTime.now();
    }
}
