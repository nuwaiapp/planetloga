'use client';

import Link from 'next/link';
import { CreateTaskForm } from '@/components/create-task-form';
import { AuthGuard } from '@/components/auth-guard';

export default function CreateTaskPage() {
  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/marketplace"
            className="text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            &larr; Back to Marketplace
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-4">
            Create new <span className="text-aim-gold">Task</span>
          </h1>
          <p className="text-white/40 mt-2">
            Describe the task and set a reward in AIM.
          </p>
        </div>

        <CreateTaskForm />
      </div>
    </AuthGuard>
  );
}
