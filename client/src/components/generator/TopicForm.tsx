import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useGenerator } from '../../context/GeneratorContext';
import { generateGuest, generateAuth } from '../../api/generator';
import { GenerationResult } from '../../types';

const SAMPLE_TOPICS = [
  'The Solar System', 'World War II', 'Photosynthesis', 'The Water Cycle',
  'Fractions and Decimals', 'The Human Body', 'Climate Change', 'Ancient Egypt',
  'The Food Chain', 'Democracy',
];

const GRADE_LEVELS = ['Kinder', 'Elementary', 'High School', 'College'];

// Progress messages shown at key percentage milestones
const PROGRESS_MESSAGES: { at: number; label: string }[] = [
  { at: 0,  label: 'Starting generation…' },
  { at: 15, label: 'Researching your topic…' },
  { at: 30, label: 'Crafting slide content…' },
  { at: 50, label: 'Building slide structure…' },
  { at: 65, label: 'Adding key facts & quiz…' },
  { at: 80, label: 'Designing layout…' },
  { at: 90, label: 'Finalising presentation…' },
  { at: 98, label: 'Almost ready…' },
];

function getCurrentMessage(pct: number): string {
  let msg = PROGRESS_MESSAGES[0].label;
  for (const m of PROGRESS_MESSAGES) {
    if (pct >= m.at) msg = m.label;
  }
  return msg;
}

interface TopicFormProps {
  onResult: (result: GenerationResult & { topic: string; gradeLevel: string }) => void;
}

const TopicForm: React.FC<TopicFormProps> = ({ onResult }) => {
  const { role } = useAuth();
  const { isGenerating, setIsGenerating, isLimitReached, updateQuota } = useGenerator();
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Elementary');
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated progress ticker — climbs to 95% over ~40s, then waits for real completion
  const startProgress = () => {
    setProgress(0);
    // Each tick: +1% every 400ms, slows near 95 to avoid overshooting
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const step = prev < 60 ? 2 : prev < 85 ? 1 : 0.3;
        return Math.min(95, prev + step);
      });
    }, 400);
  };

  const finishProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => setProgress(0), 800);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) { toast.error('Please enter a topic'); return; }
    if (isLimitReached) return;

    setIsGenerating(true);
    startProgress();
    try {
      let result;
      if (role === 'teacher') {
        result = await generateAuth(topic.trim(), gradeLevel);
      } else {
        result = await generateGuest(topic.trim(), gradeLevel);
      }
      finishProgress();
      await updateQuota();
      onResult({ ...result, topic: topic.trim(), gradeLevel });
      toast.success('Presentation generated successfully!');
    } catch (err: unknown) {
      finishProgress();
      const error = err as { response?: { data?: { message?: string; limitReached?: boolean } } };
      if (error.response?.data?.limitReached) {
        await updateQuota();
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate presentation');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-slate-700 font-semibold mb-2">
            What is your report or presentation topic?
          </label>
          <textarea
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The Solar System, World War II, Photosynthesis, The Water Cycle, The French Revolution, Climate Change..."
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={isGenerating || isLimitReached}
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-2">Grade Level</label>
          <div className="flex flex-wrap gap-2">
            {GRADE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setGradeLevel(level)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  gradeLevel === level
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'border-slate-300 text-slate-600 hover:border-blue-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
          <span>Slides generated</span>
          <span className="font-semibold text-slate-700">12–16 slides + quiz</span>
        </div>

        {/* Generate button */}
        <button
          type="submit"
          disabled={isGenerating || isLimitReached || !topic.trim()}
          className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold py-4 rounded-xl text-lg transition disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden relative"
        >
          {isGenerating ? (
            <div className="flex flex-col items-center gap-1.5 px-4">
              {/* Percentage + message */}
              <div className="flex items-center justify-between w-full text-sm">
                <span className="opacity-90">{getCurrentMessage(progress)}</span>
                <span className="font-bold tabular-nums">{Math.round(progress)}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            'Generate Presentation →'
          )}
        </button>

        {!role && (
          <p className="text-center text-sm text-slate-500">
            Sign in with Google after your free tries to unlock 10 more presentations
          </p>
        )}
      </form>

      <div className="mt-5">
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Try one of these topics</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 transition"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicForm;
