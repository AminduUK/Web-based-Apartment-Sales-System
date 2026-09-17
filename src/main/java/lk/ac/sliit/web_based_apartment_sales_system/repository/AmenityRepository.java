package lk.ac.sliit.web_based_apartment_sales_system.repository;

import lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AmenityRepository extends JpaRepository<Amenity, Long> {
    boolean existsByNameIgnoreCase(String name);
}
