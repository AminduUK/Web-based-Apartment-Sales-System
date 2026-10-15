package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "bookings")
public class Booking {

    public enum Status {
        PENDING, ACCEPTED, REJECTED, CANCELLED, COMPLETED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @ManyToOne
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "viewing_date")
    private LocalDate viewingDate;

    @Column(name = "viewing_time")
    private String viewingTime;

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @Column(name = "advance_payment_amount")
    private Double advancePaymentAmount = 5000.0;

    @Column(name = "payment_status")
    private String paymentStatus = "PAID";

    @Column(name = "payment_method")
    private String paymentMethod = "Card (Paddle Sandbox)";

    @Column(name = "transaction_reference")
    private String transactionReference;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "refund_amount")
    private Double refundAmount = 0.0;

    @Column(name = "refund_status")
    private String refundStatus = "NONE";

    @Column(name = "cancelled_after_accepted")
    private Boolean cancelledAfterAccepted = false;

    @Column(name = "is_disputed")
    private Boolean isDisputed = false;

    @Column(name = "dispute_status")
    private String disputeStatus = "NONE";

    @Column(name = "dispute_raised_by")
    private String disputeRaisedBy;

    @Column(name = "dispute_reason")
    private String disputeReason;

    @Column(name = "dispute_details", length = 1000)
    private String disputeDetails;

    @Column(name = "dispute_date")
    private LocalDate disputeDate;

    @Column(name = "resolution_decision")
    private String resolutionDecision;

    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;

    @Column(name = "resolution_date")
    private LocalDate resolutionDate;

    @Column(name = "resolved_by_manager_name")
    private String resolvedByManagerName;

    @Column(name = "is_rescheduled")
    private Boolean isRescheduled = false;

    @Column(name = "rescheduled_date")
    private LocalDate rescheduledDate;

    @Column(name = "rescheduled_time")
    private String rescheduledTime;

    @Column(name = "original_viewing_date")
    private LocalDate originalViewingDate;

    @Column(name = "original_viewing_time")
    private String originalViewingTime;

    public Booking() {
    }

    public Booking(Buyer buyer, Listing listing, LocalDate viewingDate) {
        this(buyer, listing, viewingDate, null);
    }

    public Booking(Buyer buyer, Listing listing, LocalDate viewingDate, String viewingTime) {
        this.buyer = buyer;
        this.listing = listing;
        this.viewingDate = viewingDate;
        this.viewingTime = viewingTime;
        this.requestDate = LocalDate.now();
        this.status = Status.PENDING;
        this.advancePaymentAmount = 5000.0;
        this.paymentStatus = "PAID";
        this.paymentMethod = "Card (Paddle Sandbox)";
        this.paymentDate = LocalDate.now();
        this.refundAmount = 0.0;
        this.refundStatus = "NONE";
        this.cancelledAfterAccepted = false;
        this.isDisputed = false;
        this.disputeStatus = "NONE";
    }

}
