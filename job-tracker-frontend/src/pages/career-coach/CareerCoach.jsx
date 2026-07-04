import { useState, useEffect, useRef, useCallback } from 'react';
import { careerCoachApi } from '../../api/careerCoachApi';
import { aiHubApi }        from '../../api/aiHubApi';
import { useAuth }         from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Suggested Prompts by Category ────────────────────────────────
const PROMPT_CATEGORIES = [
  {
    id: 'placement', label: '🎯 Placement', prompts: [
      'Create a 30-day placement preparation plan for me',
      'Which companies should I target based on my skills?',
      'What is my current placement readiness?',
      'Give me an off-campus placement strategy',
    ]
  },
  {
    id: 'interview', label: '🎤 Interview', prompts: [
      'How should I prepare for my upcoming technical interview?',
      'Give me a STAR method answer template',
      'What are my weakest interview areas?',
      'How do I improve my system design skills?',
    ]
  },
  {
    id: 'dsa', label: '💻 DSA', prompts: [
      'Create a 60-day DSA study plan for me',
      'Which DSA topics are most important for placements?',
      'I am struggling with dynamic programming — help me',
      'Suggest 5 LeetCode problems to solve today',
    ]
  },
  {
    id: 'resume', label: '📄 Resume', prompts: [
      'How can I improve my ATS score?',
      'Review my resume skills section',
      'What projects should I add to my portfolio?',
      'How do I write strong project bullet points?',
    ]
  },
  {
    id: 'career', label: '🚀 Career', prompts: [
      'Should I choose TCS or Infosys for my first job?',
      'Java vs MERN — which is better for placements?',
      'Startup vs MNC — help me decide',
      'How do I get into product companies?',
    ]
  },
  {
    id: 'motivation', label: '💪 Motivation', prompts: [
      'I am feeling demotivated — help me',
      'What is my progress so far?',
      'How far am I from getting placed?',
      'Give me a weekly goal based on my current level',
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

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="relative my-3">
          {lang && (
            <div className="bg-gray-700 text-gray-300 text-xs px-3 py-1
                            rounded-t-lg">
              {lang}
            </div>
          )}
          <pre className={`bg-gray-900 text-green-400 text-xs p-4
                           overflow-x-auto ${lang ? 'rounded-b-lg' : 'rounded-lg'}`}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <p key={i} className="text-sm font-bold text-gray-900 mt-3 mb-1">
          {renderInline(line.slice(4))}
        </p>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <p key={i} className="text-base font-bold text-gray-900 mt-3 mb-1">
          {renderInline(line.slice(3))}
        </p>
      );
    }
    // Bullet list
    else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
          <span className="text-sm">{renderInline(line.trim().slice(2))}</span>
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line.trim())) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span className="text-indigo-600 font-bold text-sm shrink-0
                           min-w-5">
            {num}.
          </span>
          <span className="text-sm">
            {renderInline(line.trim().replace(/^\d+\.\s/, ''))}
          </span>
        </div>
      );
    }
    // Horizontal rule
    else if (line.trim() === '---') {
      elements.push(
        <hr key={i} className="border-gray-200 my-3"/>
      );
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5"/>);
    }
    // Normal text
    else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed">
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
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i}
              className="bg-gray-100 text-indigo-700 px-1 py-0.5
                         rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Message Bubble ────────────────────────────────────────────────
