package lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsResponse {

    private long totalUsers;
    private Map<String, Long> usersByRole;

    private long totalListings;
    private Map<String, Long> listingsByStatus;

    private long totalBookings;
    private Map<String, Long> bookingsByStatus;
}

