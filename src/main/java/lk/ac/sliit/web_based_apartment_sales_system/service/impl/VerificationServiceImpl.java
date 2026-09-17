package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Listing;
import lk.ac.sliit.web_based_apartment_sales_system.entity.VerificationOfficer;
import lk.ac.sliit.web_based_apartment_sales_system.entity.VerificationRecord;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.ListingMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.VerificationRecordRepository;
import lk.ac.sliit.web_based_apartment_sales_system.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VerificationServiceImpl implements VerificationService {

    private final ListingRepository listingRepository;
    private final VerificationRecordRepository verificationRecordRepository;

    @Override
    public List<ListingResponse> getPendingListings() {
        return listingRepository.findByStatus(Listing.Status.PENDING).stream()
                .map(ListingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ListingResponse approveListing(Long listingId, VerificationOfficer officer) {
        Listing listing = getPendingListingOrThrow(listingId);

        listing.setStatus(Listing.Status.PUBLISHED);
        listingRepository.save(listing);

        VerificationRecord record = new VerificationRecord(
                officer, listing, VerificationRecord.Decision.APPROVED, null);
        verificationRecordRepository.save(record);

        return ListingMapper.toResponse(listing);
    }

    @Override
    public ListingResponse rejectListing(Long listingId, String comment, VerificationOfficer officer) {
        Listing listing = getPendingListingOrThrow(listingId);

        listing.setStatus(Listing.Status.REJECTED);
        listingRepository.save(listing);

        VerificationRecord record = new VerificationRecord(
                officer, listing, VerificationRecord.Decision.REJECTED, comment);
        verificationRecordRepository.save(record);

        return ListingMapper.toResponse(listing);
    }

    private Listing getPendingListingOrThrow(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (listing.getStatus() != Listing.Status.PENDING) {
            throw new IllegalArgumentException(
                    "Listing is not pending verification (current status: " + listing.getStatus() + ")");
        }

        return listing;
    }
}
