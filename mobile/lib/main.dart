import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MicroscopicApp());
}

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════

class MicroscopicApp extends StatelessWidget {
  const MicroscopicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Microscopic',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F766E),
        ),
        scaffoldBackgroundColor: const Color(0xFFF5FAF9),
      ),
      home: const LoginPage(),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

class AppConfig {
  static const String baseUrl =
      'https://rajab-diagnostics.vercel.app';

  static const String loginUrl =
      '$baseUrl/api/auth/sign-in/email';

  static const String meUrl =
      '$baseUrl/api/mobile/me';

  static const String tokenKey =
      'microscopic_session_token';
}

// ═══════════════════════════════════════════════════════════════
// SECURE STORAGE
// ═══════════════════════════════════════════════════════════════

class SessionStorage {
  static const FlutterSecureStorage storage =
      FlutterSecureStorage();

  static Future<void> saveToken(String token) async {
    await storage.write(
      key: AppConfig.tokenKey,
      value: token,
    );
  }

  static Future<String?> getToken() async {
    return await storage.read(
      key: AppConfig.tokenKey,
    );
  }

  static Future<void> clearToken() async {
    await storage.delete(
      key: AppConfig.tokenKey,
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// USER / LAB DATA
// ═══════════════════════════════════════════════════════════════

class LabData {
  final String id;
  final String name;
  final String? phone;
  final String? whatsapp;
  final String? email;
  final String? website;
  final String? address;
  final String? doctorName;
  final String? doctorDegree;
  final String? doctorSpecialty;

  const LabData({
    required this.id,
    required this.name,
    this.phone,
    this.whatsapp,
    this.email,
    this.website,
    this.address,
    this.doctorName,
    this.doctorDegree,
    this.doctorSpecialty,
  });

  factory LabData.fromJson(Map<String, dynamic> json) {
    return LabData(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'المعمل',
      phone: json['phone']?.toString(),
      whatsapp: json['whatsapp']?.toString(),
      email: json['email']?.toString(),
      website: json['website']?.toString(),
      address: json['address']?.toString(),
      doctorName: json['doctorName']?.toString(),
      doctorDegree: json['doctorDegree']?.toString(),
      doctorSpecialty: json['doctorSpecialty']?.toString(),
    );
  }
}

class DashboardStats {
  final int patients;
  final int reportsToday;
  final int pendingReview;
  final int approved;
  final int critical;

  const DashboardStats({
    this.patients = 0,
    this.reportsToday = 0,
    this.pendingReview = 0,
    this.approved = 0,
    this.critical = 0,
  });

  factory DashboardStats.fromJson(
    Map<String, dynamic> json,
  ) {
    int number(dynamic value) {
      if (value is int) return value;
      return int.tryParse(value?.toString() ?? '') ?? 0;
    }

    return DashboardStats(
      patients: number(json['patients']),
      reportsToday: number(json['reportsToday']),
      pendingReview: number(json['pendingReview']),
      approved: number(json['approved']),
      critical: number(json['critical']),
    );
  }
}

class CurrentUser {
  final String userId;
  final String type;
  final String? username;
  final String? role;
  final String? labId;
  final String? labName;
  final String? name;
  final String? email;
  final LabData? lab;
  final DashboardStats stats;

  const CurrentUser({
    required this.userId,
    required this.type,
    this.username,
    this.role,
    this.labId,
    this.labName,
    this.name,
    this.email,
    this.lab,
    this.stats = const DashboardStats(),
  });

  factory CurrentUser.fromJson(
    Map<String, dynamic> json,
  ) {
    final access =
        Map<String, dynamic>.from(
      json['access'] ?? {},
    );

    final labJson = json['lab'];

    final statsJson =
        Map<String, dynamic>.from(
      json['stats'] ?? {},
    );

    return CurrentUser(
      userId: access['userId']?.toString() ?? '',
      type: access['type']?.toString() ?? '',
      username: access['username']?.toString(),
      role: access['role']?.toString(),
      labId: access['labId']?.toString(),
      labName: access['labName']?.toString(),
      name: access['name']?.toString(),
      email: access['email']?.toString(),
      lab: labJson is Map
          ? LabData.fromJson(
              Map<String, dynamic>.from(labJson),
            )
          : null,
      stats: DashboardStats.fromJson(statsJson),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// API SERVICE
// ═══════════════════════════════════════════════════════════════

class ApiService {
  Future<String> login({
    required String username,
    required String password,
  }) async {
    final cleanUsername =
        username.trim().toLowerCase();

    if (cleanUsername.isEmpty) {
      throw Exception('اكتب اسم المستخدم');
    }

    if (password.isEmpty) {
      throw Exception('اكتب كلمة المرور');
    }

    final email = cleanUsername.contains('@')
        ? cleanUsername
        : '$cleanUsername@lab.local';

    final response = await http.post(
      Uri.parse(AppConfig.loginUrl),
      headers: const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode >= 200 &&
        response.statusCode < 300) {
      final token =
          response.headers['set-auth-token'];

      if (token == null || token.isEmpty) {
        throw Exception(
          'تم تسجيل الدخول ولكن لم يتم است
