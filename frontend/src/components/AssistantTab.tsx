import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface Props {
  occupation: string;
  initialExplanation?: string | null;
  onAskQuestion: (question: string, context?: string) => Promise<string>;
}

export function AssistantTab({ occupation, initialExplanation, onAskQuestion }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialExplanation) {
      return [{ role: 'assistant', content: initialExplanation }];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);
    try {
      const answer = await onAskQuestion(q);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    `What do ${occupation}s actually do at work?`,
    `How long does it take to become a ${occupation}?`,
    `What's the typical salary for a ${occupation}?`,
    `What challenges will I face becoming a ${occupation}?`,
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
              Career Assistant
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ask anything about {occupation}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
              Ask anything about your {occupation} career path
            </p>
            {quickQuestions.map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all hover:border-indigo-500"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: msg.role === 'assistant' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-elevated)',
              }}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </div>
            <div className={`flex-1 max-w-[85%] px-4 py-3 rounded-xl text-sm ${msg.role === 'user' ? 'text-right' : ''}`}
              style={{
                background: msg.role === 'assistant' ? 'var(--bg-card)' : 'rgba(99,102,241,0.15)',
                border: `1px solid ${msg.role === 'assistant' ? 'var(--border)' : 'rgba(99,102,241,0.3)'}`,
              }}>
              {msg.role === 'assistant' ? (
                <div className="prose-dark">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span style={{ color: 'var(--text-primary)' }}>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 rounded-xl border flex items-center gap-2"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl border text-sm" style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask a question about your career..."
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={send}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
