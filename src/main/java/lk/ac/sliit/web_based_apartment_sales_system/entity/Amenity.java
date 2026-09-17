package lk.ac.sliit.web_based_apartment_sales_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "amenities")
@AllArgsConstructor
@NoArgsConstructor
public class Amenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @ManyToMany(mappedBy = "amenities")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Listing> listings = new HashSet<>();

}