package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Embeddable
@AllArgsConstructor
@NoArgsConstructor
public class Address {

    private String street;
    private String city;

    @jakarta.persistence.Column(name = "postal_code")
    private String postalCode;

}
