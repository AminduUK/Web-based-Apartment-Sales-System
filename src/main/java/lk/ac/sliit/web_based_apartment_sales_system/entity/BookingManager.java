package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "booking_managers")
public class BookingManager extends User {

    public BookingManager() {
        super();
    }

    public BookingManager(String firstName, String lastName, String email, String password) {
        super(firstName, lastName, email, password, Role.BOOKING_MANAGER);
    }

}
