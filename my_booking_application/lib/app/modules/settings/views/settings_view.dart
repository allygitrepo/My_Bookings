import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/constants/appColors.dart';
import '../controllers/settings_controller.dart';

class SettingsView extends GetView<SettingsController> {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.navy300 : AppColors.primary;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          'Business Profile',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Theme.of(context).textTheme.titleLarge?.color,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: primaryColor),
          onPressed: () => Get.back(),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.business.value == null) {
          return const Center(child: CircularProgressIndicator());
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context, isDark, primaryColor),
              const SizedBox(height: 28),
              _buildThemeSelector(context, isDark, primaryColor),
              const SizedBox(height: 28),
              _buildProfileForm(context, isDark, primaryColor),
              const SizedBox(height: 36),
              _buildActionButtons(context, isDark, primaryColor),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildHeader(BuildContext context, bool isDark, Color primaryColor) {
    return Center(
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: primaryColor, width: 2),
                ),
                child: CircleAvatar(
                  radius: 50,
                  backgroundColor: primaryColor.withOpacity(0.1),
                  child: Icon(Icons.storefront_rounded, size: 50, color: primaryColor),
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: primaryColor, shape: BoxShape.circle),
                  child: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 18),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            controller.business.value?.businessName ?? 'Business Name',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).textTheme.titleLarge?.color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Organization ID: #${controller.business.value?.id}',
            style: TextStyle(
              color: Theme.of(context).textTheme.bodyMedium?.color,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThemeSelector(BuildContext context, bool isDark, Color primaryColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: isDark ? Border.all(color: Colors.white10, width: 1) : null,
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.palette_outlined, color: primaryColor, size: 20),
              const SizedBox(width: 10),
              Text(
                'Appearance Theme',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).textTheme.titleMedium?.color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _buildThemeChip(context, 'System', Icons.brightness_auto_rounded, ThemeMode.system)),
              const SizedBox(width: 8),
              Expanded(child: _buildThemeChip(context, 'Light', Icons.light_mode_rounded, ThemeMode.light)),
              const SizedBox(width: 8),
              Expanded(child: _buildThemeChip(context, 'Dark', Icons.dark_mode_rounded, ThemeMode.dark)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildThemeChip(BuildContext context, String label, IconData icon, ThemeMode mode) {
    return Obx(() {
      final isSelected = controller.selectedThemeMode.value == mode;

      return InkWell(
        onTap: () {
          controller.changeTheme(mode);
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? (Get.isDarkMode ? AppColors.accent.withOpacity(0.2) : AppColors.primary.withOpacity(0.1))
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? (Get.isDarkMode ? AppColors.accent : AppColors.primary)
                  : (Get.isDarkMode ? Colors.white12 : AppColors.borderLight),
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected
                    ? (Get.isDarkMode ? AppColors.accent : AppColors.primary)
                    : Theme.of(context).textTheme.bodyMedium?.color,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected
                      ? (Get.isDarkMode ? AppColors.accent : AppColors.primary)
                      : Theme.of(context).textTheme.bodyMedium?.color,
                ),
              ),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildProfileForm(BuildContext context, bool isDark, Color primaryColor) {
    return Column(
      children: [
        _buildTextField(context, controller.nameController, 'Business Name', Icons.business_outlined, isDark, primaryColor),
        const SizedBox(height: 20),
        _buildTextField(context, controller.addressController, 'Address', Icons.location_on_outlined, isDark, primaryColor),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _buildTextField(context, controller.cityController, 'City', Icons.location_city_outlined, isDark, primaryColor)),
            const SizedBox(width: 16),
            Expanded(child: _buildTextField(context, controller.stateController, 'State', Icons.map_outlined, isDark, primaryColor)),
          ],
        ),
      ],
    );
  }

  Widget _buildTextField(BuildContext context, TextEditingController textCtrl, String label, IconData icon, bool isDark, Color primaryColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).textTheme.bodyLarge?.color,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            border: isDark ? Border.all(color: Colors.white10, width: 1) : null,
            boxShadow: [
              BoxShadow(
                color: isDark ? Colors.black26 : Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextField(
            controller: textCtrl,
            style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
            decoration: InputDecoration(
              prefixIcon: Icon(icon, color: primaryColor, size: 20),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context, bool isDark, Color primaryColor) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            onPressed: () => controller.updateProfile(),
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 54,
          child: OutlinedButton.icon(
            onPressed: () => controller.logout(),
            icon: const Icon(Icons.logout_rounded, size: 20),
            label: const Text('Logout', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }
}
