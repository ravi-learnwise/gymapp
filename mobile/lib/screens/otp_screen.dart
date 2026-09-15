import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key, required this.auth});

  final AuthController auth;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _code = TextEditingController();

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Enter OTP')),
      body: ListenableBuilder(
        listenable: widget.auth,
        builder: (context, _) {
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                if (widget.auth.error != null)
                  Text(widget.auth.error!, style: const TextStyle(color: Colors.red)),
                TextField(
                  controller: _code,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: '6-digit code'),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: widget.auth.busy
                      ? null
                      : () async {
                          final ok = await widget.auth.verifyOtp(_code.text.trim());
                          if (ok && context.mounted) context.go('/');
                        },
                  child: const Text('Verify'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
