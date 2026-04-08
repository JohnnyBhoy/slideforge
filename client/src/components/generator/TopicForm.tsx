import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useGenerator } from '../../context/GeneratorContext';
import { generateGuest, generateAuth } from '../../api/generator';
import Loader from '../common/Loader';
import { GenerationResult } from '../../types';

const SAMPLE_TOPICS = [
  'The Solar System', 'World War II', 'Photosynthesis', 'The Water Cycle',
  'Fractions and Decimals', 'The Human Body', 'Climate Change', 'Ancient Egypt',
  'The Food Chain', 'Democracy',
];

const GRADE_LEVELS = ['Kinder', 'Elementary', 'High School', 'College'];

interface TopicFormProps {
  onResult: (result: GenerationResult & { topic: string; gradeLevel: string }) => void;
}

const TopicForm: React.FC<TopicFormProps> = ({ onResult }) => {
  const { role } = useAuth();
  const { isGenerating, setIsGenerating, isLimitReached, updateQuota } = useGenerator();
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Elementary');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    if (isLimitReached) return;

    setIsGenerating(true);
    try {
      let res;
      if (role === 'teacher') {
        res = await generateAuth(topic.trim(), gradeLevel);
      } else {
        res = await generateGuest(topic.trim(), gradeLevel);
      }
      await updateQuota();
      onResult({ ...res.data, topic: topic.trim(), gradeLevel });
      toast.success('Presentation generated successfully!');
    } catch (err: unknown) {
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
            What topic do you want to teach?
          </label>
          <textarea
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Planets and the Solar System, World War II, Photosynthesis, The Water Cycle, Fractions and Decimals..."
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
          <span className="font-semibold text-slate-700">10 slides</span>
        </div>

        <button
          type="submit"
          disabled={isGenerating || isLimitReached || !topic.trim()}
          className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold py-4 rounded-xl text-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <Loader text="Generating your slides..." />
          ) : (
            'Generate Presentation →'
          )}
        </button>

        {!role && (
          <p className="text-center text-sm text-slate-500">
            Sign in with Google after your free tries to get 5 more
          </p>
        )}
      </form>

      <div className="mt-5">
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Sample Topics</p>
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
