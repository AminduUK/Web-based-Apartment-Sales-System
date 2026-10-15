package lk.ac.sliit.web_based_apartment_sales_system.service;

public interface EmailService {
    void sendPasswordChangeEmail(String recipientEmail, String recipientName);
    void sendNotificationEmail(String recipientEmail, String recipientName, String subject, String body);
}
