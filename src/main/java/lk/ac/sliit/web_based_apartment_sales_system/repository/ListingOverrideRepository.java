package lk.ac.sliit.web_based_apartment_sales_system.repository;

import lk.ac.sliit.web_based_apartment_sales_system.entity.ListingOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingOverrideRepository extends JpaRepository<ListingOverride, Long> {

    List<ListingOverride> findByListingIdOrderByOverrideDateDesc(Long listingId);

    List<ListingOverride> findAllByOrderByOverrideDateDesc();

}
