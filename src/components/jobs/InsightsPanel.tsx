import { useJobStore } from '@/store/useJobStore';
import { Target, TrendingUp, Award, Slash } from 'lucide-react';

export function InsightsPanel() {
  const { jobs } = useJobStore();

  const total = jobs.length;
  const applied = jobs.filter(j => j.status === 'Applied').length;
  const interviews = jobs.filter(j => j.status === 'Interview').length;
  const offers = jobs.filter(j => j.status === 'Offer').length;
  const rejected = jobs.filter(j => j.status === 'Rejected').length;

  const getRate = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0;

  const stats = [
    {
      label: 'TOTAL APPLICATIONS',
      value: total,
      subValue: `${applied} waiting`,
      icon: Target,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10'
    },
    {
      label: 'INTERVIEWS',
      value: interviews,
      subValue: `${getRate(interviews)}% rate`,
      icon: TrendingUp,
      color: 'text-[#4ADE80]',
      bgColor: 'bg-[#4ADE80]/10'
    },
    {
      label: 'OFFERS',
      value: offers,
      subValue: `${getRate(offers)}% rate`,
      icon: Award,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      label: 'REJECTIONS',
      value: rejected,
      subValue: `${getRate(rejected)}% rate`,
      icon: Slash,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-[#1E2538] border border-gray-700/50 rounded-xl p-4 flex items-center justify-between hover:border-accent-blue/30 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-xs font-medium text-gray-500">{stat.subValue}</span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
