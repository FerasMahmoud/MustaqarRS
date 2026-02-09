import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect root URL to default locale (English)
  redirect('/en');
}
