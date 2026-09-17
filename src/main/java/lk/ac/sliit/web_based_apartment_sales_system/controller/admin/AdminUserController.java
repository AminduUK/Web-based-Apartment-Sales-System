package lk.ac.sliit.web_based_apartment_sales_system.controller.admin;

import jakarta.validation.Valid;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.admin.UpdateUserStatusRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin.UserSummaryResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Admin;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers(
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) User.Status status) {

        return ResponseEntity.ok(adminService.getAllUsers(role, status));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserSummaryResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal Admin currentAdmin) {

        return ResponseEntity.ok(adminService.updateUserStatus(id, request.getStatus(), currentAdmin));
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
