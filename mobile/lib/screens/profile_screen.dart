import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_controller.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.api, required this.auth});

  final ApiClient api;
  final AuthController auth;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? profile;
  List<dynamic> memberships = [];
  List<dynamic> payments = [];
  String? error;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final results = await Future.wait([
        widget.api.get('/member-app/me'),
        widget.api.get('/member-app/me/memberships'),
        widget.api.get('/member-app/me/payments'),
      ]);
      profile = Map<String, dynamic>.from(results[0] as Map);
      memberships = results[1] as List;
      payments = results[2] as List;
    } on ApiException catch (e) {
      error = e.message;
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            onPressed: () async {
              await widget.auth.logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
          ? Center(child: Text(error!))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(profile?['fullName'] ?? '', style: Theme.of(context).textTheme.headlineSmall),
                Text('${profile?['memberNumber'] ?? ''}'),
                const SizedBox(height: 8),
                Text(profile?['mobileNumber'] ?? ''),
                Text(profile?['email'] ?? ''),
                if (profile?['fitnessGoals'] != null) Text('Goals: ${profile!['fitnessGoals']}'),
                const SizedBox(height: 16),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Fitness assessments'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/assessments'),
                ),
                const Divider(),
                Text('Programs', style: Theme.of(context).textTheme.titleMedium),
                for (final raw in memberships)
                  Builder(
                    builder: (context) {
                      final m = Map<String, dynamic>.from(raw as Map);
                      final program = m['program'] as Map? ?? {};
                      final duration = m['programDuration'] as Map? ?? {};
                      final start = m['startDate'] != null ? DateFormat.yMMMd().format(DateTime.parse(m['startDate'] as String)) : '';
                      final end = m['endDate'] != null ? DateFormat.yMMMd().format(DateTime.parse(m['endDate'] as String)) : '';
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('${program['name'] ?? 'Program'} · ${m['status']}'),
                        subtitle: Text('${duration['label'] ?? ''} · $start – $end'),
                      );
                    },
                  ),
                const Divider(),
                Text('Payments', style: Theme.of(context).textTheme.titleMedium),
                for (final raw in payments)
                  Builder(
                    builder: (context) {
                      final p = Map<String, dynamic>.from(raw as Map);
                      final membership = p['membership'] as Map? ?? {};
                      final program = membership['program'] as Map? ?? {};
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('${program['name'] ?? 'Membership'} · ${p['status']}'),
                        subtitle: Text('Paid ${p['amountPaid'] ?? 0} / ${p['finalAmount'] ?? 0}'),
                      );
                    },
                  ),
              ],
            ),
    );
  }
}
