package lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank(message = "Email is required")
    @jakarta.validation.constraints.Pattern(
            regexp = "^\\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\s*$",
            message = "Please provide a valid email address"
    )
    private String email;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String phone;

    @NotNull
    private User.Role role;

    // Only required when role = AGENT
    private String licenseNumber;

    public void setEmail(String email) {
        this.email = email != null ? email.trim().toLowerCase() : null;
    }

    public void setPassword(String password) {
        this.password = password != null ? password.trim() : null;
    }

}
