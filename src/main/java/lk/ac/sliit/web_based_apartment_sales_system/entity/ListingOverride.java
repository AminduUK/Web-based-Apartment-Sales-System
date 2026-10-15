package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "listing_overrides")
@AllArgsConstructor
@NoArgsConstructor
public class ListingOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "listing_title")
    private String listingTitle;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(name = "admin_email")
    private String adminEmail;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "override_date", nullable = false)
    private LocalDateTime overrideDate;

    public ListingOverride(Long listingId, String listingTitle, Long adminId, String adminEmail, String action, String reason) {
        this.listingId = listingId;
        this.listingTitle = listingTitle;
        this.adminId = adminId;
        this.adminEmail = adminEmail;
        this.action = action;
        this.reason = reason;
        this.overrideDate = LocalDateTime.now();
    }
}
