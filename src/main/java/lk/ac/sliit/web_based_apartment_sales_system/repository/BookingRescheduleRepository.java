package lk.ac.sliit.web_based_apartment_sales_system.repository;

import lk.ac.sliit.web_based_apartment_sales_system.entity.BookingReschedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRescheduleRepository extends JpaRepository<BookingReschedule, Long> {
    List<BookingReschedule> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
