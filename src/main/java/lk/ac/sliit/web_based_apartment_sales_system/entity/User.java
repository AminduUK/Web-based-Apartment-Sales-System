package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Data
@Entity
@Table(name = "users")
@DiscriminatorColumn(name = "user_type")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User implements UserDetails {

    public enum Status {
        ACTIVE, SUSPENDED
    }

    public enum Role {
        BUYER, SELLER, AGENT, VERIFICATION_OFFICER, ADMIN, BOOKING_MANAGER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    public enum SubscriptionPlan {
        FREE, PRO, ELITE
    }

    public enum BillingCycle {
        MONTHLY, ANNUAL
    }

    @Column(name = "registration_date")
    private LocalDate registrationDate;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_plan")
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.FREE;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle")
    private BillingCycle billingCycle = BillingCycle.MONTHLY;

    @Column(name = "is_verified")
    private Boolean verified = false;

    @Column(name = "extra_listing_slots", nullable = false)
    private int extraListingSlots = 0;

    public int getListingLimit() {
        return getListingLimit(null);
    }

    public int getListingLimit(lk.ac.sliit.web_based_apartment_sales_system.service.SystemSettingService settingsService) {
        int baseLimit;
        if (role == Role.SELLER) {
            baseLimit = settingsService != null ? settingsService.getIntSetting("LIMIT_SELLER_FREE", 1) : 1;
        } else if (subscriptionPlan == null || subscriptionPlan == SubscriptionPlan.FREE) {
            baseLimit = settingsService != null ? settingsService.getIntSetting("LIMIT_AGENT_FREE", 2) : 2;
        } else if (subscriptionPlan == SubscriptionPlan.PRO) {
            baseLimit = settingsService != null ? settingsService.getIntSetting("LIMIT_AGENT_PRO", 10) : 10;
        } else {
            return settingsService != null ? settingsService.getIntSetting("LIMIT_AGENT_ELITE", 1000) : 1000; // Unlimited for ELITE
        }
        return baseLimit + extraListingSlots;
    }

    protected User() {
    }

    protected User(String firstName, String lastName, String email, String password, Role role) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.registrationDate = LocalDate.now();
        this.status = Status.ACTIVE;
    }

    // ----- UserDetails implementation -----

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        // Spring Security's "username" concept maps to our email
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != Status.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == Status.ACTIVE;
    }

}
