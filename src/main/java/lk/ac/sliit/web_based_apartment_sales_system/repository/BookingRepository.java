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

    List<Booking> findByListing_SellerIdOrderByIdDesc(Long sellerId);

    List<Booking> findByListing_AgentIdOrderByIdDesc(Long agentId);

    List<Booking> findAllByOrderByIdDesc();

    boolean existsByBuyerIdAndListingIdAndStatusIn(Long buyerId, Long listingId, Collection<Booking.Status> statuses);

    boolean existsByListingIdAndViewingDateAndViewingTimeAndStatusIn(Long listingId, java.time.LocalDate viewingDate, String viewingTime, Collection<Booking.Status> statuses);

    boolean existsByListingIdAndViewingDateAndStatusIn(Long listingId, java.time.LocalDate viewingDate, Collection<Booking.Status> statuses);

    boolean existsByListing_SellerIdAndViewingDateAndViewingTimeAndStatusIn(Long sellerId, java.time.LocalDate viewingDate, String viewingTime, Collection<Booking.Status> statuses);

    boolean existsByListing_SellerIdAndViewingDateAndStatusIn(Long sellerId, java.time.LocalDate viewingDate, Collection<Booking.Status> statuses);

    boolean existsByListing_AgentIdAndViewingDateAndViewingTimeAndStatusIn(Long agentId, java.time.LocalDate viewingDate, String viewingTime, Collection<Booking.Status> statuses);

    boolean existsByListing_AgentIdAndViewingDateAndStatusIn(Long agentId, java.time.LocalDate viewingDate, Collection<Booking.Status> statuses);

    List<Booking> findByListingIdAndStatusIn(Long listingId, Collection<Booking.Status> statuses);

    List<Booking> findByIsDisputedTrueOrderByIdDesc();

    long countByIsDisputedTrue();
}
