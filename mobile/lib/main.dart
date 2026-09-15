import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'api/api_client.dart';
import 'auth/auth_controller.dart';
import 'screens/app_shell.dart';
import 'screens/assessments_screen.dart';
import 'screens/diet_screen.dart';
import 'screens/exercise_detail_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/otp_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/training_screen.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient();
  final auth = AuthController(api);
  await auth.bootstrap();
  runApp(GymMemberApp(api: api, auth: auth));
}

class GymMemberApp extends StatelessWidget {
  GymMemberApp({super.key, required this.api, required this.auth});

  final ApiClient api;
  final AuthController auth;

  late final GoRouter _router = GoRouter(
    refreshListenable: auth,
    initialLocation: auth.member == null ? '/login' : '/',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/otp';
      if (auth.booting) return null;
      if (auth.member == null && !loggingIn) return '/login';
      if (auth.member != null && loggingIn) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginScreen(auth: auth),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) => OtpScreen(auth: auth),
      ),
      GoRoute(
        path: '/assessments',
        builder: (context, state) => AssessmentsScreen(api: api),
      ),
      GoRoute(
        path: '/training/exercise',
        builder: (context, state) {
          final extra = (state.extra as Map?)?.cast<String, dynamic>() ?? {};
          return ExerciseDetailScreen(exerciseSlot: extra);
        },
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (context, state) => HomeScreen(api: api, auth: auth)),
          GoRoute(path: '/training', builder: (context, state) => TrainingScreen(api: api)),
          GoRoute(path: '/diet', builder: (context, state) => DietScreen(api: api)),
          GoRoute(path: '/profile', builder: (context, state) => ProfileScreen(api: api, auth: auth)),
        ],
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'GymApp',
      theme: GymTheme.light(),
      routerConfig: _router,
    );
  }
}
