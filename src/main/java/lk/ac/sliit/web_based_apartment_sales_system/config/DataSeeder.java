package lk.ac.sliit.web_based_apartment_sales_system.config;

import lk.ac.sliit.web_based_apartment_sales_system.entity.Admin;
import lk.ac.sliit.web_based_apartment_sales_system.entity.BookingManager;
import lk.ac.sliit.web_based_apartment_sales_system.entity.VerificationOfficer;
import lk.ac.sliit.web_based_apartment_sales_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final lk.ac.sliit.web_based_apartment_sales_system.repository.AmenityRepository amenityRepository;
    private final lk.ac.sliit.web_based_apartment_sales_system.repository.ListingRepository listingRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        seedVerificationOfficer();
        seedBookingManager();
        seedDefaultAmenities();
    }

    private void seedDefaultAmenities() {
        java.util.List<String> defaults = java.util.List.of(
                "Swimming Pool",
                "Fitness Center / Gym",
                "24/7 Security",
                "Reserved Car Parking",
                "Backup Generator",
                "Rooftop Terrace",
                "High-speed Elevator",
                "Balcony / View",
                "Play Area / Garden"
        );
        for (String name : defaults) {
            if (!amenityRepository.existsByNameIgnoreCase(name)) {
                lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity amenity = new lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity();
                amenity.setName(name);
                amenityRepository.save(amenity);
                log.info("Default Amenity seeded: {}", name);
            }
        }

        // Attach realistic default amenities to listings that currently have none
        java.util.List<lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity> allAmenities = amenityRepository.findAll();
        if (!allAmenities.isEmpty()) {
            java.util.Map<String, lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity> amenityMap = allAmenities.stream()
                    .collect(java.util.stream.Collectors.toMap(a -> a.getName().toLowerCase(), a -> a, (a1, a2) -> a1));

            var pool = amenityMap.get("swimming pool");
            var gym = amenityMap.get("fitness center / gym");
            var sec = amenityMap.get("24/7 security");
            var park = amenityMap.get("reserved car parking");
            var gen = amenityMap.get("backup generator");
            var roof = amenityMap.get("rooftop terrace");
            var lift = amenityMap.get("high-speed elevator");
            var view = amenityMap.get("balcony / view");
            var play = amenityMap.get("play area / garden");

            var listings = listingRepository.findAll();
            for (var listing : listings) {
                if (listing.getAmenities() == null || listing.getAmenities().isEmpty()) {
                    var set = new java.util.HashSet<lk.ac.sliit.web_based_apartment_sales_system.entity.Amenity>();
                    if (sec != null) set.add(sec);
                    if (park != null) set.add(park);
                    if (lift != null) set.add(lift);

                    String title = (listing.getTitle() != null ? listing.getTitle() : "").toLowerCase();
                    double price = listing.getPrice() != null ? listing.getPrice().doubleValue() : 0.0;

                    if (price > 40_000_000 || title.contains("luxury") || title.contains("penthouse") || title.contains("suite")) {
                        if (pool != null) set.add(pool);
                        if (gym != null) set.add(gym);
                        if (roof != null) set.add(roof);
                    }
                    if (title.contains("ocean") || title.contains("beach") || title.contains("view")) {
                        if (view != null) set.add(view);
                        if (pool != null) set.add(pool);
                    }
                    if (title.contains("house") || title.contains("garden") || title.contains("park")) {
                        if (play != null) set.add(play);
                        if (gen != null) set.add(gen);
                    }
                    listing.setAmenities(set);
                    listingRepository.save(listing);
                }
            }
        }
    }

    private void seedAdmin() {
        String email = "admin@nookandkey.com";
        if (!userRepository.existsByEmail(email)) {
            Admin admin = new Admin(
                    "System",
                    "Admin",
                    email,
                    passwordEncoder.encode("Admin123!")
            );
            admin.setPhone("+94 77 111 2233");
            userRepository.save(admin);
            log.info("Default Admin account seeded: {}", email);
        }
    }

    private void seedVerificationOfficer() {
        String email = "officer@nookandkey.com";
        if (!userRepository.existsByEmail(email)) {
            VerificationOfficer officer = new VerificationOfficer(
                    "Rashmi",
                    "Silva",
                    email,
                    passwordEncoder.encode("Officer123!")
            );
            officer.setPhone("+94 77 444 5566");
            userRepository.save(officer);
            log.info("Default Verification Officer account seeded: {}", email);
        }
    }

    private void seedBookingManager() {
        String email = "manager@nookandkey.com";
        if (!userRepository.existsByEmail(email)) {
            BookingManager manager = new BookingManager(
                    "Tharindu",
                    "Jayawardena",
                    email,
                    passwordEncoder.encode("Manager123!")
            );
            manager.setPhone("+94 77 777 8899");
            userRepository.save(manager);
            log.info("Default Booking Manager account seeded: {}", email);
        }
    }
}
