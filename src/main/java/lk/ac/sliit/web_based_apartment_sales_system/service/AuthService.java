package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignInRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.request.auth.SignUpRequest;
import lk.ac.sliit.web_based_apartment_sales_system.dto.response.auth.AuthResponse;

public interface AuthService {

    AuthResponse signUp(SignUpRequest request);

    AuthResponse signIn(SignInRequest request);
}
