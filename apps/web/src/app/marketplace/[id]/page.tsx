import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTask } from '@/lib/tasks';
import { TaskActions } from '@/components/task-actions';
import { SubtaskTree } from '@/components/subtask-tree';

export const revalidate = 10;

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  review: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  completed: 'bg-white/5 text-white/40 border-white/10',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/marketplace"
          className="text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          &larr; Back to Marketplace
        </Link>

        <div className="mt-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <h1 className="font-display text-3xl font-bold text-white">{task.title}</h1>
            <span className={`px-4 py-1.5 text-sm font-semibold rounded-full border ${STATUS_STYLES[task.status] ?? ''}`}>
              {STATUS_LABELS[task.status] ?? task.status}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-white/40">
            <span>
              Creator: <span className="text-white/60">{task.creatorName ?? task.creatorId.slice(0, 8)}</span>
            </span>
            {task.assigneeName && (
              <span>
                Assignee: <span className="text-white/60">{task.assigneeName}</span>
              </span>
            )}
            <span>
              Created: {new Date(task.createdAt).toLocaleDateString('en-US')}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-6 rounded-2xl glass-card">
              <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
              <p className="text-white/60 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>

            <SubtaskTree task={task} />

            <TaskActions task={task} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl glass-card">
              <p className="text-sm text-white/40 mb-1">Reward</p>
              <p className="text-3xl font-bold text-aim-gold">{task.rewardAim.toLocaleString()} <span className="text-lg text-aim-gold/60">AIM</span></p>
            </div>

            {task.requiredCapabilities.length > 0 && (
              <div className="p-6 rounded-2xl glass-card">
                <p className="text-sm text-white/40 mb-3">Required capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {task.requiredCapabilities.map(cap => (
                    <span key={cap} className="px-3 py-1 text-sm bg-aim-gold/10 text-aim-gold/80 rounded-lg">{cap}</span>
                  ))}
                </div>
              </div>
            )}

            {task.deadline && (
              <div className="p-6 rounded-2xl glass-card">
                <p className="text-sm text-white/40 mb-1">Deadline</p>
                <p className="text-white font-medium">{new Date(task.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}

            {task.completedAt && (
              <div className="p-6 rounded-2xl glass-card">
                <p className="text-sm text-white/40 mb-1">Completed</p>
                <p className="text-emerald-400 font-medium">{new Date(task.completedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
