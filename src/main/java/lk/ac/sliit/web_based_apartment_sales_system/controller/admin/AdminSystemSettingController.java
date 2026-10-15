package lk.ac.sliit.web_based_apartment_sales_system.controller.admin;

import lk.ac.sliit.web_based_apartment_sales_system.entity.SystemSetting;
import lk.ac.sliit.web_based_apartment_sales_system.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSystemSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    public ResponseEntity<List<SystemSetting>> getAllSettings() {
        return ResponseEntity.ok(systemSettingService.getAllSettings());
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, String> settings) {
        systemSettingService.updateSettings(settings);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "System settings successfully updated and applied in real time.",
                "updatedCount", settings.size()
        ));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetDefaults() {
        systemSettingService.resetToDefaults();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All platform settings and monetization rules have been restored to factory defaults."
        ));
    }

}
