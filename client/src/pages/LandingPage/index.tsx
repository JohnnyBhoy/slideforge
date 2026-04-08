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
    q: 'Who can use SlideForge?',
    a: 'Anyone — students, teachers, and presenters. Guests get 3 free presentations. Teachers who sign in with Google get 5 free generations per billing cycle.',
  },
  {
    q: 'What does the generated presentation look like?',
    a: 'A professionally designed .pptx file with a title slide, detailed content slides, a quiz slide to test understanding, and a summary slide — ready to open in PowerPoint, Google Slides, or LibreOffice.',
  },
  {
    q: 'How many slides will my presentation have?',
    a: 'Between 12 and 16 slides depending on the topic — including a knowledge-check quiz near the end and a summary of key takeaways.',
  },
  {
    q: 'How do I subscribe for unlimited presentations?',
    a: 'After using your 5 free generations, a subscription option will appear with GCash payment instructions. Once confirmed by our team, your account gets unlimited access.',
  },
  {
    q: 'How long until my subscription is activated?',
    a: 'Typically within 24 hours after you click "I\'ve Paid" and our team confirms your payment.',
  },
  {
    q: 'Can I edit the downloaded file?',
    a: 'Yes! The file is a standard .pptx format. Open it in Microsoft PowerPoint, Google Slides, or LibreOffice and edit freely — change colors, add images, adjust text.',
  },
  {
    q: 'What grade levels are supported?',
    a: 'Kinder, Elementary, High School, and College. The language, depth, and examples are automatically adjusted to match the selected level.',
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
    if (!loading && role === 'admin') navigate('/admin', { replace: true });
  }, [role, loading, navigate]);

  useEffect(() => {
    if (role === 'teacher' && isLimitReached) setShowTeacherModal(true);
  }, [isLimitReached, role]);

  const handleResult = (r: GenerationResult & { topic: string; gradeLevel: string }) => {
    setResult(r);
    setLastGeneration(r);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Hero */}
      <section className="text-center py-14 px-4 bg-gradient-to-b from-blue-50 to-[#F8FAFC]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-5">
            <TryCounter remainingTries={remainingTries} isSubscribed={isSubscribed} role={role} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-4">
            Turn Any Topic Into a{' '}
            <span className="text-blue-700">Ready-to-Present Slideshow</span>
          </h1>
          <p className="text-lg text-slate-500 mb-3 max-w-xl mx-auto">
            Perfect for school reports, class presentations, and teaching materials.
            Type your topic, pick your grade level, and download a complete presentation in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500 mb-6">
            <span className="bg-white border border-slate-200 rounded-full px-3 py-1">📄 12–16 slides</span>
            <span className="bg-white border border-slate-200 rounded-full px-3 py-1">🖼️ Topic-matched images</span>
            <span className="bg-white border border-slate-200 rounded-full px-3 py-1">🎯 Built-in quiz</span>
            <span className="bg-white border border-slate-200 rounded-full px-3 py-1">✏️ Fully editable .pptx</span>
            <span className="bg-white border border-slate-200 rounded-full px-3 py-1">🎓 Kinder to College</span>
          </div>
        </div>
      </section>

      {/* Generator Form */}
      <section className="px-4 pb-10 -mt-4">
        <TopicForm onResult={handleResult} />
        {result && (
          <DownloadCard
            result={result}
            onGenerateAnother={() => { setResult(null); setLastGeneration(null); }}
          />
        )}
      </section>

      {/* How it works */}
      <section className="bg-white py-14 px-4 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">How It Works</h2>
          <p className="text-center text-slate-500 text-sm mb-10">Three steps to a complete presentation</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                icon: '✏️',
                title: 'Type Your Topic',
                desc: 'Enter any subject — a history event, a science concept, a book report, anything you need to present.',
              },
              {
                step: '2',
                icon: '⚙️',
                title: 'Pick Grade Level',
                desc: 'Select Kinder, Elementary, High School, or College. The content and language adjust automatically.',
              },
              {
                step: '3',
                icon: '⬇️',
                title: 'Download & Present',
                desc: 'Get a fully designed .pptx file with images, a quiz, and speaker notes — open it in any app and present.',
              },
            ].map((s) => (
              <div key={s.step} className="text-center p-6 rounded-2xl bg-blue-50 border border-blue-100 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                  {s.step}
                </div>
                <div className="text-4xl mb-3 mt-2">{s.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-14 px-4 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">What Every Presentation Includes</h2>
          <p className="text-center text-slate-500 text-sm mb-10">A complete, structured slideshow — not just bullet points</p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '🏷️', title: 'Title Slide', desc: 'A clean opening slide with your topic, grade level, and a relevant cover image.' },
              { icon: '📚', title: 'Content Slides', desc: '10–13 information slides, each with 4 key points, a real photo, and a highlighted fact.' },
              { icon: '🎯', title: 'Quiz Slide', desc: '4 multiple-choice questions to test understanding — answers in the speaker notes.' },
              { icon: '✅', title: 'Summary Slide', desc: 'A closing slide recapping the 4 most important takeaways from the presentation.' },
              { icon: '🗒️', title: 'Speaker Notes', desc: 'Every slide has teacher/presenter notes with elaboration tips — not shown to the audience.' },
              { icon: '✏️', title: 'Fully Editable', desc: 'Standard .pptx format — edit colors, text, images, or layout in any app you prefer.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-2xl flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{f.title}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-14 px-4 border-t border-slate-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 font-semibold text-slate-700 flex justify-between items-center hover:bg-slate-50 text-sm"
                >
                  {item.q}
                  <span className="text-blue-700 ml-4 text-lg flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-slate-500 text-sm border-t border-slate-100 pt-3">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-bold text-white text-lg">Slide Forge</span>
          </div>
          <p className="text-sm mb-4">Presentation tool for students, teachers, and presenters.</p>
          <div className="flex justify-center gap-6 text-sm mb-4">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Use</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Slide Forge. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <GuestLimitModal isOpen={!role && isLimitReached} />
      <TeacherLimitModal isOpen={showTeacherModal} onClose={() => setShowTeacherModal(false)} />
    </div>
  );
};

export default LandingPage;
