package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignInRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignUpRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.AuthResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.UserProfileResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.UpdateProfileRequest;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import lk.ac.sliit.web_based_apartment_sales_system.repository.UserRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.security.JwtService;
import lk.ac.sliit.web_based_apartment_sales_system.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final lk.ac.sliit.web_based_apartment_sales_system.repository.NotificationRepository notificationRepository;
    private final lk.ac.sliit.web_based_apartment_sales_system.service.EmailService emailService;
    private final jakarta.persistence.EntityManager entityManager;
    private final lk.ac.sliit.web_based_apartment_sales_system.pattern.factory.UserFactory userFactory;
    private final lk.ac.sliit.web_based_apartment_sales_system.service.SystemSettingService systemSettingService;

    @Override
    public AuthResponse signUp(SignUpRequest request) {
        if (request.getRole() == User.Role.ADMIN
                || request.getRole() == User.Role.VERIFICATION_OFFICER
                || request.getRole() == User.Role.BOOKING_MANAGER) {
            throw new IllegalArgumentException(
                    "Public registration is only available for Buyers, Sellers, and Agents. Staff accounts must be created by an Administrator.");
        }

        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered: " + normalizedEmail);
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword().trim());
        request.setEmail(normalizedEmail);
        User user = userFactory.createUser(request, encodedPassword);
        user.setEmail(normalizedEmail);
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setSubscriptionPlan(User.SubscriptionPlan.FREE);
        user.setVerified(false);

        userRepository.save(user);

        // Notify Admins about new user registration
        if (notificationRepository != null) {
            List<User> admins = userRepository.findByRole(User.Role.ADMIN);
            for (User admin : admins) {
                notificationRepository.save(new lk.ac.sliit.web_based_apartment_sales_system.entity.Notification(
                        admin,
                        "👤 New User Registration",
                        user.getFirstName() + " " + user.getLastName() + " registered as a " + user.getRole().name() + " (" + user.getEmail() + ").",
                        null,
                        null
                ));
            }
        }

        String token = jwtService.generateToken(user);
        String licenseNumber = (user instanceof Agent agent) ? agent.getLicenseNumber() : null;

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .licenseNumber(licenseNumber)
                .build();
    }

    @Override
    public AuthResponse signIn(SignInRequest request) {
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String normalizedPassword = request.getPassword() != null ? request.getPassword().trim() : "";

        // Delegates to CustomUserDetailsService + PasswordEncoder under the hood;
        // throws BadCredentialsException on failure
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, normalizedPassword));

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + normalizedEmail));

        String token = jwtService.generateToken(user);
        String licenseNumber = (user instanceof Agent agent) ? agent.getLicenseNumber() : null;

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .licenseNumber(licenseNumber)
                .build();
    }

    @Override
    public UserProfileResponse getCurrentUserProfile(User currentUser) {
        User user = userRepository.findById(currentUser.getId()).orElse(currentUser);
        return buildProfileResponse(user);
    }

    @Override
    public UserProfileResponse updateProfile(UpdateProfileRequest request, User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (user instanceof Agent agent && request.getLicenseNumber() != null
                && !request.getLicenseNumber().isBlank()) {
            agent.setLicenseNumber(request.getLicenseNumber().trim());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            emailService.sendPasswordChangeEmail(user.getEmail(), user.getFirstName());
            String formattedDate = java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"));
            notificationRepository.save(new lk.ac.sliit.web_based_apartment_sales_system.entity.Notification(
                    user,
                    "🔐 Password Changed Successfully",
                    "Your account password was updated on " + formattedDate
                            + ". A confirmation email has been dispatched to " + user.getEmail() + ".",
                    null,
                    null));
        }

        userRepository.save(user);
        return buildProfileResponse(user);
    }

    @Override
    public java.util.Map<String, Object> changePassword(
            lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.ChangePasswordRequest request,
            User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getCurrentPassword() != null && !request.getCurrentPassword().isBlank()) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Current password is incorrect. Please check and try again.");
            }
        }

        if (request.getConfirmPassword() != null && !request.getConfirmPassword().isBlank()) {
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new IllegalArgumentException("New password and confirmation password do not match.");
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 1. Dispatch Email notification
        emailService.sendPasswordChangeEmail(user.getEmail(), user.getFirstName());

        // 2. Create In-App Notification
        String formattedDate = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"));
        notificationRepository.save(new lk.ac.sliit.web_based_apartment_sales_system.entity.Notification(
                user,
                "🔐 Password Changed Successfully",
                "Your account password was updated on " + formattedDate + ". A security confirmation email was sent to "
                        + user.getEmail()
                        + ". If you did not perform this change, please contact security immediately.",
                null,
                null));

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message",
                "Password successfully updated! A confirmation email and in-app security notification have been dispatched.");
        response.put("recipientEmail", user.getEmail());
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return response;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public AuthResponse becomeAgent(
            lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.BecomeAgentRequest request,
            User currentUser) {
        if (currentUser.getRole() != User.Role.SELLER) {
            throw new IllegalArgumentException("Only registered sellers can upgrade to a Real Estate Agent account.");
        }

        if (request.getLicenseNumber() == null || request.getLicenseNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("A valid real estate license number is required.");
        }

        Long userId = currentUser.getId();
        String license = request.getLicenseNumber().trim();

        // 1. Insert into agents table first to maintain integrity
        entityManager
                .createNativeQuery("INSERT INTO agents (id, license_number) VALUES (:userId, :license)")
                .setParameter("userId", userId)
                .setParameter("license", license)
                .executeUpdate();

        // 2. Migrate existing listings owned by the seller to the agent
        entityManager
                .createNativeQuery("UPDATE listings SET agent_id = :userId, seller_id = NULL WHERE seller_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 3. Remove seller record
        entityManager.createNativeQuery("DELETE FROM sellers WHERE id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 4. Update users record: role = 'AGENT', user_type = 'Agent'
        entityManager.createNativeQuery("UPDATE users SET role = 'AGENT', user_type = 'Agent' WHERE id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        User upgradedUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found after upgrade"));

        // Save celebration notification
        notificationRepository.save(new lk.ac.sliit.web_based_apartment_sales_system.entity.Notification(
                upgradedUser,
                "🎉 Upgraded to Real Estate Agent",
                "Congratulations " + upgradedUser.getFirstName()
                        + "! Your account has been upgraded to a Real Estate Agent (License: "
                        + license + "). You can now create and manage multiple apartment listings simultaneously.",
                null,
                null));

        String token = jwtService.generateToken(upgradedUser);

        return AuthResponse.builder()
                .token(token)
                .email(upgradedUser.getEmail())
                .role(upgradedUser.getRole().name())
                .firstName(upgradedUser.getFirstName())
                .lastName(upgradedUser.getLastName())
                .phone(upgradedUser.getPhone())
                .licenseNumber(license)
                .build();
    }

    private UserProfileResponse buildProfileResponse(User user) {
        long activeCount = 0;
        if (user instanceof Seller) {
            activeCount = listingRepository.countBySellerIdAndStatusNotIn(user.getId(),
                    java.util.List.of(Listing.Status.WITHDRAWN, Listing.Status.SOLD));
        } else if (user instanceof Agent) {
            activeCount = listingRepository.countByAgentIdAndStatusNotIn(user.getId(),
                    java.util.List.of(Listing.Status.WITHDRAWN, Listing.Status.SOLD));
        }

        String licenseNumber = (user instanceof Agent agent) ? agent.getLicenseNumber() : null;

        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .registrationDate(user.getRegistrationDate())
                .licenseNumber(licenseNumber)
                .rating(null)
                .subscriptionPlan(user.getRole() == User.Role.AGENT
                        ? (user.getSubscriptionPlan() != null ? user.getSubscriptionPlan().name() : "FREE")
                        : null)
                .billingCycle(user.getRole() == User.Role.AGENT
                        ? (user.getBillingCycle() != null ? user.getBillingCycle().name() : "MONTHLY")
                        : null)
                .listingLimit(user.getListingLimit(systemSettingService))
                .extraListingSlots(user.getExtraListingSlots())
                .activeListingsCount(activeCount)
                .verified(user.getVerified() != null ? user.getVerified() : false)
                .build();
    }

    private User buildUserForRole(SignUpRequest request, String encodedPassword) {
        return switch (request.getRole()) {
            case BUYER -> new Buyer(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case SELLER ->
                new Seller(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case AGENT -> new Agent(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword,
                    request.getLicenseNumber());
            case VERIFICATION_OFFICER -> new VerificationOfficer(request.getFirstName(), request.getLastName(),
                    request.getEmail(), encodedPassword);
            case ADMIN -> new Admin(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case BOOKING_MANAGER ->
                new BookingManager(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
        };
    }
}