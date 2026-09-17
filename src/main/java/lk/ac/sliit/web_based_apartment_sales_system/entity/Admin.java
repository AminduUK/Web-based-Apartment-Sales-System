package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "admins")
public class Admin extends User {

    public Admin() {
        super();
    }

    public Admin(String firstName, String lastName, String email, String password) {
        super(firstName, lastName, email, password, Role.ADMIN);
    }

}
