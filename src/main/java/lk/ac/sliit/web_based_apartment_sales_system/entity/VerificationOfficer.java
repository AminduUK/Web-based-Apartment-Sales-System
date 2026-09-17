package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "verification_officers")
public class VerificationOfficer extends User {

    public VerificationOfficer() {
        super();
    }

    public VerificationOfficer(String firstName, String lastName, String email, String password) {
        super(firstName, lastName, email, password, Role.VERIFICATION_OFFICER);
    }

}
