package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "booking_reschedules")
@AllArgsConstructor
@NoArgsConstructor
public class BookingReschedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "original_viewing_date")
    private LocalDate originalViewingDate;

    @Column(name = "original_viewing_time")
    private String originalViewingTime;

    @Column(name = "rescheduled_date", nullable = false)
    private LocalDate rescheduledDate;

    @Column(name = "rescheduled_time")
    private String rescheduledTime;

    @Column(name = "manager_id")
    private Long managerId;

    @Column(name = "manager_name")
    private String managerName;

    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public BookingReschedule(Long bookingId, LocalDate originalViewingDate, String originalViewingTime,
                             LocalDate rescheduledDate, String rescheduledTime,
                             Long managerId, String managerName, String resolutionNotes) {
        this.bookingId = bookingId;
        this.originalViewingDate = originalViewingDate;
        this.originalViewingTime = originalViewingTime;
        this.rescheduledDate = rescheduledDate;
        this.rescheduledTime = rescheduledTime;
        this.managerId = managerId;
        this.managerName = managerName;
        this.resolutionNotes = resolutionNotes;
        this.createdAt = LocalDateTime.now();
    }
}
