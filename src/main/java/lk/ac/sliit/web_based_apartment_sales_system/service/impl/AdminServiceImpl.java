package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin.AdminStatsResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin.UserSummaryResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Booking;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Listing;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.mapper.UserMapper;
import lk.ac.sliit.web_based_apartment_sales_system.repository.BookingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.repository.UserRepository;
import lk.ac.sliit.web_based_apartment_sales_system.service.AdminService;
import lombok.RequiredArgsConstructor;
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

        if (user.getId().equals(currentAdmin.getId())) {
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
