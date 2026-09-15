import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';

import '../theme.dart';

class PlanCalendar extends StatelessWidget {
  const PlanCalendar({
    super.key,
    required this.selected,
    required this.onSelected,
  });

  final DateTime selected;
  final ValueChanged<DateTime> onSelected;

  @override
  Widget build(BuildContext context) {
    final focused = selected;
    return TableCalendar(
      firstDay: DateTime.utc(2020, 1, 1),
      lastDay: DateTime.utc(2035, 12, 31),
      focusedDay: focused,
      selectedDayPredicate: (day) => isSameDay(day, selected),
      calendarFormat: CalendarFormat.month,
      startingDayOfWeek: StartingDayOfWeek.sunday,
      headerStyle: const HeaderStyle(formatButtonVisible: false, titleCentered: true),
      calendarStyle: CalendarStyle(
        selectedDecoration: const BoxDecoration(color: GymTheme.brand, shape: BoxShape.circle),
        todayDecoration: BoxDecoration(
          color: GymTheme.brand.withValues(alpha: 0.25),
          shape: BoxShape.circle,
        ),
      ),
      onDaySelected: (day, _) => onSelected(DateTime(day.year, day.month, day.day)),
    );
  }
}
