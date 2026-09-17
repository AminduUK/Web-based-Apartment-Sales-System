package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "agents")
public class Agent extends User {

    @Column(name = "license_number")
    private String licenseNumber;

    private Double rating = 0.0;

    public Agent() {
        super();
    }

    public Agent(String firstName, String lastName, String email, String password, String licenseNumber) {
        super(firstName, lastName, email, password, Role.AGENT);
        this.licenseNumber = licenseNumber;
    }

}
