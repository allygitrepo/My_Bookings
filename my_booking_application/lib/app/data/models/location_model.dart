class LocationModel {
  int? id;
  int? businessId;
  String? locationName;
  String? address;
  String? city;
  String? state;
  String? locationType;
  String? meetingLink;
  bool? status;

  LocationModel({
    this.id,
    this.businessId,
    this.locationName,
    this.address,
    this.city,
    this.state,
    this.locationType,
    this.meetingLink,
    this.status,
  });

  LocationModel.fromJson(Map<String, dynamic> json) {
    id = json['id'] is int
        ? json['id']
        : (json['id'] != null ? int.tryParse(json['id'].toString()) : null);
    businessId = json['business_id'] is int
        ? json['business_id']
        : (json['business_id'] != null ? int.tryParse(json['business_id'].toString()) : null);
    locationName = json['location_name'] ?? json['name'];
    address = json['address'];
    city = json['city'];
    state = json['state'];
    locationType = json['location_type'];
    meetingLink = json['meeting_link'];
    status = json['status'] == true || json['status'] == 1 || json['status'] == '1' || json['status'] == 'true';
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['id'] = id;
    data['business_id'] = businessId;
    data['location_name'] = locationName;
    data['address'] = address;
    data['city'] = city;
    data['state'] = state;
    data['location_type'] = locationType;
    data['meeting_link'] = meetingLink;
    data['status'] = status;
    return data;
  }
}
