import { useState, useRef, useEffect } from 'react';
import { careerCoachApi } from '../../api/careerCoachApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Quick prompt suggestions ─────────────────────────────────────
const QUICK_PROMPTS = [
  {
    category: '💼 Placement',
    prompts: [
      'How should I prepare for TCS NQT?',
      'What is the placement process at Amazon?',
      'Give me a 30-day placement preparation plan',
      'Which companies visit campus for CSE freshers?',
    ]
  },
  {
    category: '⚙️ DSA',
    prompts: [
      'What DSA topics are most important for interviews?',
      'How do I approach dynamic programming problems?',
      'Give me easy array problems to start with',
      'Explain binary search with examples',
    ]
  },
  {
    category: '📄 Resume',
    prompts: [
      'How do I write a strong resume summary?',
      'What projects should a Java developer showcase?',
      'How to describe my project in a resume bullet point?',
      'What skills should I list for a backend developer role?',
    ]
  },
  {
    category: '🎤 Interview',
    prompts: [
      'How to answer "Tell me about yourself"?',
      'What are common Java interview questions?',
      'How to prepare for system design interviews?',
      'Give me behavioral interview tips using STAR method',
    ]
  },
  {
    category: '🚀 Career',
    prompts: [
      'Should I do an internship or work on projects?',
      'What is a good salary for a fresher in India?',
      'How to negotiate a job offer?',
      'Which is better — service company or product company?',
    ]
  },
];

// ── Message bubble component ─────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  // Simple markdown-like formatting
  const formatText = (text) => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line, i) => {
        // Bold: **text**
        line = line.replace(/\*\*(.*?)\*\*/g,
          '<strong>$1</strong>');
        // Bullet points
        if (line.trim().startsWith('- ')
            || line.trim().startsWith('• ')) {
          return `<div class="flex gap-2 my-0.5">
                    <span class="shrink-0 mt-1">•</span>
                    <span>${line.trim().substring(2)}</span>
                  </div>`;
        }
        // Numbered list
        if (/^\d+\.\s/.test(line.trim())) {
          return `<div class="my-0.5">${line}</div>`;
        }
        // Empty line
        if (line.trim() === '') {
          return '<div class="h-2"></div>';
        }
        return `<div>${line}</div>`;
      })
      .join('');
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-lg">
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
      {/* Coach Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br
                      from-indigo-500 to-purple-600 flex items-center
                      justify-center text-white text-sm font-bold
                      shrink-0 mt-0.5">
        AI
      </div>
      <div className="flex-1 max-w-2xl">
        <div className="bg-white border border-gray-200
                        rounded-2xl rounded-tl-sm px-4 py-3
                        text-sm text-gray-800 leading-relaxed
                        shadow-sm">
          <div
            dangerouslySetInnerHTML={{
              __html: formatText(msg.content)
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br
                      from-indigo-500 to-purple-600 flex items-center
                      justify-center text-white text-sm font-bold
                      shrink-0">
        AI
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl
                      rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-indigo-400 rounded-full
                         animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function CareerCoach() {
  const { user } = useAuth();
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [typing, setTyping]         = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [activeCategory, setCategory] = useState(0);
  const messagesEndRef              = useRef(null);
  const inputRef                    = useRef(null);

  // Greeting message on mount
  useEffect(() => {
    const greeting = {
      id:      Date.now(),
      role:    'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI Career Coach.\n\nI can help you with:\n- **Placement preparation** and company-specific guidance\n- **DSA** topics, problems, and strategies\n- **Resume** optimization and project descriptions\n- **Interview** preparation (technical + HR)\n- **Career planning** and salary guidance\n\nWhat would you like to work on today?`,
      time:    getTime(),
    };
    setMessages([greeting]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const getTime = () => new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || typing) return;

    setInput('');
    setShowPrompts(false);

    // Add user message
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
      // Build history for API (exclude greeting, only real chat)
      const apiMessages = updatedMessages
        .filter(m => m.role === 'user' || m.id !== messages[0]?.id)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await careerCoachApi.chat({
        messages: apiMessages,
      });

      const aiMsg = {
        id:      Date.now() + 1,
        role:    'assistant',
        content: res.data.data.message,
        time:    getTime(),
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      toast.error('Failed to get response. Please try again.');
      // Remove the user message if failed
      setMessages(prev =>
        prev.filter(m => m.id !== userMsg.id));
      setInput(content);
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    const greeting = {
      id:      Date.now(),
      role:    'assistant',
      content: `Fresh start! 🚀 What would you like to work on?`,
      time:    getTime(),
    };
    setMessages([greeting]);
    setShowPrompts(true);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]
                    max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            💬 AI Career Coach
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Your personal placement and career guidance assistant
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 border border-gray-300
                     text-gray-600 text-xs rounded-lg
                     hover:bg-gray-50 transition-colors
                     flex items-center gap-1.5">
          🔄 New Chat
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-gray-50 rounded-2xl border
                      border-gray-200 flex flex-col
                      overflow-hidden">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">

          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {typing && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts (shown on new chat) */}
        {showPrompts && !typing && (
          <div className="border-t border-gray-200
                          bg-white px-4 py-3">
            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap mb-3">
              {QUICK_PROMPTS.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setCategory(i)}
                  className={`px-3 py-1 rounded-full text-xs
                    font-medium transition-colors
                    ${activeCategory === i
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                          + ' hover:bg-gray-200'}`}>
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Prompt chips */}
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS[activeCategory].prompts.map(
                (prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-1.5 bg-indigo-50
                               border border-indigo-200
                               text-indigo-700 rounded-full
                               text-xs hover:bg-indigo-100
                               transition-colors text-left">
                    {prompt}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-gray-200 bg-white
                        p-3 rounded-b-2xl">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about placements, DSA, resume, interviews..."
                rows={1}
                style={{ resize: 'none' }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(
                    e.target.scrollHeight, 120) + 'px';
                }}
                className="w-full px-4 py-3 rounded-xl border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500 resize-none
                           pr-12"
              />
              <div className="absolute right-3 bottom-3
                              text-xs text-gray-400">
                ↵
              </div>
            </div>

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              className="w-11 h-11 bg-indigo-600
                         hover:bg-indigo-700 text-white
                         rounded-xl flex items-center
                         justify-center transition-colors
                         disabled:opacity-50
                         disabled:cursor-not-allowed shrink-0">
              {typing ? (
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
              ) : (
                <svg width="18" height="18"
                     viewBox="0 0 24 24" fill="none"
                     stroke="currentColor"
                     strokeWidth="2.5"
                     strokeLinecap="round"
                     strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

