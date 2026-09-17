package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.amenity.CreateAmenityRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.amenity.AmenityResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.AmenityMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.AmenityRepository;
import lk.ac.sliit.web_based_apartment_sales_system.service.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AmenityServiceImpl implements AmenityService {

    private final AmenityRepository amenityRepository;

    @Override
    public List<AmenityResponse> getAllAmenities() {
        return amenityRepository.findAll().stream()
                .map(AmenityMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AmenityResponse createAmenity(CreateAmenityRequest request) {
        if (amenityRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalArgumentException("An amenity with this name already exists");
        }

        Amenity amenity = new Amenity();
        amenity.setName(request.getName());

        return AmenityMapper.toResponse(amenityRepository.save(amenity));
    }

    @Override
    public AmenityResponse updateAmenity(Long id, CreateAmenityRequest request) {
        Amenity amenity = amenityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Amenity not found with id: " + id));

        amenity.setName(request.getName());

        return AmenityMapper.toResponse(amenityRepository.save(amenity));
    }

    @Override
    public void deleteAmenity(Long id) {
        Amenity amenity = amenityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Amenity not found with id: " + id));

        if (!amenity.getListings().isEmpty()) {
            throw new IllegalArgumentException(
                    "Cannot delete an amenity currently used by one or more listings");
        }

        amenityRepository.delete(amenity);
    }
}