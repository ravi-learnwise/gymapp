import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../widgets/plan_calendar.dart';
import '../widgets/trainer_empty.dart';
import 'training_screen.dart';

class DietScreen extends StatefulWidget {
  const DietScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<DietScreen> createState() => _DietScreenState();
}

class _DietScreenState extends State<DietScreen> {
  Map<String, dynamic>? plan;
  String? emptyMessage;
  bool loading = true;
  DateTime selected = DateTime.now();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      emptyMessage = null;
    });
    try {
      plan = Map<String, dynamic>.from(await widget.api.get('/member-app/me/diet') as Map);
    } on ApiException catch (e) {
      plan = null;
      emptyMessage = e.message;
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Map<String, dynamic>? get _day {
    final days = (plan?['days'] as List?) ?? [];
    final jsWeekday = selected.weekday == DateTime.sunday ? 0 : selected.weekday;
    for (final raw in days) {
      final day = Map<String, dynamic>.from(raw as Map);
      if (day['weekday'] == jsWeekday) return day;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Diet')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : plan == null
          ? TrainerEmptyMessage(message: emptyMessage ?? 'No diet plan is set for you yet.')
          : ListView(
              children: [
                PlanCalendar(selected: selected, onSelected: (d) => setState(() => selected = d)),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    '${plan?['name'] ?? 'Diet'} · ${weekdayLabels[selected.weekday == DateTime.sunday ? 0 : selected.weekday]}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                _dayBody(),
              ],
            ),
    );
  }

  Widget _dayBody() {
    final day = _day;
    if (day == null || day['dayType'] == 'NO_SPECIFIC_PLAN' || day['dayType'] == 'REST_RECOVERY') {
      return const TrainerEmptyMessage(message: 'No diet plan is set for this date.');
    }
    final meals = (day['meals'] as List?) ?? [];
    if (meals.isEmpty) {
      return const TrainerEmptyMessage(message: 'No meals are listed for this date.');
    }
    return Column(
      children: [
        for (final raw in meals) _MealCard(meal: Map<String, dynamic>.from(raw as Map)),
      ],
    );
  }
}

class _MealCard extends StatelessWidget {
  const _MealCard({required this.meal});

  final Map<String, dynamic> meal;

  @override
  Widget build(BuildContext context) {
    final foods = (meal['foods'] as List?) ?? [];
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              (meal['title'] as String?)?.isNotEmpty == true
                  ? meal['title'] as String
                  : (meal['mealType'] as String? ?? 'Meal').replaceAll('_', ' '),
              style: Theme.of(context).textTheme.titleSmall,
            ),
            if (meal['approximateTime'] != null) Text(meal['approximateTime'] as String),
            const SizedBox(height: 8),
            for (final foodRaw in foods)
              Builder(
                builder: (context) {
                  final food = Map<String, dynamic>.from(foodRaw as Map);
                  final qty = [food['quantity'], food['unit']].where((e) => e != null && '$e'.isNotEmpty).join(' ');
                  final alts = (food['alternatives'] as List?) ?? [];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      '• ${food['foodName'] ?? 'Food'}${qty.isEmpty ? '' : ' ($qty)'}'
                      '${alts.isEmpty ? '' : '\n  Alt: ${alts.map((a) => (a as Map)['alternativeFoodName']).join(', ')}'}',
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
