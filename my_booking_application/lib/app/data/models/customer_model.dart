class CustomerModel {
  int? id;
  int? businessId;
  String? name;
  String? email;
  String? phone;
  bool? status;

  CustomerModel({
    this.id,
    this.businessId,
    this.name,
    this.email,
    this.phone,
    this.status,
  });

  CustomerModel.fromJson(Map<String, dynamic> json) {
    id = json['id'] is int
        ? json['id']
        : (json['id'] != null ? int.tryParse(json['id'].toString()) : null);
    businessId = json['business_id'] is int
        ? json['business_id']
        : (json['business_id'] != null ? int.tryParse(json['business_id'].toString()) : null);
    name = json['name']?.toString();
    email = json['email']?.toString();
    phone = json['phone']?.toString();
    status = json['status'] == true || json['status'] == 1 || json['status'] == '1' || json['status'] == 'true';
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['business_id'] = businessId;
    data['name'] = name;
    data['email'] = email;
    data['phone'] = phone;
    data['status'] = status;
    return data;
  }
}
