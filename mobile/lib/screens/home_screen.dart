import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_controller.dart';
import '../widgets/trainer_empty.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.api, required this.auth});

  final ApiClient api;
  final AuthController auth;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? dashboard;
  String? error;
  bool loading = true;
  bool attendanceBusy = false;

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
      dashboard = Map<String, dynamic>.from(await widget.api.get('/member-app/me/dashboard') as Map);
    } on ApiException catch (e) {
      error = e.message;
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _checkIn() async {
    setState(() => attendanceBusy = true);
    try {
      await widget.api.post('/member-app/me/attendance/check-in');
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => attendanceBusy = false);
    }
  }

  Future<void> _checkOut() async {
    setState(() => attendanceBusy = true);
    try {
      await widget.api.patch('/member-app/me/attendance/check-out');
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => attendanceBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.auth.member?['fullName'] ?? dashboard?['member']?['fullName'] ?? 'Member';
    return Scaffold(
      appBar: AppBar(title: Text('Hi, $name')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
          ? Center(child: Text(error!))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _attendanceCard(),
                  const SizedBox(height: 12),
                  _planCard(
                    title: "Today's training",
                    body: _trainingSummary(),
                  ),
                  const SizedBox(height: 12),
                  _planCard(
                    title: "Today's diet",
                    body: _dietSummary(),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _attendanceCard() {
    final enabled = dashboard?['attendanceEnabled'] == true;
    if (!enabled) return const SizedBox.shrink();
    final open = dashboard?['openAttendance'];
    final checkedIn = open != null;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(checkedIn ? "You're checked in" : 'Gym attendance', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: attendanceBusy ? null : (checkedIn ? _checkOut : _checkIn),
              child: Text(checkedIn ? 'Check out' : 'Check in'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _planCard({required String title, required Widget body}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            body,
          ],
        ),
      ),
    );
  }

  Widget _trainingSummary() {
    final training = dashboard?['training'];
    if (training == null) {
      return const TrainerEmptyMessage(message: 'No training plan is set for you yet.');
    }
    final day = training['day'] as Map<String, dynamic>?;
    if (day == null || day['dayType'] == 'NOT_ASSIGNED' || day['dayType'] == 'REST' || day['dayType'] == 'RECOVERY') {
      return Text(day?['dayType'] == 'REST' || day?['dayType'] == 'RECOVERY'
          ? 'Rest / recovery day. Recover well.'
          : 'No workout is assigned for today. Please get in touch with your trainer.');
    }
    final exercises = (day['exercises'] as List?) ?? [];
    return Text('${training['name'] ?? 'Training'}\n${exercises.length} exercises today');
  }

  Widget _dietSummary() {
    final diet = dashboard?['diet'];
    if (diet == null) {
      return const TrainerEmptyMessage(message: 'No diet plan is set for you yet.');
    }
    final day = diet['day'] as Map<String, dynamic>?;
    if (day == null || day['dayType'] == 'NO_SPECIFIC_PLAN' || day['dayType'] == 'REST_RECOVERY') {
      return const Text('No specific diet for today. Please get in touch with your trainer if you expected a plan.');
    }
    final meals = (day['meals'] as List?) ?? [];
    return Text('${diet['name'] ?? 'Diet'}\n${meals.length} meals today');
  }
}
