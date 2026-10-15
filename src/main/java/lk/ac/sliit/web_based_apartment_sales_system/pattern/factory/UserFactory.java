package lk.ac.sliit.web_based_apartment_sales_system.pattern.factory;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignUpRequest;
import lk.ac.sliit.web_based_apartment_sales_system.entity.*;
import org.springframework.stereotype.Component;

/**
 * Factory Method Pattern (Creational).
 * Encapsulates the instantiation logic for various User subclasses (Buyer, Seller, Agent, Admin, etc.)
 * based on the requested Role, keeping creation decoupled from core business logic.
 */
@Component
public class UserFactory {

    /**
     * Factory method to create a concrete User instance based on SignUpRequest role.
     *
     * @param request The signup request containing user attributes and desired role
     * @param encodedPassword BCrypt encoded password
     * @return Concrete User subclass instance
     */
    public User createUser(SignUpRequest request, String encodedPassword) {
        if (request.getRole() == null) {
            throw new IllegalArgumentException("User role must be specified.");
        }

        return switch (request.getRole()) {
            case BUYER -> new Buyer(
                    request.getFirstName(), 
                    request.getLastName(), 
                    request.getEmail(), 
                    encodedPassword
            );
            case SELLER -> new Seller(
                    request.getFirstName(), 
                    request.getLastName(), 
                    request.getEmail(), 
                    encodedPassword
            );
            case AGENT -> new Agent(
                    request.getFirstName(), 
                    request.getLastName(), 
                    request.getEmail(), 
                    encodedPassword, 
                    request.getLicenseNumber()
            );
            case VERIFICATION_OFFICER -> new VerificationOfficer(
                    request.getFirstName(), 
                    request.getLastName(), 
                    request.getEmail(), 
                    encodedPassword
            );
            case ADMIN -> new Admin(
                    request.getFirstName(), 
                    request.getLastName(), 
                    request.getEmail(), 
                    encodedPassword
            );
            case BOOKING_MANAGER -> new BookingManager(
                    request.getFirstName(), 
                    request.getLastName(), 
                    request.getEmail(), 
                    encodedPassword
            );
        };
    }

}
