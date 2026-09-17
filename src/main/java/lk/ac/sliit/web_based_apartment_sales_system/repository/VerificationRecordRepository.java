package lk.ac.sliit.web_based_apartment_sales_system.repository;

import lk.ac.sliit.web_based_apartment_sales_system.entity.VerificationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationRecordRepository extends JpaRepository<VerificationRecord, Long> {

    List<VerificationRecord> findByListingId(Long listingId);

    Optional<VerificationRecord> findTopByListingIdOrderByDecisionDateDesc(Long listingId);

}