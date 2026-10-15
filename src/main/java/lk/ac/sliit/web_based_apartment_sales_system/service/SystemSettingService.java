package lk.ac.sliit.web_based_apartment_sales_system.service;

import lk.ac.sliit.web_based_apartment_sales_system.entity.SystemSetting;

import java.util.List;
import java.util.Map;

public interface SystemSettingService {

    List<SystemSetting> getAllSettings();

    Map<String, String> getAllSettingsAsMap();

    Map<String, Object> getPublicSettings();

    String getSettingValue(String key, String defaultValue);

    Double getDoubleSetting(String key, Double defaultValue);

    Integer getIntSetting(String key, Integer defaultValue);

    void updateSettings(Map<String, String> newSettings);

    void resetToDefaults();

}
