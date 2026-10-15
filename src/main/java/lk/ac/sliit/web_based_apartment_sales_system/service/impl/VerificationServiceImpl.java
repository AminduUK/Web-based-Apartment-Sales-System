package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.ListingMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.*;
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
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final DocumentRepository documentRepository;
    private final lk.ac.sliit.web_based_apartment_sales_system.repository.ListingOverrideRepository listingOverrideRepository;

    @Override
    public List<ListingResponse> getPendingListings() {
        return listingRepository.findByStatusIn(List.of(Listing.Status.PENDING, Listing.Status.DOCUMENTS_REQUESTED)).stream()
                .map(this::mapListingForOfficer)
                .collect(Collectors.toList());
    }

    @Override
    public ListingResponse approveListing(Long listingId, User officer) {
        Listing listing = getUnderReviewListingOrThrow(listingId);

        listing.setStatus(Listing.Status.PUBLISHED);
        listingRepository.save(listing);

        VerificationOfficer verificationOfficer = resolveOfficer(officer);
        VerificationRecord record = new VerificationRecord(
                verificationOfficer, listing, VerificationRecord.Decision.APPROVED, null);
        verificationRecordRepository.save(record);

        // Notify listing owner
        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        if (owner != null && notificationRepository != null) {
            notificationRepository.save(new Notification(
                    owner,
                    "🎉 Listing Verified & Published!",
                    "Great news! Your listing '" + listing.getTitle() + "' has passed all legal document verifications and is now live on Nook & Key.",
                    null,
                    listing.getId()
            ));
        }

        return mapListingForOfficer(listing);
    }

    @Override
    public ListingResponse rejectListing(Long listingId, String comment, User officer) {
        Listing listing = getUnderReviewListingOrThrow(listingId);

        listing.setStatus(Listing.Status.REJECTED);
        listingRepository.save(listing);

        VerificationOfficer verificationOfficer = resolveOfficer(officer);
        VerificationRecord record = new VerificationRecord(
                verificationOfficer, listing, VerificationRecord.Decision.REJECTED, comment);
        verificationRecordRepository.save(record);

        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        if (owner != null && notificationRepository != null) {
            notificationRepository.save(new Notification(
                    owner,
                    "⚠️ Listing Verification Returned",
                    "Your listing '" + listing.getTitle() + "' was returned by verification: " + comment,
                    null,
                    listing.getId()
            ));
        }

        return mapListingForOfficer(listing);
    }

    @Override
    public ListingResponse requestMoreDocuments(Long listingId, String notes, User officer) {
        if (notes == null || notes.isBlank()) {
            throw new IllegalArgumentException("Notes explaining what additional documents are required must be provided");
        }

        Listing listing = getUnderReviewListingOrThrow(listingId);

        listing.setStatus(Listing.Status.DOCUMENTS_REQUESTED);
        listingRepository.save(listing);

        VerificationOfficer verificationOfficer = resolveOfficer(officer);
        VerificationRecord record = new VerificationRecord(
                verificationOfficer, listing, VerificationRecord.Decision.MORE_DOCS_REQUESTED, notes);
        verificationRecordRepository.save(record);

        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        if (owner != null && notificationRepository != null) {
            notificationRepository.save(new Notification(
                    owner,
                    "📋 Additional Documents Requested",
                    "Verification Officer requires more documents for '" + listing.getTitle() + "': " + notes + ". Please upload the documents from your dashboard.",
                    null,
                    listing.getId()
            ));
        }

        return mapListingForOfficer(listing);
    }

    @Override
    public List<DocumentResponse> getListingDocuments(Long listingId) {
        return documentRepository.findByListingId(listingId).stream()
                .map(doc -> DocumentResponse.builder()
                        .id(doc.getId())
                        .listingId(listingId)
                        .documentType(doc.getDocumentType())
                        .fileName(doc.getFileName())
                        .fileUrl(doc.getFileUrl())
                        .uploadDate(doc.getUploadDate())
                        .build())
                .collect(Collectors.toList());
    }

    private ListingResponse mapListingForOfficer(Listing listing) {
        ListingResponse response = ListingMapper.toResponse(listing);
        verificationRecordRepository.findTopByListingIdOrderByIdDesc(listing.getId())
                .ifPresent(record -> {
                    if (record.getDecision() == VerificationRecord.Decision.MORE_DOCS_REQUESTED) {
                        response.setDocumentRequestNote(record.getComment());
                    } else if (record.getDecision() == VerificationRecord.Decision.REJECTED) {
                        response.setRejectionReason(record.getComment());
                    }
                });
        return response;
    }

    private VerificationOfficer resolveOfficer(User officer) {
        if (officer == null) {
            throw new IllegalArgumentException("Authenticated user cannot be null");
        }
        User user = userRepository.findById(officer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + officer.getId()));

        if (user instanceof VerificationOfficer vo) {
            return vo;
        }

        // Fallback: If an admin performs verification, find any active verification officer or admin
        List<User> officers = userRepository.findByRole(User.Role.VERIFICATION_OFFICER);
        if (!officers.isEmpty() && officers.get(0) instanceof VerificationOfficer vo) {
            return vo;
        }

        throw new IllegalArgumentException("User " + officer.getUsername() + " is not an authorized verification officer");
    }

    private Listing getUnderReviewListingOrThrow(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (listing.getStatus() != Listing.Status.PENDING && listing.getStatus() != Listing.Status.DOCUMENTS_REQUESTED) {
            throw new IllegalArgumentException(
                    "Listing is not pending verification (current status: " + listing.getStatus() + ")");
        }

        return listing;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public ListingResponse adminOverrideListing(Long listingId, String reason, String action, User adminUser) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Reason for administrator verification override must be provided");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        Listing.Status targetStatus = Listing.Status.REJECTED;
        VerificationRecord.Decision recordDecision = VerificationRecord.Decision.REJECTED;

        if ("DOCUMENTS_REQUESTED".equalsIgnoreCase(action) || "REQUEST_DOCUMENTS".equalsIgnoreCase(action)) {
            targetStatus = Listing.Status.DOCUMENTS_REQUESTED;
            recordDecision = VerificationRecord.Decision.MORE_DOCS_REQUESTED;
        }

        listing.setStatus(targetStatus);
        listingRepository.save(listing);

        // Record in dedicated listing_overrides table
        Long adminId = adminUser != null ? adminUser.getId() : 1L;
        String adminEmail = adminUser != null ? adminUser.getEmail() : "admin@sliit.lk";
        String overrideAction = ("DOCUMENTS_REQUESTED".equalsIgnoreCase(action) || "REQUEST_DOCUMENTS".equalsIgnoreCase(action))
                ? "REQUEST_DOCUMENTS" : "REJECT";
        lk.ac.sliit.web_based_apartment_sales_system.entity.ListingOverride override = 
                new lk.ac.sliit.web_based_apartment_sales_system.entity.ListingOverride(
                        listing.getId(),
                        listing.getTitle(),
                        adminId,
                        adminEmail,
                        overrideAction,
                        reason
                );
        listingOverrideRepository.save(override);

        VerificationOfficer officer = resolveOfficer(adminUser);
        VerificationRecord record = new VerificationRecord(
                officer,
                listing,
                recordDecision,
                "[Admin Verification Override] " + reason
        );
        verificationRecordRepository.save(record);

        // Notify Listing Owner
        User owner = listing.getSeller() != null ? listing.getSeller() : listing.getAgent();
        if (owner != null && notificationRepository != null) {
            String title = targetStatus == Listing.Status.REJECTED
                    ? "🛑 Listing Unpublished (Admin Override)"
                    : "📋 Additional Documents Required (Admin Override)";
            String body = targetStatus == Listing.Status.REJECTED
                    ? "Administrator has revoked the verification and publication of '" + listing.getTitle() + "'. Reason: " + reason
                    : "Administrator has flagged your listing '" + listing.getTitle() + "' and requested additional documents. Reason: " + reason;

            notificationRepository.save(new Notification(
                    owner,
                    title,
                    body,
                    null,
                    listing.getId()
            ));
        }

        // Notify all Verification Officers
        if (notificationRepository != null) {
            List<User> officers = userRepository.findByRole(User.Role.VERIFICATION_OFFICER);
            for (User vo : officers) {
                notificationRepository.save(new Notification(
                        vo,
                        "⚠️ Admin Override on Listing #" + listing.getId(),
                        "Administrator (" + (adminUser != null ? adminUser.getEmail() : "Admin") + ") revoked verification for '" + listing.getTitle() + "'. Reason: " + reason,
                        null,
                        listing.getId()
                ));
            }
        }

        return mapListingForOfficer(listing);
    }
}
