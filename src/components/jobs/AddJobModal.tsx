import { useState, useEffect } from 'react';
import { useJobStore } from '@/store/useJobStore';
import { X, Sparkles, FileText, Pickaxe, Wand2, Loader2, Calendar, ChevronDown, Minus, Plus } from 'lucide-react';
import { Job, JobStatus } from '@/types/job';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { Analysis } from '@/types/analysis';
import { toast } from "@/lib/toast";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'jd' | 'analyzer' | 'manual';

type SalaryPeriod = 'annum' | 'month';

const ANNUAL_SALARY_OPTIONS = Array.from({ length: 50 }, (_, index) => `${index + 1}`);
const MONTHLY_SALARY_OPTIONS = Array.from({ length: 100 }, (_, index) => `${(index + 1)}`);

const getSalaryOptions = (period: SalaryPeriod) =>
  period === 'annum' ? ANNUAL_SALARY_OPTIONS : MONTHLY_SALARY_OPTIONS;

const sanitizeSalaryInput = (value: string) => {
  const sanitized = value.replace(/[^0-9.]/g, '');
  const [whole = '', ...decimals] = sanitized.split('.');

  if (decimals.length === 0) {
    return sanitized;
  }

  return `${whole}.${decimals.join('')}`;
};

const formatSalaryRange = (min: string, max: string, period: SalaryPeriod) => {
  const suffix = period === 'annum' ? 'LPA' : 'k';
  if (!min && !max) return '';
  if (min && !max) return `₹ ${min} ${suffix}+`;
  if (!min && max) return `Up to ₹ ${max} ${suffix}`;
  return `₹ ${min} ${suffix} - ₹ ${max} ${suffix}`;
};

