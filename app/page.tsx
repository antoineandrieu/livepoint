import { Map } from '@/components/map';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <Map />
    </main>
  );
}