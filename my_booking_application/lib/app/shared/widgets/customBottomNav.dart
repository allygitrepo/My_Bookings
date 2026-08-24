import 'package:flutter/material.dart';
import '../../core/constants/appColors.dart';

class CustomBottomNavBar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onTap;

  const CustomBottomNavBar({
    super.key,
    required this.selectedIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    const primaryPurple = Color(0xFF3B32B4);
    
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 24), // Floating margin
      height: 78,
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.shade200,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark 
                ? Colors.black.withOpacity(0.4) 
                : Colors.black.withOpacity(0.08),
            blurRadius: 25,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildNavItem(context, Icons.home_outlined, Icons.home_rounded, 'Home', 0, primaryPurple),
          _buildNavItem(context, Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Bookings', 1, primaryPurple),
          _buildNavItem(context, Icons.people_outline_rounded, Icons.people_rounded, 'Staff', 2, primaryPurple),
          _buildNavItem(context, Icons.build_outlined, Icons.build_rounded, 'Services', 3, primaryPurple),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, IconData icon, IconData activeIcon, String label, int index, Color activeColor) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final bool isActive = selectedIndex == index;

    final Color effectiveActiveColor = isDark ? Colors.white : activeColor;
    final Color effectiveInactiveColor = isDark ? Colors.white60 : Colors.grey.shade500;

    return Expanded(
      child: InkWell(
        onTap: () => onTap(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: isActive && isDark
                  ? BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(14),
                    )
                  : null,
              child: Icon(
                isActive ? activeIcon : icon,
                color: effectiveActiveColor,
                size: 22,
              ),
            ),
            const SizedBox(height: 3),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                style: TextStyle(
                  color: isActive ? effectiveActiveColor : effectiveInactiveColor,
                  fontSize: 11,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                  fontFamily: 'Syne',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
