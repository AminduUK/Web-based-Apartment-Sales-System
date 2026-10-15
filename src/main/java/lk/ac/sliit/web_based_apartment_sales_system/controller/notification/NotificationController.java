package lk.ac.sliit.web_based_apartment_sales_system.controller.notification;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.notification.NotificationResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.Notification;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;
import lk.ac.sliit.web_based_apartment_sales_system.exception.ResourceNotFoundException;
import lk.ac.sliit.web_based_apartment_sales_system.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.ok(List.of());
        }

        List<NotificationResponse> list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.ok(Map.of("unreadCount", 0L));
        }

        long count = notificationRepository.countByRecipientIdAndIsReadFalse(currentUser.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));

        if (currentUser != null && notification.getRecipient().getId().equals(currentUser.getId())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User currentUser) {
        if (currentUser != null) {
            List<Notification> unread = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId());
            unread.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(unread);
        }
        return ResponseEntity.ok().build();
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .createdAt(n.getCreatedAt())
                .isRead(n.isRead())
                .relatedBookingId(n.getRelatedBookingId())
                .relatedListingId(n.getRelatedListingId())
                .build();
    }
}
