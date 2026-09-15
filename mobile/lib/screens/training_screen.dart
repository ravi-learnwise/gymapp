import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../config.dart';
import '../widgets/plan_calendar.dart';
import '../widgets/trainer_empty.dart';

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class TrainingScreen extends StatefulWidget {
  const TrainingScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<TrainingScreen> createState() => _TrainingScreenState();
}

class _TrainingScreenState extends State<TrainingScreen> {
  Map<String, dynamic>? card;
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
      card = Map<String, dynamic>.from(await widget.api.get('/member-app/me/training') as Map);
    } on ApiException catch (e) {
      card = null;
      emptyMessage = e.message;
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Map<String, dynamic>? get _day {
    final days = (card?['days'] as List?) ?? [];
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
      appBar: AppBar(title: const Text('Training')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : card == null
          ? TrainerEmptyMessage(message: emptyMessage ?? 'No training plan is set for you yet.')
          : ListView(
              children: [
                PlanCalendar(selected: selected, onSelected: (d) => setState(() => selected = d)),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    '${card?['name'] ?? 'Training'} · ${weekdayLabels[selected.weekday == DateTime.sunday ? 0 : selected.weekday]}',
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
    if (day == null || day['dayType'] == 'NOT_ASSIGNED') {
      return const TrainerEmptyMessage(message: 'No workout is set for this date.');
    }
    if (day['dayType'] == 'REST' || day['dayType'] == 'RECOVERY') {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Text('Rest / recovery day. Recover well.'),
      );
    }
    final exercises = (day['exercises'] as List?) ?? [];
    if (exercises.isEmpty) {
      return const TrainerEmptyMessage(message: 'No exercises are listed for this date.');
    }
    return Column(
      children: [
        for (final raw in exercises)
          _ExerciseTile(exerciseSlot: Map<String, dynamic>.from(raw as Map)),
      ],
    );
  }
}

class _ExerciseTile extends StatelessWidget {
  const _ExerciseTile({required this.exerciseSlot});

  final Map<String, dynamic> exerciseSlot;

  @override
  Widget build(BuildContext context) {
    final exercise = Map<String, dynamic>.from((exerciseSlot['exercise'] as Map?) ?? {});
    final name = exercise['name'] as String? ?? 'Exercise';
    final image = AppConfig.mediaUrl(exercise['imageUrl'] as String?);
    final sets = (exerciseSlot['sets'] as List?) ?? [];
    return ListTile(
      leading: image.isEmpty
          ? const CircleAvatar(child: Icon(Icons.fitness_center))
          : ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(image, width: 48, height: 48, fit: BoxFit.cover, errorBuilder: (_, _, _) => const Icon(Icons.fitness_center)),
            ),
      title: Text(name),
      subtitle: Text('${sets.length} sets${exerciseSlot['sectionName'] != null ? ' · ${exerciseSlot['sectionName']}' : ''}'),
      onTap: () => context.push('/training/exercise', extra: exerciseSlot),
    );
  }
}
