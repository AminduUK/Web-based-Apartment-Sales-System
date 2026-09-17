package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "sellers")
public class Seller extends User {

    public Seller() {
        super();
    }

    public Seller(String firstName, String lastName, String email, String password) {
        super(firstName, lastName, email, password, Role.SELLER);
    }

}
