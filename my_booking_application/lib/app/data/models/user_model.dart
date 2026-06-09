class UserModel {
  final int? id;
  final String? name;
  final String? email;
  final String? role;
  final bool? status;
  final String? profilePicture;
  final String? token;
  final int? businessId;

  UserModel({
    this.id,
    this.name,
    this.email,
    this.role,
    this.status,
    this.profilePicture,
    this.token,
    this.businessId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'],
        name: json['name'],
        email: json['email'],
        role: json['role'],
        status: json['status'],
        profilePicture: json['profile_picture'] ?? json['avatar'],
        token: json['token'],
        businessId: json['business_id'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'status': status,
        'profile_picture': profilePicture,
        'token': token,
        'business_id': businessId,
      };
}
