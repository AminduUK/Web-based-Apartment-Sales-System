package lk.ac.sliit.web_based_apartment_sales_system.controller;

import lk.ac.sliit.web_based_apartment_sales_system.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/settings")
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublicSettings() {
        return ResponseEntity.ok(systemSettingService.getPublicSettings());
    }

}
