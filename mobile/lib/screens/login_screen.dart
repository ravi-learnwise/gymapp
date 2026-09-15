import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.auth});

  final AuthController auth;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = widget.auth;
    return Scaffold(
      body: SafeArea(
        child: ListenableBuilder(
          listenable: auth,
          builder: (context, _) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const SizedBox(height: 32),
                Text('GymApp', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Sign in with the Gmail or mobile number on your gym profile.'),
                const SizedBox(height: 32),
                if (auth.error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(auth.error!, style: const TextStyle(color: Colors.red)),
                  ),
                FilledButton.icon(
                  onPressed: auth.busy
                      ? null
                      : () async {
                          final ok = await auth.signInWithGoogle();
                          if (ok && context.mounted) context.go('/');
                        },
                  icon: const Icon(Icons.g_mobiledata),
                  label: const Text('Continue with Google'),
                ),
                const SizedBox(height: 24),
                const Text('Or continue with phone OTP'),
                const SizedBox(height: 8),
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Mobile number',
                    hintText: '10-digit Indian number',
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: auth.busy
                      ? null
                      : () async {
                          final raw = _phone.text.replaceAll(RegExp(r'\D'), '');
                          if (raw.length < 10) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Enter a valid mobile number')),
                            );
                            return;
                          }
                          final ok = await auth.sendOtp(raw.substring(raw.length - 10));
                          if (!context.mounted) return;
                          if (auth.member != null) {
                            context.go('/');
                          } else if (ok && auth.pendingVerificationId != null) {
                            context.push('/otp');
                          }
                        },
                  child: const Text('Send OTP'),
                ),
                if (auth.busy) const Padding(padding: EdgeInsets.only(top: 24), child: Center(child: CircularProgressIndicator())),
              ],
            );
          },
        ),
      ),
    );
  }
}
