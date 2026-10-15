package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.admin.CreateStaffRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin.AdminStatsResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin.UserSummaryResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.UserMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.BookingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.UserRepository;
import lk.ac.sliit.web_based_apartment_sales_system.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserSummaryResponse createStaffUser(CreateStaffRequest request) {
        if (request.getRole() != User.Role.VERIFICATION_OFFICER
                && request.getRole() != User.Role.BOOKING_MANAGER
                && request.getRole() != User.Role.ADMIN) {
            throw new IllegalArgumentException("Admins can only create Verification Officer, Booking Manager, or Admin accounts.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A user with this email already exists: " + request.getEmail());
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = switch (request.getRole()) {
            case VERIFICATION_OFFICER -> new VerificationOfficer(
                    request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case BOOKING_MANAGER -> new BookingManager(
                    request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case ADMIN -> new Admin(
                    request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            default -> throw new IllegalArgumentException("Unsupported role: " + request.getRole());
        };

        user.setPhone(request.getPhone());
        user.setStatus(User.Status.ACTIVE);
        User saved = userRepository.save(user);

        return UserMapper.toSummary(saved);
    }

    @Override
    public List<UserSummaryResponse> getAllUsers(User.Role roleFilter, User.Status statusFilter) {
        return userRepository.findAll().stream()
                .filter(u -> roleFilter == null || u.getRole() == roleFilter)
                .filter(u -> statusFilter == null || u.getStatus() == statusFilter)
                .map(UserMapper::toSummary)
                .collect(Collectors.toList());
    }

    @Override
    public UserSummaryResponse updateUserStatus(Long userId, User.Status newStatus, User currentAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == User.Role.ADMIN && newStatus == User.Status.SUSPENDED) {
            throw new IllegalArgumentException("Administrator accounts cannot be suspended");
        }

        if (currentAdmin != null && user.getId().equals(currentAdmin.getId())) {
            throw new IllegalArgumentException("You cannot change your own account status");
        }

        user.setStatus(newStatus);
        User saved = userRepository.save(user);
        return UserMapper.toSummary(saved);
    }

    @Override
    public AdminStatsResponse getStats() {
        List<User> users = userRepository.findAll();
        List<Listing> listings = listingRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();

        Map<String, Long> usersByRole = users.stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));

        Map<String, Long> listingsByStatus = listings.stream()
                .collect(Collectors.groupingBy(l -> l.getStatus().name(), Collectors.counting()));

        Map<String, Long> bookingsByStatus = bookings.stream()
                .collect(Collectors.groupingBy(b -> b.getStatus().name(), Collectors.counting()));

        return new AdminStatsResponse(
                users.size(), usersByRole,
                listings.size(), listingsByStatus,
                bookings.size(), bookingsByStatus
        );
    }
}
