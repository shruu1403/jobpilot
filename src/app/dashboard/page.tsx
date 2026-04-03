'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Dashboard 🚀</h1>


    </div>
  );
}