import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

class Base64Converter {
  /// Encodes an image file to a Base64 string.
  static Future<String> encodeImageFile(File imageFile) async {
    try {
      List<int> imageBytes = await imageFile.readAsBytes();
      return base64Encode(imageBytes);
    } catch (e) {
      return '';
    }
  }

  /// Decodes a Base64 string back into Uint8List (bytes).
  /// This is useful for memory-based image widgets: Image.memory(bytes)
  static Uint8List decodeBase64ToBytes(String base64String) {
    try {
      return base64Decode(base64String);
    } catch (e) {
      return Uint8List(0);
    }
  }

  /// Helper to get a full Base64 data URI if needed for web/api
  static String toDataUri(String base64String, {String format = 'png'}) {
    return 'data:image/$format;base64,$base64String';
  }
}
