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

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    public Booking() {
    }

    public Booking(Buyer buyer, Listing listing, LocalDate viewingDate) {
        this.buyer = buyer;
        this.listing = listing;
        this.viewingDate = viewingDate;
        this.requestDate = LocalDate.now();
        this.status = Status.PENDING;
    }

}
