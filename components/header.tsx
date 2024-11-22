import { Map } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow dark:bg-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          <Map className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Midpoint Finder</h1>
        </div>
      </div>
    </header>
  );
}