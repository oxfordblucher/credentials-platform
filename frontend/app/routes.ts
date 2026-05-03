import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  layout('routes/_auth.tsx', [
    route('login', 'routes/_auth.login.tsx'),
    route('register', 'routes/_auth.register.tsx'),
  ]),
  layout('routes/_app.tsx', [
    route('dashboard', 'routes/_app.dashboard.tsx'),
  ]),
] satisfies RouteConfig;
