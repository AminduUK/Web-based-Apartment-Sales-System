package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import lk.ac.sliit.web_based_apartment_sales_system.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendPasswordChangeEmail(String recipientEmail, String recipientName) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String subject = "Security Alert: Your Nook & Key Account Password Has Been Changed";
        String messageBody = String.format(
            "Hello %s,\n\n" +
            "This is an automated security notification from Nook & Key.\n\n" +
            "The password for your account (%s) was successfully changed on %s.\n\n" +
            "If you initiated this change, you can safely disregard this message.\n" +
            "If you DID NOT authorize this update, please contact our Security & Operations team immediately at security@nookandkey.com.\n\n" +
            "Best regards,\n" +
            "Nook & Key Security Operations\n" +
            "https://nookandkey.com",
            (recipientName != null && !recipientName.isBlank()) ? recipientName : "Valued Member",
            recipientEmail,
            timestamp
        );

        log.info("\n" +
            "======================================================================\n" +
            "                [NOOK & KEY OUTGOING EMAIL SERVICE]                   \n" +
            "======================================================================\n" +
            "TO      : {}\n" +
            "SUBJECT : {}\n" +
            "BODY    :\n{}\n" +
            "======================================================================\n",
            recipientEmail, subject, messageBody);
    }

    @Override
    public void sendNotificationEmail(String recipientEmail, String recipientName, String subject, String body) {
        log.info("\n" +
            "======================================================================\n" +
            "                [NOOK & KEY OUTGOING EMAIL SERVICE]                   \n" +
            "======================================================================\n" +
            "TO      : {}\n" +
            "SUBJECT : {}\n" +
            "BODY    :\n{}\n" +
            "======================================================================\n",
            recipientEmail, subject, body);
    }
}
