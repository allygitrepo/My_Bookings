// Global validator for MyBookings

class Validators {
  // 1. Email Validation
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) return null;
    final regex = RegExp(r'^[a-zA-Z0-9._%+-]+@ [a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!regex.hasMatch(value)) return "Please enter a valid email address";
    if (containsEmoji(value)) return "Emojis are not allowed";
    return null;
  }

  // 2. Mobile Number Validation (STRICT 10 digits)
  static String? validateMobile(String? value) {
    if (value == null || value.isEmpty) return null;
    final regex = RegExp(r'^[0-9]{10}$');
    if (!regex.hasMatch(value)) return "Mobile number must be 10 digits";
    return null;
  }

  // 3. Phone Number Validation
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) return null;
    final regex = RegExp(r'^[0-9+\-\s()]{6,15}$');
    if (!regex.hasMatch(value)) return "Please enter a valid phone number";
    if (containsEmoji(value)) return "Emojis are not allowed";
    return null;
  }

  // 4. Name Field Validation (Alphabets only)
  static String? validateName(String? value) {
    if (value == null || value.isEmpty) return null;
    final regex = RegExp(r'^[A-Za-z ]+$');
    if (!regex.hasMatch(value)) return "Name should contain only alphabets";
    if (containsEmoji(value)) return "Emojis are not allowed";
    return null;
  }

  // 5. Emoji Blocking (GLOBAL)
  static bool containsEmoji(String value) {
    final regex = RegExp(r'[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]', unicode: true);
    return regex.hasMatch(value);
  }

  // 6. Required Field Validation
  static String? validateRequired(dynamic value) {
    if (value == null || (value is String && value.trim().isEmpty)) {
      return "Please fill all required fields";
    }
    return null;
  }
}
