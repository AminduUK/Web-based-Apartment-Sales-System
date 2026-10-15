package lk.ac.sliit.web_based_apartment_sales_system.dto.response.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private LocalDateTime createdAt;
    private boolean isRead;
    private Long relatedBookingId;
    private Long relatedListingId;
}
