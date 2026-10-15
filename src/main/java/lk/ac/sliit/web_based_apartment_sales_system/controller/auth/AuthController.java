package lk.ac.sliit.web_based_apartment_sales_system.controller.auth;

import jakarta.validation.Valid;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignInRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignUpRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.UpdateProfileRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.AuthResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.UserProfileResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lk.ac.sliit.web_based_apartment_sales_system.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        return ResponseEntity.ok(authService.signUp(request));
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signIn(@Valid @RequestBody SignInRequest request) {
        return ResponseEntity.ok(authService.signIn(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.getCurrentUserProfile(currentUser));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.updateProfile(request, currentUser));
    }

    @PostMapping("/change-password")
    public ResponseEntity<java.util.Map<String, Object>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.ChangePasswordRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.changePassword(request, currentUser));
    }

    @PostMapping("/become-agent")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuthResponse> becomeAgent(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.BecomeAgentRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.becomeAgent(request, currentUser));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<java.util.Map<String, String>> handleValidationExceptions(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getAllErrors().stream()
                .findFirst()
                .map(org.springframework.context.support.DefaultMessageSourceResolvable::getDefaultMessage)
                .orElse("Validation failed. Please verify your inputs.");
        return ResponseEntity.badRequest().body(java.util.Map.of("message", errorMessage, "error", errorMessage));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<java.util.Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(java.util.Map.of("message", ex.getMessage(), "error", ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<java.util.Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of(
                "message", "Invalid email or password. Please verify your credentials and try again.",
                "error", "Invalid email or password"
        ));
    }

    @ExceptionHandler({org.springframework.security.authentication.DisabledException.class, org.springframework.security.authentication.LockedException.class})
    public ResponseEntity<java.util.Map<String, String>> handleAccountSuspended(Exception ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of(
                "message", "Your account is currently suspended. Please contact an administrator.",
                "error", "Account suspended"
        ));
    }
}
