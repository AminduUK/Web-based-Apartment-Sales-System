package lk.ac.sliit.web_based_apartment_sales_system.service.impl;

import jakarta.annotation.PostConstruct;
import lk.ac.sliit.web_based_apartment_sales_system.entity.SystemSetting;
import lk.ac.sliit.web_based_apartment_sales_system.repository.SystemSettingRepository;
import lk.ac.sliit.web_based_apartment_sales_system.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;
    private final Map<String, String> cachedSettings = new ConcurrentHashMap<>();

    @PostConstruct
    public void initDefaults() {
        seedDefaultsIfMissing();
        refreshCache();
    }

    private void seedDefaultsIfMissing() {
        List<SystemSetting> defaults = List.of(
                // Pricing / Monetization
                new SystemSetting("PRICING_SELLER_SLOT", "2500.0", "PRICING", "Seller Single Listing Pass Price (LKR)", "Fee charged to a seller to publish an additional apartment without becoming an agent."),
                new SystemSetting("PRICING_AGENT_SLOT", "2500.0", "PRICING", "Agent Extra Slot Price (LKR)", "On-demand fee charged to an agent on the Free tier to add 1 extra listing beyond their base quota."),
                new SystemSetting("PRICING_BOOKING_ADVANCE", "5000.0", "PRICING", "Viewing Advance Deposit (LKR)", "Standard reservation deposit paid by a buyer when booking an apartment viewing appointment."),

                // Subscriptions & Quotas
                new SystemSetting("LIMIT_SELLER_FREE", "1", "SUBSCRIPTION", "Free Seller Default Quota", "Maximum number of active listings an individual property owner can list for free."),
                new SystemSetting("LIMIT_AGENT_FREE", "2", "SUBSCRIPTION", "Free Agent Default Quota", "Maximum number of active listings an agent on the Free tier can publish simultaneously."),
                new SystemSetting("SUBSCRIPTION_PRO_PRICE", "4900.0", "SUBSCRIPTION", "Agent Pro Plan Monthly Price (LKR)", "Monthly recurring subscription fee for the Pro agent tier."),
                new SystemSetting("LIMIT_AGENT_PRO", "10", "SUBSCRIPTION", "Agent Pro Plan Quota", "Maximum active listing capacity granted to an agent subscribing to the Pro tier."),
                new SystemSetting("SUBSCRIPTION_ELITE_PRICE", "12900.0", "SUBSCRIPTION", "Agent Elite Plan Monthly Price (LKR)", "Monthly recurring subscription fee for the Elite agent tier."),
                new SystemSetting("LIMIT_AGENT_ELITE", "1000", "SUBSCRIPTION", "Agent Elite Plan Quota", "Maximum active listing capacity for Elite tier (considered unlimited)."),

                // Platform Controls
                new SystemSetting("PLATFORM_CURRENCY", "LKR", "PLATFORM", "System Currency", "Default currency symbol used across the marketplace (e.g. LKR, USD)."),
                new SystemSetting("DISPUTE_WINDOW_DAYS", "7", "PLATFORM", "Booking Dispute Resolution Window (Days)", "Number of days allowed after viewing appointment for buyers or sellers to file a formal dispute."),
                new SystemSetting("LEGAL_VERIFICATION_REQUIRED", "true", "PLATFORM", "Mandatory Legal Title Deed Verification", "When enabled, newly created listings require Legal Officer approval before becoming publicly visible.")
        );

        for (SystemSetting setting : defaults) {
            systemSettingRepository.findBySettingKey(setting.getSettingKey()).ifPresentOrElse(existing -> {
                try {
                    double val = Double.parseDouble(existing.getSettingValue().trim());
                    if ("PRICING_SELLER_SLOT".equals(existing.getSettingKey()) && (val == 3500.0 || val == 4500.0)) {
                        existing.setSettingValue("2500.0");
                        systemSettingRepository.save(existing);
                        log.info("[SystemSetting] Migrated PRICING_SELLER_SLOT to 2500.0");
                    }
                    if ("PRICING_AGENT_SLOT".equals(existing.getSettingKey()) && (val == 3000.0 || val == 3500.0)) {
                        existing.setSettingValue("2500.0");
                        systemSettingRepository.save(existing);
                        log.info("[SystemSetting] Migrated PRICING_AGENT_SLOT to 2500.0");
                    }
                    if ("SUBSCRIPTION_PRO_PRICE".equals(existing.getSettingKey()) && val == 12000.0) {
                        existing.setSettingValue("4900.0");
                        systemSettingRepository.save(existing);
                    }
                    if ("SUBSCRIPTION_ELITE_PRICE".equals(existing.getSettingKey()) && val == 25000.0) {
                        existing.setSettingValue("12900.0");
                        systemSettingRepository.save(existing);
                    }
                } catch (Exception ignored) {
                }
            }, () -> {
                systemSettingRepository.save(setting);
                log.info("[SystemSetting] Seeded default setting: {} = {}", setting.getSettingKey(), setting.getSettingValue());
            });
        }
    }

    private void refreshCache() {
        cachedSettings.clear();
        systemSettingRepository.findAll().forEach(s -> cachedSettings.put(s.getSettingKey(), s.getSettingValue()));
    }

    @Override
    public List<SystemSetting> getAllSettings() {
        return systemSettingRepository.findAll();
    }

    @Override
    public Map<String, String> getAllSettingsAsMap() {
        if (cachedSettings.isEmpty()) {
            refreshCache();
        }
        return Collections.unmodifiableMap(cachedSettings);
    }

    @Override
    public Map<String, Object> getPublicSettings() {
        Map<String, Object> publicMap = new HashMap<>();
        String currency = getSettingValue("PLATFORM_CURRENCY", "LKR");
        Double sellerSlotPrice = getDoubleSetting("PRICING_SELLER_SLOT", 2500.0);
        Double agentSlotPrice = getDoubleSetting("PRICING_AGENT_SLOT", 2500.0);
        Double bookingAdvance = getDoubleSetting("PRICING_BOOKING_ADVANCE", 5000.0);
        Integer freeSellerLimit = getIntSetting("LIMIT_SELLER_FREE", 1);
        Integer freeAgentLimit = getIntSetting("LIMIT_AGENT_FREE", 2);
        Double proPlanPrice = getDoubleSetting("SUBSCRIPTION_PRO_PRICE", 4900.0);
        Integer proPlanLimit = getIntSetting("LIMIT_AGENT_PRO", 10);
        Double elitePlanPrice = getDoubleSetting("SUBSCRIPTION_ELITE_PRICE", 12900.0);
        Integer elitePlanLimit = getIntSetting("LIMIT_AGENT_ELITE", 1000);
        boolean legalVerification = Boolean.parseBoolean(getSettingValue("LEGAL_VERIFICATION_REQUIRED", "true"));
        Integer disputeDays = getIntSetting("DISPUTE_WINDOW_DAYS", 7);

        // Friendly camelCase keys
        publicMap.put("currency", currency);
        publicMap.put("sellerSlotPrice", sellerSlotPrice);
        publicMap.put("agentSlotPrice", agentSlotPrice);
        publicMap.put("bookingAdvanceDeposit", bookingAdvance);
        publicMap.put("freeSellerLimit", freeSellerLimit);
        publicMap.put("freeAgentLimit", freeAgentLimit);
        publicMap.put("proPlanPrice", proPlanPrice);
        publicMap.put("proPlanLimit", proPlanLimit);
        publicMap.put("elitePlanPrice", elitePlanPrice);
        publicMap.put("elitePlanLimit", elitePlanLimit);
        publicMap.put("legalVerificationRequired", legalVerification);
        publicMap.put("disputeWindowDays", disputeDays);

        // Raw system keys for direct lookup
        publicMap.put("PLATFORM_CURRENCY", currency);
        publicMap.put("PRICING_SELLER_SLOT", sellerSlotPrice);
        publicMap.put("PRICING_AGENT_SLOT", agentSlotPrice);
        publicMap.put("PRICING_BOOKING_ADVANCE", bookingAdvance);
        publicMap.put("LIMIT_SELLER_FREE", freeSellerLimit);
        publicMap.put("LIMIT_AGENT_FREE", freeAgentLimit);
        publicMap.put("SUBSCRIPTION_PRO_PRICE", proPlanPrice);
        publicMap.put("LIMIT_AGENT_PRO", proPlanLimit);
        publicMap.put("SUBSCRIPTION_ELITE_PRICE", elitePlanPrice);
        publicMap.put("LIMIT_AGENT_ELITE", elitePlanLimit);
        publicMap.put("LEGAL_VERIFICATION_REQUIRED", legalVerification);
        publicMap.put("DISPUTE_WINDOW_DAYS", disputeDays);

        return publicMap;
    }

    @Override
    public String getSettingValue(String key, String defaultValue) {
        String val = cachedSettings.get(key);
        if (val != null) return val;
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Override
    public Double getDoubleSetting(String key, Double defaultValue) {
        try {
            String val = getSettingValue(key, String.valueOf(defaultValue));
            return Double.parseDouble(val.trim());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    @Override
    public Integer getIntSetting(String key, Integer defaultValue) {
        try {
            String val = getSettingValue(key, String.valueOf(defaultValue));
            return Integer.parseInt(val.trim());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    @Override
    @Transactional
    public void updateSettings(Map<String, String> newSettings) {
        if (newSettings == null || newSettings.isEmpty()) return;

        for (Map.Entry<String, String> entry : newSettings.entrySet()) {
            String key = entry.getKey().trim();
            String value = entry.getValue() != null ? entry.getValue().trim() : "";

            systemSettingRepository.findBySettingKey(key).ifPresentOrElse(setting -> {
                setting.setSettingValue(value);
                systemSettingRepository.save(setting);
                cachedSettings.put(key, value);
                log.info("[SystemSetting] Updated setting: {} = {}", key, value);
            }, () -> {
                SystemSetting newSetting = new SystemSetting(key, value, "CUSTOM", key, "Custom system configuration setting");
                systemSettingRepository.save(newSetting);
                cachedSettings.put(key, value);
            });
        }
    }

    @Override
    @Transactional
    public void resetToDefaults() {
        systemSettingRepository.deleteAll();
        seedDefaultsIfMissing();
        refreshCache();
        log.info("[SystemSetting] All system settings successfully reset to factory defaults.");
    }

}
