import 'package:flutter/material.dart';

import '../config.dart';

class ExerciseDetailScreen extends StatelessWidget {
  const ExerciseDetailScreen({super.key, required this.exerciseSlot});

  final Map<String, dynamic> exerciseSlot;

  @override
  Widget build(BuildContext context) {
    final exercise = Map<String, dynamic>.from((exerciseSlot['exercise'] as Map?) ?? {});
    final image = AppConfig.mediaUrl(exercise['imageUrl'] as String?);
    final sets = (exerciseSlot['sets'] as List?) ?? [];
    return Scaffold(
      appBar: AppBar(title: Text(exercise['name'] as String? ?? 'Exercise')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (image.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(image, fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox.shrink()),
            )
          else
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: Text('No illustration available')),
            ),
          const SizedBox(height: 16),
          if (exercise['bodyPart'] != null) Text('Body part: ${exercise['bodyPart']}'),
          if (exercise['equipment'] != null) Text('Equipment: ${exercise['equipment']}'),
          if (exercise['primaryMuscle'] != null) Text('Primary: ${exercise['primaryMuscle']}'),
          const SizedBox(height: 12),
          Text('Sets', style: Theme.of(context).textTheme.titleMedium),
          for (final raw in sets)
            Builder(
              builder: (context) {
                final set = Map<String, dynamic>.from(raw as Map);
                final reps = set['repMax'] != null && set['repMax'] != set['repMin']
                    ? '${set['repMin']}-${set['repMax']}'
                    : '${set['repMin'] ?? '-'}';
                final weight = set['weight'] != null ? ' · ${set['weight']} ${set['weightUnit'] ?? ''}' : '';
                return ListTile(
                  dense: true,
                  title: Text('Set ${set['setNumber']}: $reps reps$weight'),
                  subtitle: set['notes'] != null ? Text('${set['notes']}') : null,
                );
              },
            ),
          if (exercise['technique'] != null) ...[
            const SizedBox(height: 12),
            Text('Technique', style: Theme.of(context).textTheme.titleMedium),
            Text('${exercise['technique']}'),
          ],
          if (exercise['safetyNotes'] != null) ...[
            const SizedBox(height: 12),
            Text('Safety', style: Theme.of(context).textTheme.titleMedium),
            Text('${exercise['safetyNotes']}'),
          ],
        ],
      ),
    );
  }
}
