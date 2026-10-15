package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignInRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignUpRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.AuthResponse;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.UpdateProfileRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.UserProfileResponse;
import lk.ac.sliit.web_based_apartment_sales_system.entity.User;

public interface AuthService {

    AuthResponse signUp(SignUpRequest request);

    AuthResponse signIn(SignInRequest request);

    UserProfileResponse getCurrentUserProfile(User currentUser);

    UserProfileResponse updateProfile(UpdateProfileRequest request, User currentUser);

    java.util.Map<String, Object> changePassword(lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.ChangePasswordRequest request, User currentUser);

    AuthResponse becomeAgent(lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.BecomeAgentRequest request, User currentUser);
}
