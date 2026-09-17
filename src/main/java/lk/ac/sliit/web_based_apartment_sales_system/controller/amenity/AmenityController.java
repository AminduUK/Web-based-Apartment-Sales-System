package lk.ac.sliit.web_based_apartment_sales_system.controller.amenity;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.amenity.AmenityResponse;
import lk.ac.sliit.web_based_apartment_sales_system.service.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/amenities")
public class AmenityController {

    private final AmenityService amenityService;

    // No @PreAuthorize - any authenticated user can browse amenities
    // (e.g. Sellers/Agents picking from real options when creating a listing).
    @GetMapping
    public ResponseEntity<List<AmenityResponse>> getAllAmenities() {
        return ResponseEntity.ok(amenityService.getAllAmenities());
    }
}
