package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin.AdminStatsResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin.UserSummaryResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;

import java.util.List;

public interface AdminService {

    /**
     * All registered users, optionally filtered by role and/or status.
     * Pass null for either filter to skip it.
     */
    List<UserSummaryResponse> getAllUsers(User.Role roleFilter, User.Status statusFilter);

    /**
     * Suspends or reactivates a user. An Admin cannot change their own status.
     */
    UserSummaryResponse updateUserStatus(Long userId, User.Status newStatus, User currentAdmin);

    /**
     * Platform-wide counts: users by role, listings by status, bookings by status.
     */
    AdminStatsResponse getStats();
}