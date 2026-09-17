package lk.ac.sliit.web_based_apartment_sales_system.dto.request.admin;

import jakarta.validation.constraints.NotNull;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserStatusRequest {

    @NotNull
    private User.Status status;
}

