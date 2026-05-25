class NotificationModel {
  final String? id;
  final String? title;
  final String? body;
  final DateTime? createdAt;
  final bool isRead;
  final String? bookingId;
  final String? type; // e.g., 'new_booking', 'booking_cancelled', 'payment_received'

  NotificationModel({
    this.id,
    this.title,
    this.body,
    this.createdAt,
    this.isRead = false,
    this.bookingId,
    this.type,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: json['id'],
        title: json['title'],
        body: json['body'],
        createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
        isRead: json['is_read'] ?? false,
        bookingId: json['booking_id']?.toString(),
        type: json['type'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'created_at': createdAt?.toIso8601String(),
        'is_read': isRead,
        'booking_id': bookingId,
        'type': type,
      };

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      title: title,
      body: body,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
      bookingId: bookingId,
      type: type,
    );
  }
}
