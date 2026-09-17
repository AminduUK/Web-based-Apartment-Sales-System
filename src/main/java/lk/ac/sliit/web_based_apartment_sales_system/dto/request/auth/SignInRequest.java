package lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignInRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

}