const getSalaryStepValue = (value: string, direction: 'increase' | 'decrease', period: SalaryPeriod) => {
  const options = getSalaryOptions(period);

  if (!value) {
    return direction === 'increase' ? options[0] : '';
  }

  const currentIndex = options.indexOf(value);
  if (currentIndex === -1) {
    return options[0];
  }

  if (direction === 'increase') {
    return options[Math.min(currentIndex + 1, options.length - 1)];
  }

  return currentIndex === 0 ? '' : options[currentIndex - 1];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export function AddJobModal({ isOpen, onClose }: AddJobModalProps) {
  const { addJob } = useJobStore();
  const [activeTab, setActiveTab] = useState<TabType>('jd');

  // Form State
  const [jdInput, setJdInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Analyzer State
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [analyzerConnected, setAnalyzerConnected] = useState(false);

  // Job preview state (populated after extraction or in manual)
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>('annum');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [offerProgress, setOfferProgress] = useState(0);
  const [offerDeadline, setOfferDeadline] = useState('');
  const [jobType, setJobType] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('jd');
      setJdInput('');
      setTitle('');
      setCompany('');
      setStatus('Applied');
      setTags('');
      setNotes('');
      setSalaryPeriod('annum');
      setSalaryMin('');
      setSalaryMax('');
      setInterviewStatus('');
      setInterviewTime('');
      setOfferProgress(0);
      setOfferDeadline('');
      setJobType('');
      setIsExtracting(false);
    }
  }, [isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSalaryMinChange = (nextMin: string) => {
    setSalaryMin(nextMin);
    if (nextMin && salaryMax && Number(nextMin) > Number(salaryMax)) {
      setSalaryMax(nextMin);
    }
  };

  const handleSalaryMaxChange = (nextMax: string) => {
    setSalaryMax(nextMax);
    if (nextMax && salaryMin && Number(nextMax) < Number(salaryMin)) {
      setSalaryMin(nextMax);
    }
  };

  const handleSalaryMinInput = (value: string) => {
    handleSalaryMinChange(sanitizeSalaryInput(value));
  };

  const handleSalaryMaxInput = (value: string) => {
    handleSalaryMaxChange(sanitizeSalaryInput(value));
  };

  const handleSalaryPeriodChange = (period: SalaryPeriod) => {
    setSalaryPeriod(period);
    setSalaryMin('');
    setSalaryMax('');
  };

  const handleExtractJD = async () => {
    setIsExtracting(true);
    let textToParse = jdInput;
    
    // URL parsing logic
    const isUrl = /^https?:\/\//i.test(jdInput.trim());
    if (isUrl) {
      try {
        const res = await fetch("/api/fetch-jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: jdInput.trim() }),
        });
        
        const data = await res.json();
        if (res.ok && data.text) {
          textToParse = data.text;
          toast.success("Job details extracted from URL!");
        } else {
          throw new Error(data.error || "Failed to fetch JD from URL");
        }
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, 'Failed to fetch JD from URL'));
        setIsExtracting(false);
        return;
      }
    }

    // Simulate parsing formatting delay
    setTimeout(() => {
      const extractJobTitle = (jd: string) => {
        const lines = jd.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines.slice(0, 8)) {
          const titleMatch = line.match(/^(?:job\s*title|role|position)\s*[:\-\u2013]\s*(.+)/i);
          if (titleMatch) return titleMatch[1].trim().slice(0, 100);
        }
        const shortLine = lines.find((l) => l.length > 3 && l.length < 60);
        return shortLine?.slice(0, 80) || jd.slice(0, 30) || 'Untitled Role';
      };

      const extractCompany = (jd: string) => {
        const lines = jd.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines.slice(0, 15)) {
          const compMatch = line.match(/^(?:company|organization|employer|about)\s*[:\-\u2013]\s*(.+)/i);
          if (compMatch) return compMatch[1].trim().slice(0, 100);
        }
        return '';
      };

      const extractTags = (jd: string) => {
        const t = [];
        const low = jd.toLowerCase();
        if (low.includes('remote')) setJobType('Remote');
        else if (low.includes('hybrid')) setJobType('Hybrid');
        else if (low.includes('on-site') || low.includes('onsite')) setJobType('On-site');
        
        if (low.includes('full-time') || low.includes('full time')) t.push('Full-time');
        if (low.includes('contract')) t.push('Contract');
        return t.join(', ');
      };
      
      const titleHit = extractJobTitle(textToParse);
      setTitle(titleHit);
      setCompany(extractCompany(textToParse) || 'Unknown Company');
      setTags(extractTags(textToParse));
      
      // Save top bit of JD into notes for reference
      setNotes('');

      setIsExtracting(false);
      setActiveTab('manual'); // Move to manual tab to show preview
    }, 1000);
  };

  const handleConnectAnalyzer = async () => {
    setLoadingAnalyses(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to access history");
        return;
      }
      
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      
      setAnalyses(data || []);
      setAnalyzerConnected(true);
      toast.success("Analyzer connected successfully");
    } catch (err: unknown) {
      toast.error(`Failed to load analyzer history: ${getErrorMessage(err, 'Unknown error')}`);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleSelectAnalysis = (analysis: Analysis) => {
    setTitle(analysis.job_title || '');
    setCompany(analysis.company || '');
    setTags(`Match Score: ${analysis.match_score}%`);
    setNotes(analysis.reason || '');
    setActiveTab('manual');
  };

  const handleSave = () => {
    if (!title || !company) return;

    const finalTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (jobType && !finalTags.includes(jobType)) finalTags.unshift(jobType);
    const salary = formatSalaryRange(salaryMin, salaryMax, salaryPeriod);

    const newJob: Job = {
      id: crypto.randomUUID(),
      title,
      company,
      status,
      tags: finalTags,
      salary: salary || undefined,
      appliedDate: format(new Date(), 'MMM dd').toUpperCase(),
      notes,
      source: activeTab === 'manual' && jdInput === '' ? 'manual' : 'jd',
      interviewStatus: interviewStatus || undefined,
      interviewTime: interviewTime || undefined,
      offerProgress: offerProgress > 0 ? offerProgress : undefined,
      offerDeadline: offerDeadline || undefined,
    };

    addJob(newJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#151B2B] rounded-2xl w-full max-w-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Add Job Application
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('jd')}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'jd' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Sparkles size={16} /> Auto-Extract (AI)
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'analyzer' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <FileText size={16} /> From Analyzer
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'manual' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Pickaxe size={16} /> Manual Entry
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'jd' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Paste Job Description or URL
              </label>
              <textarea
                value={jdInput}
                onChange={(e) => setJdInput(e.target.value)}
                placeholder="Paste the full JD text here, or a URL"
                className="w-full h-40 bg-[#1E2538] border border-gray-700/50 rounded-xl p-4 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 resize-none transition-all"
              />
              <button
                onClick={handleExtractJD}
                disabled={!jdInput || isExtracting}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isExtracting ? (
                  <span className="flex items-center gap-2">
                    <Wand2 className="animate-spin text-accent-blue" size={18} /> Extracting...
                  </span>
                ) : (
                  <>
                    <Sparkles className="text-accent-blue group-hover:scale-110 transition-transform" size={18} /> 
                    Extract Details
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                We will parse the JD and pre-fill the form for you.
              </p>
            </div>
          )}

          {activeTab === 'analyzer' && (
            <div className="flex flex-col h-full">
              {!analyzerConnected ? (
                <div className="py-12 text-center border-2 border-dashed border-gray-700/50 rounded-xl">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-white font-bold mb-1">Analyzer Integration</h3>
                  <p className="text-gray-500 text-sm max-w-[250px] mx-auto">
                    Select from jobs you&apos;ve recently analyzed to add them directly to your tracker.
                  </p>
                  <button 
                    onClick={handleConnectAnalyzer}
                    disabled={loadingAnalyses}
                    className="mt-4 px-6 py-2.5 bg-accent-blue hover:bg-[#8B7FF9] text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(108,99,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                  >
                    {loadingAnalyses ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Connect Analyzer
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-400 mb-4 px-1 uppercase tracking-widest">Select Analyzed Job</h3>
                  {analyses.length === 0 ? (
                    <div className="text-center py-10 border border-gray-800 rounded-xl bg-white/5">
                      <p className="text-gray-400 text-sm">No analysis history found.</p>
                      <button 
                         onClick={() => setActiveTab('jd')}
                         className="text-accent-blue text-sm mt-2 hover:underline"
                      >
                        Try adding a job description instead
                      </button>
                    </div>
                  ) : (
                    analyses.map((analysis) => (
                      <div 
                        key={analysis.id}
                        onClick={() => handleSelectAnalysis(analysis)}
                        className="bg-[#1E2538] border border-gray-700/50 rounded-xl p-4 hover:border-accent-blue/50 cursor-pointer transition-all group flex items-start gap-4"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 border border-gray-700 text-white font-bold text-lg group-hover:scale-105 transition-transform">
                          {analysis.company ? analysis.company.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-[15px] truncate leading-tight group-hover:text-accent-blue transition-colors">
                            {analysis.job_title}
                          </h4>
                          <p className="text-gray-400 text-xs truncate mt-0.5">{analysis.company || 'Unknown Company'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              analysis.match_score >= 70 ? 'bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20' : 
                              analysis.match_score >= 50 ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' : 
                              'bg-red-400/10 text-red-400 border border-red-400/20'
                            }`}>
                              {analysis.match_score}% Match
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                              <Calendar size={10} />
                              {format(new Date(analysis.created_at), 'MMM dd')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Job Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as JobStatus)}
                      className="w-full bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50 appearance-none pr-10"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Job Type</label>
                  <div className="relative">
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50 appearance-none pr-10"
                    >
                      <option value="">Select Type</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. Full-time, Urgent"
                    className="w-full bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Salary Estimate</label>
                  <div className="rounded-xl border border-gray-700/50 bg-[#1E2538] p-3">
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSalaryPeriodChange('annum')}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                          salaryPeriod === 'annum'
                            ? 'border-accent-blue/50 bg-accent-blue/15 text-accent-blue'
                            : 'border-gray-700/60 bg-[#151B2B] text-gray-400 hover:text-white'
                        }`}
                      >
                        Per Annum
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSalaryPeriodChange('month')}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                          salaryPeriod === 'month'
                            ? 'border-accent-blue/50 bg-accent-blue/15 text-accent-blue'
                            : 'border-gray-700/60 bg-[#151B2B] text-gray-400 hover:text-white'
                        }`}
                      >
                        Per Month
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Minimum</p>
                        <div className="flex overflow-hidden rounded-xl border border-gray-700/60 bg-[#151B2B]">
                          <button
                            type="button"
                            onClick={() => handleSalaryMinChange(getSalaryStepValue(salaryMin, 'decrease', salaryPeriod))}
                            disabled={!salaryMin}
                            className="flex h-11 w-12 items-center justify-center border-r border-gray-700/60 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={16} />
                          </button>
                          <div className="flex flex-1 items-center justify-center gap-1 px-3 text-sm font-semibold text-white">
                            <span className="text-gray-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={salaryMin}
                              onChange={(e) => handleSalaryMinInput(e.target.value)}
                              placeholder="--"
                              className="w-full min-w-0 bg-transparent text-center text-sm font-semibold text-white outline-none placeholder:text-gray-500"
                            />
                            <span className="text-gray-400">{salaryPeriod === 'annum' ? 'LPA' : 'k'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSalaryMinChange(getSalaryStepValue(salaryMin, 'increase', salaryPeriod))}
                            disabled={salaryMin === getSalaryOptions(salaryPeriod)[getSalaryOptions(salaryPeriod).length - 1]}
                            className="flex h-11 w-12 items-center justify-center border-l border-gray-700/60 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Maximum</p>
                        <div className="flex overflow-hidden rounded-xl border border-gray-700/60 bg-[#151B2B]">
                          <button
                            type="button"
                            onClick={() => handleSalaryMaxChange(getSalaryStepValue(salaryMax, 'decrease', salaryPeriod))}
                            disabled={!salaryMax}
                            className="flex h-11 w-12 items-center justify-center border-r border-gray-700/60 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={16} />
                          </button>
                          <div className="flex flex-1 items-center justify-center gap-1 px-3 text-sm font-semibold text-white">
                            <span className="text-gray-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={salaryMax}
                              onChange={(e) => handleSalaryMaxInput(e.target.value)}
                              placeholder="--"
                              className="w-full min-w-0 bg-transparent text-center text-sm font-semibold text-white outline-none placeholder:text-gray-500"
                            />
                            <span className="text-gray-400">{salaryPeriod === 'annum' ? 'LPA' : 'k'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSalaryMaxChange(getSalaryStepValue(salaryMax, 'increase', salaryPeriod))}
                            disabled={salaryMax === getSalaryOptions(salaryPeriod)[getSalaryOptions(salaryPeriod).length - 1]}
                            className="flex h-11 w-12 items-center justify-center border-l border-gray-700/60 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Saved as {formatSalaryRange(salaryMin, salaryMax, salaryPeriod) || '₹ range not selected yet'}
                    </p>
                  </div>
                </div>
              </div>

              {(status === 'Applied' || status === 'Interview') && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Interview Details</label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={interviewStatus}
                      onChange={(e) => setInterviewStatus(e.target.value)}
                      placeholder="e.g. Round 1"
                      className="w-1/2 bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                    />
                    <input
                      type="text"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      placeholder="e.g. Tomorrow at 2 PM"
                      className="w-1/2 bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                    />
                  </div>
                </div>
              )}

              {status === 'Offer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Offer Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={offerProgress}
                      onChange={(e) => setOfferProgress(Number(e.target.value))}
                      className="w-full bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Offer Deadline</label>
                    <input
                      type="text"
                      value={offerDeadline}
                      onChange={(e) => setOfferDeadline(e.target.value)}
                      placeholder="e.g. OCT 20"
                      className="w-full bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#1E2538] border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-blue/50 h-24 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title || !company}
                  className="px-6 py-2.5 bg-accent-blue hover:bg-[#8B7FF9] text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(108,99,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Job
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
