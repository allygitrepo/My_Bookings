import 'package:flutter/material.dart';

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
    const primaryPurple = Color(0xFF3B32B4);
    
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 0, 24, 30), // Floating margin
      height: 85,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(35),
        border: Theme.of(context).brightness == Brightness.dark 
            ? Border.all(color: Colors.white10, width: 1) 
            : null,
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).brightness == Brightness.dark 
                ? Colors.black.withOpacity(0.3) 
                : Colors.black.withOpacity(0.08),
            blurRadius: 25,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // ── Navigation Items ──
          Row(
            children: [
              _buildNavItem(context, Icons.home_outlined, Icons.home_rounded, 'Home', 0, primaryPurple),
              _buildNavItem(context, Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Bookings', 1, primaryPurple),
              
              // Spacer for the center button (commented out)
              // const Expanded(child: SizedBox()),
              
              _buildNavItem(context, Icons.people_outline_rounded, Icons.people_rounded, 'Staff', 2, primaryPurple),
              _buildNavItem(context, Icons.build_outlined, Icons.build_rounded, 'Services', 3, primaryPurple),
            ],
          ),

          // ── Floating Center Button ── (commented out)
          /*
          Positioned(
            top: -25, // Elevate above the bar
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: () => onTap(-1), // Logic for 'New' action
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      color: primaryPurple,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x663B32B4),
                          blurRadius: 15,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.add, color: Colors.white, size: 30),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'New',
                  style: TextStyle(
                    color: primaryPurple,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Syne',
                  ),
                ),
              ],
            ),
          ),
          */
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, IconData icon, IconData activeIcon, String label, int index, Color activeColor) {
    final bool isActive = selectedIndex == index;
    
    return Expanded(
      child: InkWell(
        onTap: () => onTap(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              color: isActive ? activeColor : const Color(0xFF9E9E9E),
              size: 24, // Slightly smaller icons for better fit
            ),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                style: TextStyle(
                  color: isActive ? activeColor : (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : const Color(0xFF9E9E9E)),
                  fontSize: 10,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
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
