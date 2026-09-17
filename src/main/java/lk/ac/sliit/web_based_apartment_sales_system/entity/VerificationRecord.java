package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "verification_records")
public class VerificationRecord {

    public enum Decision {
        APPROVED, REJECTED, MORE_DOCS_REQUESTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "officer_id", nullable = false)
    private VerificationOfficer verificationOfficer;

    @ManyToOne
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Enumerated(EnumType.STRING)
    private Decision decision;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "decision_date")
    private LocalDate decisionDate;

    public VerificationRecord() {
    }

    public VerificationRecord(VerificationOfficer verificationOfficer, Listing listing, Decision decision, String comment) {
        this.verificationOfficer = verificationOfficer;
        this.listing = listing;
        this.decision = decision;
        this.comment = comment;
        this.decisionDate = LocalDate.now();
    }

}
