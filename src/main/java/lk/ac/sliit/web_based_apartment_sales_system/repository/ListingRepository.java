package lk.ac.sliit.web_based_apartment_sales_system.repository;

import lk.ac.sliit.web_based_apartment_sales_system.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {

    List<Listing> findBySellerId(Long sellerId);

    List<Listing> findByAgentId(Long agentId);

    List<Listing> findByStatus(Listing.Status status);
}
