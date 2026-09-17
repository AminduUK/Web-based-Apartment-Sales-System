package lk.ac.sliit.web_based_apartment_sales_system.mapper;

import lk.ac.sliit.web_based_apartment_sales_system.dto.response.admin.UserSummaryResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserSummaryResponse toSummary(User user) {
        UserSummaryResponse response = new UserSummaryResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole().name());
        response.setStatus(user.getStatus().name());
        response.setRegistrationDate(user.getRegistrationDate());
        return response;
    }
}

