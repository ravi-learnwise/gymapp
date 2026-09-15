import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';

class AssessmentsScreen extends StatefulWidget {
  const AssessmentsScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<AssessmentsScreen> createState() => _AssessmentsScreenState();
}

class _AssessmentsScreenState extends State<AssessmentsScreen> {
  List<dynamic> items = [];
  String? error;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      items = await widget.api.get('/member-app/me/assessments') as List;
    } on ApiException catch (e) {
      error = e.message;
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fitness assessments')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
          ? Center(child: Text(error!))
          : items.isEmpty
          ? const Center(child: Text('No assessments recorded yet.'))
          : ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, i) {
                final a = Map<String, dynamic>.from(items[i] as Map);
                final when = a['assessedAt'] != null
                    ? DateFormat.yMMMd().format(DateTime.parse(a['assessedAt'] as String))
                    : '';
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(when, style: Theme.of(context).textTheme.titleSmall),
                        if (a['weight'] != null) Text('Weight: ${a['weight']} kg'),
                        if (a['height'] != null) Text('Height: ${a['height']} cm'),
                        if (a['bmi'] != null) Text('BMI: ${a['bmi']}'),
                        if (a['bodyFat'] != null) Text('Body fat: ${a['bodyFat']}'),
                        if (a['waist'] != null) Text('Waist: ${a['waist']}'),
                        if (a['fitnessGoals'] != null) Text('Goals: ${a['fitnessGoals']}'),
                        if (a['notes'] != null) Text('${a['notes']}'),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
