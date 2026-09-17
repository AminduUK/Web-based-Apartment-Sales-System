package lk.ac.sliit.web_based_apartment_sales_system.dto.request.verification;

import jakarta.validation.constraints.NotBlank;

public class RejectListingRequest {

    @NotBlank(message = "A comment explaining the rejection is required")
    private String comment;

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

}
