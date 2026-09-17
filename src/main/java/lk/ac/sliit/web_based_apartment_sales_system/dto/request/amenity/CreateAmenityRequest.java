package lk.ac.sliit.web_based_apartment_sales_system.dto.request.amenity;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateAmenityRequest {

    @NotBlank
    private String name;
}
