import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MicroscopicApp());
}

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
        fontFamily: 'Roboto',
      ),
      home: const LoginPage(),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────

class AppConfig {
  static const String baseUrl = 'https://rajab-diagnostics.vercel.app';

  static const String loginEndpoint =
      '$baseUrl/api/auth/sign-in/email';

  static const String tokenKey = 'microscopic_session_token';
}

// ─────────────────────────────────────────────────────────────
// Secure Storage
// ─────────────────────────────────────────────────────────────

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
    return storage.read(
      key: AppConfig.tokenKey,
    );
  }

  static Future<void> clearToken() async {
    await storage.delete(
      key: AppConfig.tokenKey,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────

class AuthService {
  Future<String> login({
    required String username,
    required String password,
  }) async {
    final cleanUsername = username.trim().toLowerCase();

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
      Uri.parse(AppConfig.loginEndpoint),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    // Better Auth may return the token in the response header.
    final token =
        response.headers['set-auth-token'] ??
        response.headers['x-auth-token'];

    if (response.statusCode >= 200 &&
        response.statusCode < 300) {
      if (token != null && token.isNotEmpty) {
        await SessionStorage.saveToken(token);
      }

      return token ?? '';
    }

    String message = 'فشل تسجيل الدخول';

    try {
      final data = jsonDecode(response.body);

      if (data is Map<String, dynamic>) {
        message =
            data['message']?.toString() ??
            data['error']?.toString() ??
            message;
      }
    } catch (_) {
      // Ignore invalid JSON.
    }

    if (response.statusCode == 401) {
      message = 'اسم المستخدم أو كلمة المرور غير صحيحة';
    } else if (response.statusCode == 403) {
      message = 'غير مسموح بتسجيل الدخول بهذا الحساب';
    }

    throw Exception(message);
  }
}

// ─────────────────────────────────────────────────────────────
// Login Page
// ─────────────────────────────────────────────────────────────

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();

  final authService = AuthService();

  bool isLoading = false;
  bool obscurePassword = true;

  @override
  void dispose() {
    usernameController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> login() async {
    FocusScope.of(context).unfocus();

    setState(() {
      isLoading = true;
    });

    try {
      await authService.login(
        username: usernameController.text,
        password: passwordController.text,
      );

      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => const DashboardPage(),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      final message = e
          .toString()
          .replaceFirst('Exception: ', '');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message,
            textDirection: TextDirection.rtl,
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  maxWidth: 430,
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 20),

                    // Logo
                    Container(
                      width: 105,
                      height: 105,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F766E),
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            blurRadius: 25,
                            offset: const Offset(0, 10),
                            color:
                                Colors.black.withValues(alpha: 0.12),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.biotech_rounded,
                        color: Colors.white,
                        size: 58,
                      ),
                    ),

                    const SizedBox(height: 22),

                    const Text(
                      'Microscopic',
                      textDirection: TextDirection.ltr,
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F766E),
                        letterSpacing: 0.3,
                      ),
                    ),

                    const SizedBox(height: 6),

                    const Text(
                      'Medical Laboratory System',
                      textDirection: TextDirection.ltr,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.black54,
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                    const SizedBox(height: 40),

                    // Login Card
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            blurRadius: 30,
                            offset: const Offset(0, 12),
                            color:
                                Colors.black.withValues(alpha: 0.07),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'تسجيل الدخول',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),

                          const SizedBox(height: 8),

                          const Text(
                            'ادخل بيانات حساب المعمل للمتابعة',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.black54,
                              fontSize: 14,
                            ),
                          ),

                          const SizedBox(height: 28),

                          // Username
                          TextField(
                            controller: usernameController,
                            enabled: !isLoading,
                            textInputAction:
                                TextInputAction.next,
                            keyboardType:
                                TextInputType.text,
                            decoration: InputDecoration(
                              labelText: 'اسم المستخدم',
                              hintText: 'مثال: ahmed',
                              prefixIcon: const Icon(
                                Icons.person_outline_rounded,
                              ),
                              border: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(16),
                              ),
                              enabledBorder:
                                  OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(16),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              focusedBorder:
                                  OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(16),
                                borderSide:
                                    const BorderSide(
                                  color: Color(0xFF0F766E),
                                  width: 2,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 18),

                          // Password
                          TextField(
                            controller: passwordController,
                            enabled: !isLoading,
                            obscureText: obscurePassword,
                            textInputAction:
                                TextInputAction.done,
                            onSubmitted: (_) {
                              if (!isLoading) {
                                login();
                              }
                            },
                            decoration: InputDecoration(
                              labelText: 'كلمة المرور',
                              hintText: '••••••••',
                              prefixIcon: const Icon(
                                Icons.lock_outline_rounded,
                              ),
                              suffixIcon: IconButton(
                                onPressed: isLoading
                                    ? null
                                    : () {
                                        setState(() {
                                          obscurePassword =
                                              !obscurePassword;
                                        });
                                      },
                                icon: Icon(
                                  obscurePassword
                                      ? Icons
                                          .visibility_outlined
                                      : Icons
                                          .visibility_off_outlined,
                                ),
                              ),
                              border: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(16),
                              ),
                              enabledBorder:
                                  OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(16),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              focusedBorder:
                                  OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(16),
                                borderSide:
                                    const BorderSide(
                                  color: Color(0xFF0F766E),
                                  width: 2,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 26),

                          // Login Button
                          SizedBox(
                            height: 56,
                            child: FilledButton(
                              onPressed:
                                  isLoading ? null : login,
                              style: FilledButton.styleFrom(
                                backgroundColor:
                                    const Color(0xFF0F766E),
                                disabledBackgroundColor:
                                    const Color(0xFF94A3B8),
                                shape:
                                    RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(16),
                                ),
                              ),
                              child: isLoading
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child:
                                          CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.login_rounded,
                                        ),
                                        SizedBox(width: 10),
                                        Text(
                                          'دخول',
                                          style: TextStyle(
                                            fontSize: 17,
                                            fontWeight:
                                                FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    const Text(
                      'Microscopic • Rajab Diagnostics',
                      textDirection: TextDirection.ltr,
                      style: TextStyle(
                        color: Colors.black45,
                        fontSize: 12,
                      ),
                    ),

                    const SizedBox(height: 10),

                    const Text(
                      'نظام إدارة المعامل الطبية',
                      style: TextStyle(
                        color: Colors.black38,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Temporary Dashboard
// ─────────────────────────────────────────────────────────────

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  Future<void> logout(BuildContext context) async {
    await SessionStorage.clearToken();

    if (!context.mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => const LoginPage(),
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Microscopic',
            style: TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
          backgroundColor: const Color(0xFF0F766E),
          foregroundColor: Colors.white,
          actions: [
            IconButton(
              tooltip: 'تسجيل الخروج',
              onPressed: () => logout(context),
              icon: const Icon(Icons.logout_rounded),
            ),
          ],
        ),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F766E),
                  borderRadius:
                      BorderRadius.circular(24),
                ),
                child: const Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text(
                      'مرحبًا 👋',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'تم تسجيل الدخول بنجاح',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              Row(
                children: [
                  Expanded(
                    child: _DashboardCard(
                      icon: Icons.people_alt_outlined,
                      title: 'المرضى',
                      subtitle: 'إدارة المرضى',
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _DashboardCard(
                      icon: Icons.description_outlined,
                      title: 'التقارير',
                      subtitle: 'تقارير المعمل',
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              Row(
                children: [
                  Expanded(
                    child: _DashboardCard(
                      icon: Icons.add_chart_rounded,
                      title: 'تحليل جديد',
                      subtitle: 'إضافة تقرير',
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _DashboardCard(
                      icon: Icons.sync_rounded,
                      title: 'المزامنة',
                      subtitle: 'Offline / Online',
                    ),
                  ),
                ],
              ),

              const Spacer(),

              const Center(
                child: Text(
                  'النسخة الأولى • Microscopic',
                  style: TextStyle(
                    color: Colors.black38,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardCard extends StatelessWidget {
  const _DashboardCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 135,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            blurRadius: 16,
            offset: const Offset(0, 6),
            color: Colors.black.withValues(alpha: 0.05),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment:
            MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 34,
            color: const Color(0xFF0F766E),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              color: Colors.black45,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
