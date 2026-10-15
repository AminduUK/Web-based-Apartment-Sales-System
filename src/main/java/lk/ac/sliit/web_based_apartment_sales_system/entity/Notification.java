package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    private Long relatedBookingId;

    private Long relatedListingId;

    public Notification(User recipient, String title, String message, Long relatedBookingId, Long relatedListingId) {
        this.recipient = recipient;
        this.title = title;
        this.message = message;
        this.relatedBookingId = relatedBookingId;
        this.relatedListingId = relatedListingId;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }
}
