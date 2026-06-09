class BusinessModel {
  int? id;
  String? businessName;
  String? businessType;
  String? slug;
  String? address;
  String? city;
  String? state;
  bool? status;
  int? userId;

  BusinessModel({
    this.id,
    this.businessName,
    this.businessType,
    this.slug,
    this.address,
    this.city,
    this.state,
    this.status,
    this.userId,
  });

  BusinessModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    businessName = json['business_name'];
    businessType = json['business_type'];
    slug = json['slug'];
    address = json['address'];
    city = json['city'];
    state = json['state'];
    status = json['status'];
    userId = json['user_id'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['business_name'] = businessName;
    data['business_type'] = businessType;
    data['slug'] = slug;
    data['address'] = address;
    data['city'] = city;
    data['state'] = state;
    data['status'] = status;
    data['user_id'] = userId;
    return data;
  }
}
