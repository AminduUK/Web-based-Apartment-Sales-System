package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "listings")
public class Listing {

    public enum Status {
        PENDING, PUBLISHED, REJECTED, SOLD, WITHDRAWN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Embedded
    private Address address;

    @Column(name = "property_type")
    private String propertyType;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @Column(name = "date_posted")
    private LocalDate datePosted;

    @Column(name = "floor_plan_url")
    private String floorPlanUrl;

    @Column(name = "view_count")
    private int viewCount = 0;

    @Column(name = "favorite_count")
    private int favoriteCount = 0;

    // Listing is owned by EITHER a Seller OR an Agent (exactly one should be set)
    @ManyToOne
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @ManyToOne
    @JoinColumn(name = "agent_id")
    private Agent agent;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos = new ArrayList<>();

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Document> documents = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "listing_amenities",
            joinColumns = @JoinColumn(name = "listing_id"),
            inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    private Set<Amenity> amenities = new HashSet<>();

    @OneToMany(mappedBy = "listing")
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "listing")
    private List<VerificationRecord> verificationRecords = new ArrayList<>();

}
