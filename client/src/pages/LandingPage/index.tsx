import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import TopicForm from '../../components/generator/TopicForm';
import DownloadCard from '../../components/generator/DownloadCard';
import TryCounter from '../../components/generator/TryCounter';
import GuestLimitModal from '../../components/generator/GuestLimitModal';
import TeacherLimitModal from '../../components/generator/TeacherLimitModal';
import { useAuth } from '../../context/AuthContext';
import { useGenerator } from '../../context/GeneratorContext';
import { GenerationResult } from '../../types';

const FAQ_ITEMS = [
  {
    q: 'How does the free trial work?',
    a: 'Guests get 3 free presentations. After signing in with Google, teachers get 5 free generations per billing cycle.',
  },
  {
    q: 'What does the generated PowerPoint look like?',
    a: 'A 10-slide, professionally styled presentation with title slide, content slides, and a summary slide — ready to download and edit.',
  },
  {
    q: 'How do I subscribe?',
    a: 'After using your 5 free generations, a subscription modal will appear with GCash payment instructions.',
  },
  {
    q: 'How long until my subscription is activated?',
    a: 'Typically within 24 hours after you click "I\'ve Paid" and our admin confirms your payment.',
  },
  {
    q: 'Can I edit the downloaded file?',
    a: 'Yes! The file is a standard .pptx format that works in Microsoft PowerPoint, Google Slides, and LibreOffice.',
  },
  {
    q: 'What grade levels are supported?',
    a: 'Kinder, Elementary, High School, and College — each with AI content tailored to the appropriate level.',
  },
];

const LandingPage: React.FC = () => {
  const { user, role, loading } = useAuth();
  const { remainingTries, isLimitReached, isSubscribed, setLastGeneration } = useGenerator();
  const [result, setResult] = useState<(GenerationResult & { topic: string; gradeLevel: string }) | null>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [role, loading, navigate]);

  useEffect(() => {
    if (role === 'teacher' && isLimitReached) {
      setShowTeacherModal(true);
    }
  }, [isLimitReached, role]);

  const handleResult = (r: GenerationResult & { topic: string; gradeLevel: string }) => {
    setResult(r);
    setLastGeneration(r);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Hero */}
      <section className="text-center py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <TryCounter remainingTries={remainingTries} isSubscribed={isSubscribed} role={role} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-4">
            Generate Classroom Presentations{' '}
            <span className="text-blue-700">in Seconds</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Type your lesson topic and get a ready-to-download PowerPoint — instantly.
            No design skills needed.
          </p>
        </div>
      </section>

      {/* Generator Form */}
      <section className="px-4 pb-8">
        <TopicForm onResult={handleResult} />

        {result && (
          <DownloadCard
            result={result}
            onGenerateAnother={() => {
              setResult(null);
              setLastGeneration(null);
            }}
          />
        )}
      </section>

      {/* Features */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">
            Why Teachers Love Class Generator
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Content',
                desc: 'OpenAI generates educator-quality slide text for any topic.',
              },
              {
                icon: '⚡',
                title: 'Instant Download',
                desc: 'Ready in seconds, standard PPTX format you can open anywhere.',
              },
              {
                icon: '🎓',
                title: 'Teacher-Friendly',
                desc: 'No design skills needed — just type your topic and download.',
              },
            ].map((f) => (
              <div key={f.title} className="text-center p-6 rounded-xl bg-blue-50">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 font-semibold text-slate-700 flex justify-between items-center hover:bg-slate-50"
                >
                  {item.q}
                  <span className="text-blue-700 ml-2">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-slate-600 text-sm">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-white">Class Generator</span>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            AI presentations for every classroom
          </p>
          <div className="flex justify-center gap-6 text-sm mb-4">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Use</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
          <p className="text-xs text-slate-500">© 2025 Class Generator</p>
        </div>
      </footer>

      {/* Modals */}
      <GuestLimitModal isOpen={!role && isLimitReached} />
      <TeacherLimitModal
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
      />
    </div>
  );
};

export default LandingPage;
