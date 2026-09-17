package lk.ac.sliit.web_based_apartment_sales_system.repository;

import lk.ac.sliit.web_based_apartment_sales_system.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByBuyerId(Long buyerId);

    // Navigates Booking -> listing -> seller/agent -> id
    List<Booking> findByListing_SellerId(Long sellerId);

    List<Booking> findByListing_AgentId(Long agentId);

    List<Booking> findAllByOrderByRequestDateDesc();

    boolean existsByBuyerIdAndListingIdAndStatusIn(Long buyerId, Long listingId, Collection<Booking.Status> statuses);
}
