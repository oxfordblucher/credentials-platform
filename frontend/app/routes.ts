import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  layout('routes/_auth.tsx', [
    route('login', 'routes/_auth.login.tsx'),
    route('register', 'routes/_auth.register.tsx'),
    route('invite/:token', 'routes/_auth.invite.$token.tsx'),
  ]),
  layout('routes/_app.tsx', [
    route('dashboard', 'routes/_app.dashboard.tsx'),
    route('admin/credential-types', 'routes/_app.admin.credential-types.tsx'),
    route('admin/teams', 'routes/_app.admin.teams.tsx'),
    route('admin/teams/:teamId', 'routes/_app.admin.teams.$teamId.tsx'),
  ]),
] satisfies RouteConfig;
