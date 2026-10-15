package lk.ac.sliit.web_based_apartment_sales_system.dto.response.booking;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {

    private Long id;

    private Long listingId;
    private String listingTitle;
    private String listingCity;

    private Long buyerId;
    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;

    private String ownerType;
    private String ownerName;
    private String ownerEmail;

    private LocalDate viewingDate;
    private String viewingTime;
    private LocalDate requestDate;
    private String status;

    private Double advancePaymentAmount;
    private String paymentStatus;
    private String paymentMethod;
    private String transactionReference;
    private LocalDate paymentDate;
    private Double refundAmount;
    private String refundStatus;
    private Boolean cancelledAfterAccepted;

    private Boolean isDisputed;
    private String disputeStatus;
    private String disputeRaisedBy;
    private String disputeReason;
    private String disputeDetails;
    private LocalDate disputeDate;
    private String resolutionDecision;
    private String resolutionNotes;
    private LocalDate resolutionDate;
    private String resolvedByManagerName;

    private Boolean isRescheduled;
    private LocalDate rescheduledDate;
    private String rescheduledTime;
    private LocalDate originalViewingDate;
    private String originalViewingTime;
}

