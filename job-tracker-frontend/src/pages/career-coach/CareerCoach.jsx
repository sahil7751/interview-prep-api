import { useState, useEffect, useRef, useCallback } from 'react';
import { careerCoachApi } from '../../api/careerCoachApi';
import { aiHubApi }        from '../../api/aiHubApi';
import { useAuth }         from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Prompt Categories ─────────────────────────────────────────────
const PROMPT_CATEGORIES = [
  {
    id: 'placement', label: 'Placement', prompts: [
      'Create a 30-day placement preparation plan for me',
      'Which companies should I target based on my skills?',
      'What is my current placement readiness?',
      'Give me an off-campus placement strategy',
    ]
  },
  {
    id: 'interview', label: 'Interview', prompts: [
      'How should I prepare for a technical interview?',
      'Give me a STAR method answer template',
      'What are common HR interview questions?',
      'How do I improve my system design skills?',
    ]
  },
  {
    id: 'dsa', label: 'DSA', prompts: [
      'Create a 60-day DSA study plan for me',
      'Which DSA topics are most important for placements?',
      'I am struggling with dynamic programming — help me',
      'Suggest 5 LeetCode problems to solve today',
    ]
  },
  {
    id: 'resume', label: 'Resume', prompts: [
      'How can I improve my ATS score?',
      'What projects should I add to my portfolio?',
      'How do I write strong project bullet points?',
      'What skills should I highlight for backend roles?',
    ]
  },
  {
    id: 'career', label: 'Career', prompts: [
      'Should I choose TCS or Infosys for my first job?',
      'Java vs MERN — which is better for placements?',
      'Startup vs MNC — help me decide',
      'How do I get into product companies?',
    ]
  },
];