function MessageBubble({ msg, onCopy, onLike, onDislike }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xl">
          <div className="bg-indigo-600 text-white rounded-2xl
                          rounded-tr-sm px-4 py-3 text-sm
                          leading-relaxed">
            {msg.content}
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {msg.time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      {/* AI Avatar */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br
                      from-indigo-600 to-purple-700 flex items-center
                      justify-center text-white text-xs font-bold
                      shrink-0 mt-0.5 shadow-md">
        CP
      </div>

      <div className="flex-1 max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-2xl
                        rounded-tl-sm px-4 py-4 shadow-sm">
          <MarkdownText content={msg.content}/>
        </div>

        {/* Message Actions */}
        <div className="flex items-center gap-3 mt-1.5 ml-1">
          <p className="text-xs text-gray-400">{msg.time}</p>
          <div className="flex gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-gray-600
                         hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy">
              {copied ? '✓' : '📋'}
            </button>
            <button
              onClick={() => onLike?.(msg.id)}
              className={`p-1.5 rounded-lg transition-colors
                ${msg.liked
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Helpful">
              👍
            </button>
            <button
              onClick={() => onDislike?.(msg.id)}
              className={`p-1.5 rounded-lg transition-colors
                ${msg.disliked
                    ? 'text-red-500 bg-red-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Not helpful">
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
    <div className="flex gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br
                      from-indigo-600 to-purple-700 flex items-center
                      justify-center text-white text-xs font-bold
                      shrink-0 shadow-md">
        CP
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl
                      rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 h-5">
          {[0, 1, 2].map(i => (
            <div key={i}
                 className="w-2 h-2 bg-indigo-400 rounded-full
                            animate-bounce"
                 style={{ animationDelay: `${i * 0.15}s` }}/>
          ))}
          <span className="text-xs text-gray-400 ml-1">
            CareerPilot AI is thinking...
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Daily Insight Card ────────────────────────────────────────────
function DailyInsightCard({ insight }) {
  if (!insight) return null;
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-700
                    rounded-2xl p-4 text-white">
      <p className="text-xs font-bold uppercase tracking-wider
                    text-white/70 mb-3">
        🌅 Today's Coaching
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '🎯', label: 'Goal',       value: insight.goal       },
          { icon: '💡', label: 'Tip',        value: insight.tip        },
          { icon: '⚡', label: 'Challenge',  value: insight.challenge  },
          { icon: '💪', label: 'Motivation', value: insight.motivation },
        ].map(item => (
          <div key={item.label}
               className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <p className="text-xs font-bold text-white/70 mb-1">
              {item.icon} {item.label}
            </p>
            <p className="text-xs text-white leading-relaxed">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weekly Review Card ────────────────────────────────────────────
function WeeklyReviewCard({ review }) {
  if (!review) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-700 uppercase
                    tracking-wider mb-3">
        📊 Your Progress
      </p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Applications', value: review.applicationsSubmitted,
            icon: '📋', color: 'blue'   },
          { label: 'Practice',     value: review.practiceSessionsCompleted,
            icon: '🎤', color: 'purple' },
          { label: 'Questions',    value: review.questionsAnswered,
            icon: '✍️', color: 'indigo' },
          { label: 'Avg Score',
            value: review.averageScore > 0
                    ? `${review.averageScore}/10` : '—',
            icon: '🎯', color: 'green'  },
          { label: 'Total XP',     value: `${review.totalXp} XP`,
            icon: '⚡', color: 'amber'  },
          { label: 'Streak',       value: `${review.currentStreak}d`,
            icon: '🔥', color: 'orange' },
        ].map(s => (
          <div key={s.label}
               className="text-center p-2 bg-gray-50 rounded-xl">
            <p className="text-lg">{s.icon}</p>
            <p className="text-sm font-bold text-gray-900">
              {s.value}
            </p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function CareerCoach() {
  const { user } = useAuth();

  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [activeCategory, setCategory] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [dailyInsight, setDailyInsight] = useState(null);
  const [weeklyReview, setWeeklyReview] = useState(null);
  const [context, setContext]         = useState(null);
  const [showPrompts, setShowPrompts] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const textareaRef    = useRef(null);

  const firstName = user?.name?.split(' ')[0] || 'there';

  // ── Load initial data ─────────────────────────────────────────
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
    ]);
  }, []);

  // ── Personalized greeting ─────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = buildGreeting();
      setMessages([{
        id:      Date.now(),
        role:    'assistant',
        content: greeting,
        time:    getTime(),
      }]);
    }
  }, [context, weeklyReview]);

  const buildGreeting = () => {
    const name = user?.name?.split(' ')[0] || 'there';
    let msg = `👋 **Welcome back, ${name}!**\n\n`;
    msg += `I'm your CareerPilot AI Career Coach — your personal mentor throughout your placement journey.\n\n`;

    if (weeklyReview) {
      const parts = [];
      if (weeklyReview.practiceSessionsCompleted > 0)
        parts.push(`✅ Completed **${weeklyReview.practiceSessionsCompleted}** practice sessions`);
      if (weeklyReview.questionsAnswered > 0)
        parts.push(`✅ Answered **${weeklyReview.questionsAnswered}** interview questions`);
      if (weeklyReview.totalXp > 0)
        parts.push(`⚡ Earned **${weeklyReview.totalXp} XP** total`);
      if (weeklyReview.currentStreak > 0)
        parts.push(`🔥 On a **${weeklyReview.currentStreak}-day** activity streak`);

      if (parts.length > 0) {
        msg += `**Your progress so far:**\n${parts.join('\n')}\n\n`;
      }
    }

    if (context?.targetRole) {
      msg += `I see you're working towards **${context.targetRole}** — I'm here to help you get there.\n\n`;
    }

    msg += `What would you like to work on today? You can ask me anything about your career, placements, interviews, or learning path. 🚀`;
    return msg;
  };

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const getTime = () => new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

  // ── Send Message ──────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || typing) return;

    setInput('');
    setShowPrompts(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

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

      const res = await careerCoachApi.chat({
        messages: apiMessages,
      });

      const aiMsg = {
        id:      Date.now() + 1,
        role:    'assistant',
        content: res.data.data.message,
        time:    getTime(),
        liked:   false,
        disliked:false,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      setInput(content);
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  }, [messages, input, typing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLike = (msgId) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, liked: !m.liked, disliked: false } : m
    ));
  };

  const handleDislike = (msgId) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, disliked: !m.disliked, liked: false } : m
    ));
  };

  const handleReset = () => {
    setMessages([]);
    setShowPrompts(true);
    setInput('');
    setTimeout(() => {
      const greeting = buildGreeting();
      setMessages([{
        id:      Date.now(),
        role:    'assistant',
        content: greeting,
        time:    getTime(),
      }]);
    }, 100);
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)] max-w-7xl">

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <div className={`${showSidebar ? 'w-72' : 'w-0 overflow-hidden'}
                       transition-all duration-300 shrink-0 space-y-4`}>
        {showSidebar && (
          <>
            {/* Daily Insight */}
            <DailyInsightCard insight={dailyInsight}/>

            {/* Weekly Review */}
            <WeeklyReviewCard review={weeklyReview}/>

            {/* Category Prompts */}
            <div className="bg-white rounded-2xl border border-gray-200
                            p-4">
              <p className="text-xs font-bold text-gray-700 uppercase
                            tracking-wider mb-3">
                💬 Conversation Starters
              </p>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PROMPT_CATEGORIES.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => setCategory(i)}
                    className={`px-2.5 py-1 rounded-full text-xs
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
                                 hover:text-indigo-700 border
                                 border-gray-200 hover:border-indigo-200
                                 rounded-xl text-xs text-gray-600
                                 transition-colors leading-relaxed">
                      {prompt}
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Main Chat ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat Header */}
        <div className="bg-white rounded-2xl border border-gray-200
                        px-5 py-3 flex items-center gap-3 mb-4 shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-gray-500 hover:text-gray-700
                       transition-colors text-lg">
            ☰
          </button>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br
                          from-indigo-600 to-purple-700 flex items-center
                          justify-center text-white text-xs font-bold">
            CP
          </div>

          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">
              CareerPilot AI Career Coach
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full
                              animate-pulse"/>
              <p className="text-xs text-gray-500">
                Personalized · Context-aware · Always available
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 border border-gray-300 text-gray-600
                         text-xs rounded-xl hover:bg-gray-50
                         transition-colors">
              🔄 New Chat
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-gray-50 rounded-2xl border
                        border-gray-200 flex flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto p-5">

            {/* Personalized Quick Prompts (only at start) */}
            {showPrompts && messages.length <= 1 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 text-center mb-3">
                  ✨ Quick conversation starters
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    '📊 What is my current placement readiness?',
                    '🎯 Create a 30-day placement plan for me',
                    '📄 How can I improve my resume?',
                    '💻 Which DSA topics should I focus on?',
                    '🏢 Prepare me for product company interviews',
                    '🔥 Give me today\'s study goal',
                  ].map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(
                        p.replace(/^[📊🎯📄💻🏢🔥]\s*/, ''))}
                      className="px-3 py-2.5 bg-white border
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

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4
                          rounded-b-2xl">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={el => {
                    inputRef.current = el;
                    textareaRef.current = el;
                  }}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(
                      e.target.scrollHeight, 140) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your career coach anything... (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  style={{ resize: 'none' }}
                  className="w-full px-4 py-3 rounded-xl border
                             border-gray-300 text-sm focus:outline-none
                             focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || typing}
                className="w-12 h-12 bg-gradient-to-br from-indigo-600
                           to-purple-700 text-white rounded-xl flex items-center
                           justify-center transition-all hover:opacity-90
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-md hover:shadow-lg shrink-0">
                {typing ? (
                  <div className="w-4 h-4 border-2 border-white
                                  border-t-transparent rounded-full
                                  animate-spin"/>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" strokeWidth="2.5"
                       strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
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
    </div>
  );
}

