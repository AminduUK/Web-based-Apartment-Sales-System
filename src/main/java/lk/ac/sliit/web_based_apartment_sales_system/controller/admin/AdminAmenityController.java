package lk.ac.sliit.web_based_apartment_sales_system.controller.admin;

import jakarta.validation.Valid;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.amenity.CreateAmenityRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.amenity.AmenityResponse;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.service.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/amenities")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAmenityController {

    private final AmenityService amenityService;

    @PostMapping
    public ResponseEntity<AmenityResponse> createAmenity(@Valid @RequestBody CreateAmenityRequest request) {
        AmenityResponse response = amenityService.createAmenity(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AmenityResponse> updateAmenity(
            @PathVariable Long id,
            @Valid @RequestBody CreateAmenityRequest request) {

        return ResponseEntity.ok(amenityService.updateAmenity(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAmenity(@PathVariable Long id) {
        amenityService.deleteAmenity(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}