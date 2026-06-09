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
    id = json['id'];
    businessId = json['business_id'];
    name = json['name'];
    email = json['email'];
    phone = json['phone'];
    status = json['status'];
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
