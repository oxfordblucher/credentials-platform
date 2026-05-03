import { redirect } from 'react-router';
import type { Route } from './+types/home';

export async function loader(_: Route.LoaderArgs) {
  return redirect('/login');
}

export default function Home() {
  return null;
}
