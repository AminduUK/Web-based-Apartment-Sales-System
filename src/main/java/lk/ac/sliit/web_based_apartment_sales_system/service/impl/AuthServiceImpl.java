package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignInRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignUpRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.AuthResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import lk.ac.sliit.web_based_apartment_sales_system.repository.UserRepository;
import lk.ac.sliit.web_based_apartment_sales_system.security.JwtService;
import lk.ac.sliit.web_based_apartment_sales_system.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse signUp(SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = buildUserForRole(request, encodedPassword);
        user.setPhone(request.getPhone());

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    @Override
    public AuthResponse signIn(SignInRequest request) {
        // Delegates to CustomUserDetailsService + PasswordEncoder under the hood;
        // throws BadCredentialsException on failure
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    private User buildUserForRole(SignUpRequest request, String encodedPassword) {
        return switch (request.getRole()) {
            case BUYER -> new Buyer(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case SELLER -> new Seller(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case AGENT -> new Agent(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword, request.getLicenseNumber());
            case VERIFICATION_OFFICER -> new VerificationOfficer(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case ADMIN -> new Admin(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
            case BOOKING_MANAGER -> new BookingManager(request.getFirstName(), request.getLastName(), request.getEmail(), encodedPassword);
        };
    }
}