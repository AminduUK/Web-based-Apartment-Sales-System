package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing.CreateListingRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.ListingResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.listing.DocumentRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.listing.DocumentResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.ListingMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.*;
import lk.ac.sliit.web_based_apartment_sales_system.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListingServiceImpl implements ListingService {

    private final ListingRepository listingRepository;
    private final AmenityRepository amenityRepository;
    private final VerificationRecordRepository verificationRecordRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final lk.ac.sliit.web_based_apartment_sales_system.service.SystemSettingService systemSettingService;

    @Override
    public ListingResponse createListing(CreateListingRequest request, User currentUser) {
        if (request.getPrice() == null || request.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0. Zero (0) and negative values are strictly prohibited.");
        }

        // Check listing quota for Seller (sold listings remain counted in quota) and subscription quota for Agent
        if (currentUser instanceof Seller) {
            long activeCount = listingRepository.countBySellerIdAndStatusNotIn(
                    currentUser.getId(), 
                    List.of(Listing.Status.WITHDRAWN)
            );
            int limit = currentUser.getListingLimit(systemSettingService);
            if (activeCount >= limit) {
                throw new IllegalArgumentException(
                    "Listing quota reached! You currently have " + activeCount + " listing(s) in your portfolio. " +
                    "Individual sellers have " + limit + " property slot(s). To post an additional apartment, you can purchase an On-Demand Extra Listing Slot (LKR 2,500) or upgrade to a Real Estate Agent."
                );
            }
        } else if (currentUser instanceof Agent) {
            long activeCount = listingRepository.countByAgentIdAndStatusNotIn(
                    currentUser.getId(), 
                    List.of(Listing.Status.WITHDRAWN, Listing.Status.SOLD)
            );
            int limit = currentUser.getListingLimit(systemSettingService);
            if (activeCount >= limit) {
                String planName = currentUser.getSubscriptionPlan() != null ? currentUser.getSubscriptionPlan().name() : "FREE";
                throw new IllegalArgumentException("Listing quota exceeded! Your current " + planName 
                        + " plan allows a maximum of " + limit + " active listings (currently using " + activeCount + "). " 
                        + "Please upgrade your subscription or purchase an On-Demand Extra Listing Slot (LKR 2,500) to post more properties.");
            }
        }

        Listing listing = new Listing();
        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setAddress(new Address(request.getStreet(), request.getCity(), request.getPostalCode()));
        listing.setPropertyType(request.getPropertyType());
        listing.setFloorPlanUrl(request.getFloorPlanUrl());
        listing.setImageUrl(request.getImageUrl());
        boolean legalVerificationRequired = systemSettingService != null
                ? Boolean.parseBoolean(systemSettingService.getSettingValue("LEGAL_VERIFICATION_REQUIRED", "true"))
                : true;
        listing.setStatus(legalVerificationRequired ? Listing.Status.PENDING : Listing.Status.PUBLISHED);
        listing.setDatePosted(LocalDate.now());

        assignOwner(listing, currentUser);
        assignAmenities(listing, request.getAmenityIds());

        Listing saved = listingRepository.save(listing);

        if (request.getDocuments() != null && !request.getDocuments().isEmpty()) {
            for (DocumentRequest docReq : request.getDocuments()) {
                if (docReq.getFileUrl() != null && !docReq.getFileUrl().isBlank()) {
                    String docType = (docReq.getDocumentType() != null && !docReq.getDocumentType().isBlank())
                            ? docReq.getDocumentType() : "TITLE_DEED";
                    String fileName = (docReq.getFileName() != null && !docReq.getFileName().isBlank())
                            ? docReq.getFileName() : "Apartment Legal Document";
                    Document doc = new Document(saved, docType, fileName, docReq.getFileUrl());
                    Document savedDoc = documentRepository.save(doc);
                    saved.getDocuments().add(savedDoc);
                }
            }
        }

        // Notify Admins about new listing awaiting verification
        if (notificationRepository != null && userRepository != null) {
            List<User> admins = userRepository.findByRole(User.Role.ADMIN);
            for (User admin : admins) {
                notificationRepository.save(new Notification(
                        admin,
                        "🏠 New Property Submitted for Verification",
                        "A new listing '" + saved.getTitle() + "' in " + (saved.getAddress() != null ? saved.getAddress().getCity() : "Sri Lanka") + " has been submitted for legal verification by " + currentUser.getFirstName() + " " + currentUser.getLastName() + ".",
                        null,
                        saved.getId()
                ));
            }
        }

        return ListingMapper.toResponse(saved);
    }

    @Override
    public List<ListingResponse> getPublishedListings() {
        return listingRepository.findByStatus(Listing.Status.PUBLISHED).stream()
                .map(ListingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ListingResponse getPublishedListingById(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .filter(l -> l.getStatus() == Listing.Status.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        listing.setViewCount(listing.getViewCount() + 1);
        listingRepository.save(listing);

        return ListingMapper.toResponse(listing);
    }

    @Override
    public List<ListingResponse> getMyListings(User currentUser) {
        List<Listing> listings;

        if (currentUser instanceof Seller) {
            listings = listingRepository.findBySellerId(currentUser.getId());
        } else if (currentUser instanceof Agent) {
            listings = listingRepository.findByAgentId(currentUser.getId());
        } else {
            // Defense in depth - @PreAuthorize on the controller should already
            // have blocked anyone who isn't a Seller or Agent from reaching here.
            throw new AccessDeniedException("Only Sellers and Agents have a listings dashboard");
        }

        return listings.stream()
                .map(this::mapWithRejectionReasonIfRejected)
                .collect(Collectors.toList());
    }

    @Override
    public ListingResponse updateListing(Long listingId, CreateListingRequest request, User currentUser) {
        if (request.getPrice() == null || request.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0. Zero (0) and negative values are strictly prohibited.");
        }

        Listing listing = getOwnedPublishedListingOrThrow(listingId, currentUser);

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setAddress(new Address(request.getStreet(), request.getCity(), request.getPostalCode()));
        listing.setPropertyType(request.getPropertyType());
        listing.setFloorPlanUrl(request.getFloorPlanUrl());
        listing.setImageUrl(request.getImageUrl());

        assignAmenities(listing, request.getAmenityIds());

        Listing saved = listingRepository.save(listing);
        return ListingMapper.toResponse(saved);
    }

    @Override
    public void deleteListing(Long listingId, User currentUser) {
        Listing listing = getOwnedPublishedListingOrThrow(listingId, currentUser);
        // Soft delete: preserves the VerificationRecord audit trail and avoids
        // a foreign-key violation, while still fully hiding it from search.
        listing.setStatus(Listing.Status.WITHDRAWN);
        listingRepository.save(listing);
    }

    @Override
    public ListingResponse markAsSold(Long listingId, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (!isOwner(listing, currentUser)) {
            throw new AccessDeniedException("You do not own this listing");
        }

        listing.setStatus(Listing.Status.SOLD);
        Listing saved = listingRepository.save(listing);

        if (notificationRepository != null) {
            notificationRepository.save(new Notification(
                    currentUser,
                    "🏠 Property Marked as Sold",
                    "Congratulations! '" + listing.getTitle() + "' has been marked as SOLD. " 
                            + (currentUser.getRole() == User.Role.SELLER ? "You can now list your next apartment!" : "Your listing count has been updated."),
                    null,
                    listing.getId()
            ));
        }

        return ListingMapper.toResponse(saved);
    }

    private void assignOwner(Listing listing, User currentUser) {
        if (currentUser instanceof Seller seller) {
            listing.setSeller(seller);
        } else if (currentUser instanceof Agent agent) {
            listing.setAgent(agent);
        } else {
            // Defense in depth - @PreAuthorize on the controller should already
            // have blocked anyone who isn't a Seller or Agent from reaching here.
            throw new AccessDeniedException("Only Sellers and Agents can create listings");
        }
    }

    private void assignAmenities(Listing listing, List<Long> amenityIds) {
        if (amenityIds == null || amenityIds.isEmpty()) {
            // Full-replace semantics: an empty/absent list clears any existing amenities.
            listing.setAmenities(new HashSet<>());
            return;
        }

        Set<Amenity> amenities = new HashSet<>(amenityRepository.findAllById(amenityIds));
        if (amenities.size() != amenityIds.size()) {
            throw new IllegalArgumentException("One or more amenity IDs are invalid");
        }

        listing.setAmenities(amenities);
    }

    private ListingResponse mapWithRejectionReasonIfRejected(Listing listing) {
        ListingResponse response = ListingMapper.toResponse(listing);

        verificationRecordRepository.findTopByListingIdOrderByIdDesc(listing.getId())
                .ifPresent(record -> {
                    if (listing.getStatus() == Listing.Status.REJECTED) {
                        response.setRejectionReason(record.getComment());
                    }
                    if (record.getDecision() == VerificationRecord.Decision.MORE_DOCS_REQUESTED
                            || listing.getStatus() == Listing.Status.DOCUMENTS_REQUESTED) {
                        response.setDocumentRequestNote(record.getComment());
                    }
                });

        return response;
    }

    @Override
    public DocumentResponse uploadDocument(MultipartFile file, String documentType, User currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentication required to upload documents");
        }
        String fileUrl = saveFileToDisk(file);
        String docType = (documentType != null && !documentType.isBlank()) ? documentType : "OTHER";
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";

        return DocumentResponse.builder()
                .documentType(docType)
                .fileName(originalName)
                .fileUrl(fileUrl)
                .uploadDate(LocalDate.now())
                .build();
    }

    @Override
    public DocumentResponse addDocumentToListing(Long listingId, MultipartFile file, String documentType, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (!isOwner(listing, currentUser) && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("You do not own this listing");
        }

        String fileUrl = saveFileToDisk(file);
        String docType = (documentType != null && !documentType.isBlank()) ? documentType : "TITLE_DEED";
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";

        Document document = new Document(listing, docType, originalName, fileUrl);
        Document savedDoc = documentRepository.save(document);
        listing.getDocuments().add(savedDoc);

        // If the listing had documents requested, re-trigger PENDING status for verification officer review
        if (listing.getStatus() == Listing.Status.DOCUMENTS_REQUESTED) {
            listing.setStatus(Listing.Status.PENDING);
            listingRepository.save(listing);

            // Notify verification officers
            List<User> officers = userRepository.findByRole(User.Role.VERIFICATION_OFFICER);
            for (User vo : officers) {
                notificationRepository.save(new Notification(
                        vo,
                        "📄 Additional Documents Uploaded",
                        "New legal documents have been uploaded for '" + listing.getTitle() + "'. Please review and verify the listing.",
                        null,
                        listing.getId()
                ));
            }

            notificationRepository.save(new Notification(
                    currentUser,
                    "📤 Documents Submitted for Verification",
                    "Your uploaded documents for '" + listing.getTitle() + "' were successfully received. Listing status is now PENDING verification.",
                    null,
                    listing.getId()
            ));
        }

        return DocumentResponse.builder()
                .id(savedDoc.getId())
                .listingId(listing.getId())
                .documentType(savedDoc.getDocumentType())
                .fileName(savedDoc.getFileName())
                .fileUrl(savedDoc.getFileUrl())
                .uploadDate(savedDoc.getUploadDate())
                .build();
    }

    @Override
    public DocumentResponse attachDocumentToListing(Long listingId, DocumentRequest documentRequest, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (!isOwner(listing, currentUser) && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("You do not own this listing");
        }

        String docType = (documentRequest.getDocumentType() != null && !documentRequest.getDocumentType().isBlank())
                ? documentRequest.getDocumentType() : "TITLE_DEED";
        String fileName = (documentRequest.getFileName() != null && !documentRequest.getFileName().isBlank())
                ? documentRequest.getFileName() : "Document";
        String fileUrl = documentRequest.getFileUrl();

        if (fileUrl == null || fileUrl.isBlank()) {
            throw new IllegalArgumentException("File URL or data is required");
        }

        Document document = new Document(listing, docType, fileName, fileUrl);
        Document savedDoc = documentRepository.save(document);
        listing.getDocuments().add(savedDoc);

        if (listing.getStatus() == Listing.Status.DOCUMENTS_REQUESTED) {
            listing.setStatus(Listing.Status.PENDING);
            listingRepository.save(listing);

            List<User> officers = userRepository.findByRole(User.Role.VERIFICATION_OFFICER);
            for (User vo : officers) {
                notificationRepository.save(new Notification(
                        vo,
                        "📄 Additional Documents Uploaded",
                        "New legal documents have been uploaded for '" + listing.getTitle() + "'. Please review and verify the listing.",
                        null,
                        listing.getId()
                ));
            }

            notificationRepository.save(new Notification(
                    currentUser,
                    "📤 Documents Submitted for Verification",
                    "Your uploaded documents for '" + listing.getTitle() + "' were successfully received. Listing status is now PENDING verification.",
                    null,
                    listing.getId()
            ));
        }

        return DocumentResponse.builder()
                .id(savedDoc.getId())
                .listingId(listing.getId())
                .documentType(savedDoc.getDocumentType())
                .fileName(savedDoc.getFileName())
                .fileUrl(savedDoc.getFileUrl())
                .uploadDate(savedDoc.getUploadDate())
                .build();
    }

    @Override
    public List<DocumentResponse> getListingDocuments(Long listingId, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (!isOwner(listing, currentUser)
                && currentUser.getRole() != User.Role.VERIFICATION_OFFICER
                && currentUser.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("You do not have permission to view documents for this listing");
        }

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

    @Override
    public String uploadImage(MultipartFile file, User currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentication required to upload apartment images");
        }
        return saveImageFileToDisk(file);
    }

    private String saveImageFileToDisk(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded image cannot be empty");
        }
        try {
            Path uploadDir = Paths.get("uploads", "images");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            String originalName = file.getOriginalFilename();
            String safeName = (originalName != null && !originalName.isBlank())
                    ? originalName.replaceAll("[^a-zA-Z0-9._-]", "_")
                    : "apartment_photo.jpg";
            String uniqueName = UUID.randomUUID().toString().substring(0, 8) + "_" + safeName;
            Path targetPath = uploadDir.resolve(uniqueName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/images/" + uniqueName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save uploaded image: " + e.getMessage(), e);
        }
    }

    private String saveFileToDisk(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }
        try {
            Path uploadDir = Paths.get("uploads", "documents");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            String originalName = file.getOriginalFilename();
            String safeName = (originalName != null && !originalName.isBlank())
                    ? originalName.replaceAll("[^a-zA-Z0-9._-]", "_")
                    : "document.pdf";
            String uniqueName = UUID.randomUUID().toString().substring(0, 8) + "_" + safeName;
            Path targetPath = uploadDir.resolve(uniqueName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/documents/" + uniqueName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save uploaded document: " + e.getMessage(), e);
        }
    }

    private Listing getOwnedPublishedListingOrThrow(Long listingId, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        if (!isOwner(listing, currentUser)) {
            throw new AccessDeniedException("You do not own this listing");
        }

        if (listing.getStatus() != Listing.Status.PUBLISHED) {
            throw new IllegalArgumentException(
                    "Listing can only be updated or removed once it has been approved (current status: "
                            + listing.getStatus() + ")");
        }

        return listing;
    }

    private boolean isOwner(Listing listing, User currentUser) {
        Long userId = currentUser.getId();
        return (listing.getSeller() != null && listing.getSeller().getId().equals(userId))
                || (listing.getAgent() != null && listing.getAgent().getId().equals(userId));
    }

    @Override
    @Transactional
    public ListingResponse updateListingAmenities(Long listingId, List<Long> amenityIds, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        boolean isAdmin = currentUser != null && currentUser.getRole() == User.Role.ADMIN;
        boolean isListingOwner = currentUser != null && isOwner(listing, currentUser);

        if (!isAdmin && !isListingOwner) {
            throw new AccessDeniedException("You do not have permission to update amenities for this listing");
        }

        assignAmenities(listing, amenityIds);
        Listing saved = listingRepository.save(listing);
        return ListingMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ListingResponse updateAvailabilitySchedule(Long listingId, String scheduleJson, User currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));

        boolean isAdmin = currentUser != null && currentUser.getRole() == User.Role.ADMIN;
        boolean isListingOwner = currentUser != null && isOwner(listing, currentUser);

        if (!isAdmin && !isListingOwner) {
            throw new AccessDeniedException("You do not have permission to configure viewing availability for this listing");
        }

        listing.setAvailabilitySchedule(scheduleJson);
        Listing saved = listingRepository.save(listing);
        return ListingMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public int toggleFavorite(Long listingId, boolean isFavorite) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));
        int current = listing.getFavoriteCount();
        int updated = isFavorite ? (current + 1) : Math.max(0, current - 1);
        listing.setFavoriteCount(updated);
        listingRepository.save(listing);
        return updated;
    }

}
