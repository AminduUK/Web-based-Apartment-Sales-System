package lk.ac.sliit.web_based_apartment_sales_system.dto.request.subscription;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpgradeSubscriptionRequest {

    @NotBlank(message = "Subscription plan is required (FREE, PRO, ELITE)")
    private String plan;

    private String billingCycle; // MONTHLY or ANNUAL

    private String paymentMethod; // CARD, CASH, PADDLE
}