// ── Markdown Renderer ─────────────────────────────────────────────
function MarkdownText({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="my-3">
          {lang && (
            <div className="bg-gray-700 text-gray-300 text-xs
                            px-3 py-1 rounded-t-lg">
              {lang}
            </div>
          )}
          <pre className={`bg-gray-900 text-green-400 text-xs
                           p-4 overflow-x-auto
                           ${lang ? 'rounded-b-lg' : 'rounded-lg'}`}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <p key={i} className="text-sm font-bold text-gray-900
                               mt-3 mb-1">
          {renderInline(line.slice(4))}
        </p>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <p key={i} className="text-base font-bold text-gray-900
                               mt-3 mb-1">
          {renderInline(line.slice(3))}
        </p>
      );
    } else if (line.trim().startsWith('- ')
               || line.trim().startsWith('• ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="text-indigo-400 mt-1 shrink-0 text-xs">
            ●
          </span>
          <span className="text-sm text-gray-700">
            {renderInline(line.trim().slice(2))}
          </span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="text-indigo-600 font-bold text-xs
                           shrink-0 min-w-4 mt-0.5">
            {num}.
          </span>
          <span className="text-sm text-gray-700">
            {renderInline(line.trim().replace(/^\d+\.\s/, ''))}
          </span>
        </div>
      );
    } else if (line.trim() === '---') {
      elements.push(
        <hr key={i} className="border-gray-100 my-3"/>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5"/>);
    } else {
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i}
              className="bg-gray-100 text-indigo-700 px-1.5
                         py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Message Bubble ─────────────────────────────────────────────────
function MessageBubble({ msg, onLike, onDislike }) {
  const isUser    = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-lg">
          <div className="bg-indigo-600 text-white rounded-2xl
                          rounded-tr-sm px-4 py-3 text-sm
                          leading-relaxed shadow-sm">
            {msg.content}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">
            {msg.time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-5">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex
                      items-center justify-center text-white
                      text-xs font-bold shrink-0 mt-0.5">
        CP
      </div>

      <div className="flex-1 max-w-2xl min-w-0">
        <div className="bg-white border border-gray-200 rounded-2xl
                        rounded-tl-sm px-5 py-4 shadow-sm">
          <MarkdownText content={msg.content}/>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-1.5 ml-1">
          <span className="text-xs text-gray-400">{msg.time}</span>
          <div className="flex gap-1 ml-1">
            <button
              onClick={handleCopy}
              title="Copy"
              className="p-1.5 text-gray-400 hover:text-gray-600
                         hover:bg-gray-100 rounded-lg transition-colors
                         text-xs">
              {copied ? '✓' : '📋'}
            </button>
            <button
              onClick={() => onLike?.(msg.id)}
              title="Helpful"
              className={`p-1.5 rounded-lg transition-colors text-sm
                ${msg.liked
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-400 hover:text-gray-600'
                      + ' hover:bg-gray-100'}`}>
              👍
            </button>
            <button
              onClick={() => onDislike?.(msg.id)}
              title="Not helpful"
              className={`p-1.5 rounded-lg transition-colors text-sm
                ${msg.disliked
                    ? 'text-red-500 bg-red-50'
                    : 'text-gray-400 hover:text-gray-600'
                      + ' hover:bg-gray-100'}`}>
              👎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex
                      items-center justify-center text-white
                      text-xs font-bold shrink-0">
        CP
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl
                      rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i}
                 className="w-2 h-2 bg-indigo-300 rounded-full
                            animate-bounce"
                 style={{ animationDelay: `${i * 0.15}s` }}/>
          ))}
          <span className="text-xs text-gray-400 ml-2">
            Thinking...
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Stat Item ─────────────────────────────────────────────────────
function StatItem({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b
                    border-gray-50 last:border-0">
      <span className="text-base shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-none">
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function CareerCoach() {
  const { user } = useAuth();

  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [typing, setTyping]             = useState(false);
  const [activeCategory, setCategory]   = useState(0);
  const [dailyInsight, setDailyInsight] = useState(null);
  const [weeklyReview, setWeeklyReview] = useState(null);
  const [context, setContext]           = useState(null);
  const [showPrompts, setShowPrompts]   = useState(true);
  const [initialized, setInitialized]   = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const firstName      = user?.name?.split(' ')[0] || 'there';

  // ── Load data ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      careerCoachApi.dailyInsight()
        .then(r => setDailyInsight(r.data.data))
        .catch(() => {}),
      careerCoachApi.weeklyReview()
        .then(r => setWeeklyReview(r.data.data))
        .catch(() => {}),
      aiHubApi.getContext()
        .then(r => setContext(r.data.data))
        .catch(() => {}),
    ]).finally(() => setInitialized(true));
  }, []);

  // ── Greeting ──────────────────────────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    if (messages.length > 0) return;

    let msg = `👋 **Welcome back, ${firstName}!**\n\n`;
    msg += `I'm your CareerPilot AI Career Coach — your personal mentor throughout your placement journey.\n\n`;

    if (weeklyReview) {
      const parts = [];
      if ((weeklyReview.practiceSessionsCompleted || 0) > 0)
        parts.push(`✅ Completed **${weeklyReview.practiceSessionsCompleted}** practice sessions`);
      if ((weeklyReview.questionsAnswered || 0) > 0)
        parts.push(`✅ Answered **${weeklyReview.questionsAnswered}** interview questions`);
      if ((weeklyReview.totalXp || 0) > 0)
        parts.push(`⚡ Earned **${weeklyReview.totalXp} XP** total`);
      if ((weeklyReview.currentStreak || 0) > 0)
        parts.push(`🔥 On a **${weeklyReview.currentStreak}-day** streak`);
      if (parts.length > 0) {
        msg += `**Your progress:**\n${parts.join('\n')}\n\n`;
      }
    }

    if (context?.targetRole) {
      msg += `Working towards **${context.targetRole}** — I'm here to help you get there. 🚀\n\n`;
    }

    msg += `What would you like to work on today?`;

    setMessages([{
      id:      Date.now(),
      role:    'assistant',
      content: msg,
      time:    getTime(),
    }]);
  }, [initialized]);

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const getTime = () => new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

  // ── Send ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || typing) return;

    setInput('');
    setShowPrompts(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg = {
      id:      Date.now(),
      role:    'user',
      content,
      time:    getTime(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setTyping(true);

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role, content: m.content
      }));
      const res = await careerCoachApi.chat({ messages: apiMessages });
      setMessages(prev => [...prev, {
        id:      Date.now() + 1,
        role:    'assistant',
        content: res.data.data.message,
        time:    getTime(),
        liked:   false,
        disliked:false,
      }]);
    } catch {
      toast.error('Failed to get response. Please try again.');
      setMessages(prev =>
        prev.filter(m => m.id !== userMsg.id));
      setInput(content);
    } finally {
      setTyping(false);
    }
  }, [messages, input, typing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLike = (id) => setMessages(prev =>
    prev.map(m => m.id === id
      ? { ...m, liked: !m.liked, disliked: false }
      : m));

  const handleDislike = (id) => setMessages(prev =>
    prev.map(m => m.id === id
      ? { ...m, disliked: !m.disliked, liked: false }
      : m));

  const handleReset = () => {
    setMessages([]);
    setShowPrompts(true);
    setInitialized(false);
    setTimeout(() => setInitialized(true), 50);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)] max-w-7xl">

      {/* ── Left Sidebar ─────────────────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col gap-3
                      overflow-y-auto">

        {/* Coach Identity */}
        <div className="bg-white rounded-xl border border-gray-200
                        p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600
                            flex items-center justify-center
                            text-white font-bold text-sm shrink-0">
              CP
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                AI Career Coach
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-500
                                rounded-full"/>
                <p className="text-xs text-gray-500">
                  Always available
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Context-aware mentor with access to your profile,
            progress, and career goals.
          </p>
        </div>

        {/* Today's Insight */}
        {dailyInsight && (
          <div className="bg-white rounded-xl border border-gray-200
                          p-4">
            <p className="text-xs font-bold text-gray-500
                          uppercase tracking-wider mb-3">
              🌅 Today's Coaching
            </p>
            <div className="space-y-3">
              {[
                { icon: '🎯', label: 'Goal',
                  value: dailyInsight.goal,       bg: 'bg-blue-50'   },
                { icon: '💡', label: 'Tip',
                  value: dailyInsight.tip,        bg: 'bg-amber-50'  },
                { icon: '⚡', label: 'Challenge',
                  value: dailyInsight.challenge,  bg: 'bg-purple-50' },
              ].map(item => (
                <div key={item.label}
                     className={`${item.bg} rounded-lg p-3`}>
                  <p className="text-xs font-semibold text-gray-600
                                mb-1">
                    {item.icon} {item.label}
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Stats */}
        {weeklyReview && (
          <div className="bg-white rounded-xl border border-gray-200
                          p-4">
            <p className="text-xs font-bold text-gray-500
                          uppercase tracking-wider mb-2">
              📊 Your Progress
            </p>
            <div>
              <StatItem icon="📋"
                        value={weeklyReview.applicationsSubmitted}
                        label="Applications"/>
              <StatItem icon="🎤"
                        value={weeklyReview.practiceSessionsCompleted}
                        label="Practice Sessions"/>
              <StatItem icon="✍️"
                        value={weeklyReview.questionsAnswered}
                        label="Questions Answered"/>
              <StatItem
                icon="🎯"
                value={weeklyReview.averageScore > 0
                  ? `${weeklyReview.averageScore}/10` : '—'}
                label="Avg Interview Score"/>
              <StatItem icon="⚡"
                        value={`${weeklyReview.totalXp} XP`}
                        label="Total XP"/>
              <StatItem icon="🔥"
                        value={`${weeklyReview.currentStreak} day`}
                        label="Current Streak"/>
            </div>
          </div>
        )}

        {/* Conversation Starters */}
        <div className="bg-white rounded-xl border border-gray-200
                        p-4">
          <p className="text-xs font-bold text-gray-500
                        uppercase tracking-wider mb-3">
            💬 Conversation Starters
          </p>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PROMPT_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => setCategory(i)}
                className={`px-2.5 py-1 rounded-lg text-xs
                  font-medium transition-colors
                  ${activeCategory === i
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                        + ' hover:bg-gray-200'}`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Prompts */}
          <div className="space-y-1.5">
            {PROMPT_CATEGORIES[activeCategory].prompts.map(
              (prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-3 py-2.5
                             bg-gray-50 hover:bg-indigo-50
                             hover:text-indigo-700
                             border border-gray-200
                             hover:border-indigo-200 rounded-lg
                             text-xs text-gray-600
                             transition-colors leading-relaxed">
                  {prompt}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Main Chat ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white
                      rounded-xl border border-gray-200 overflow-hidden">

        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-gray-100
                        flex items-center gap-3 shrink-0 bg-white">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex
                          items-center justify-center text-white
                          text-xs font-bold">
            CP
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">
              CareerPilot AI Career Coach
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"/>
              <p className="text-xs text-gray-500">
                Personalized · Context-aware · Always available
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 border border-gray-200
                       text-gray-600 text-xs font-medium rounded-lg
                       hover:bg-gray-50 transition-colors
                       flex items-center gap-1.5">
            <span>🔄</span> New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Quick starters grid */}
          {showPrompts && messages.length <= 1 && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 text-center mb-3">
                ✨ Quick conversation starters
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'What is my current placement readiness?',
                  'Create a 30-day placement plan for me',
                  'How can I improve my resume?',
                  'Which DSA topics should I focus on?',
                  'Prepare me for product company interviews',
                  'Give me today\'s study goal',
                ].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="px-3 py-2.5 bg-gray-50 border
                               border-gray-200 rounded-xl text-xs
                               text-gray-600 hover:bg-indigo-50
                               hover:text-indigo-700
                               hover:border-indigo-200
                               transition-colors text-left
                               leading-relaxed">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onLike={handleLike}
              onDislike={handleDislike}
            />
          ))}

          {typing && <TypingIndicator/>}
          <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 px-5 py-4
                        bg-white shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(
                  e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask your career coach anything..."
              rows={1}
              style={{ resize: 'none' }}
              className="flex-1 px-4 py-3 rounded-xl border
                         border-gray-300 text-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-500
                         focus:border-indigo-500 text-gray-900
                         placeholder-gray-400"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700
                         text-white rounded-xl flex items-center
                         justify-center transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         shrink-0">
              {typing ? (
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor"
                     strokeWidth="2.5" strokeLinecap="round"
                     strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-400">
              Enter to send · Shift+Enter for new line
            </p>
            <p className="text-xs text-gray-400">
              {messages.filter(m => m.role !== 'system').length} messages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

