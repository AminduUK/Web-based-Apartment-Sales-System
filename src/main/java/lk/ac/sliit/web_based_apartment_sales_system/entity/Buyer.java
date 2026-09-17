package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "buyers")
public class Buyer extends User {

    public Buyer() {
        super();
    }

    public Buyer(String firstName, String lastName, String email, String password) {
        super(firstName, lastName, email, password, Role.BUYER);
    }

}
