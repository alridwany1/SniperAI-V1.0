import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Tenant } from '../types';
import { Send, Sparkles, MessageSquare, Trash2, ArrowUpRight, Table, X, Minus, Download, Database } from 'lucide-react';
import { Language } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';
import VisualQueryBuilder from './VisualQueryBuilder';

interface AIAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string, customResultMsg?: ChatMessage) => void;
  onClearHistory: () => void;
  onAutoSummarize: () => void;
  activeTenant: Tenant;
  loading: boolean;
  language: Language;
}

const CHIP_SUGGESTIONS_EN = [
  "What is our most profitable product?",
  "Analyze current net profit margins",
  "Explain our sales anomalies & causes",
  "How can we boost Average Order Value (AOV)?"
];

const CHIP_SUGGESTIONS_AR = [
  "ما هو المنتج الأكثر ربحية لدينا؟",
  "تحليل هوامش صافي الأرباح الحالية",
  "شرح شذوذ المبيعات الحالية وأسبابه",
  "كيف يمكن زيادة متوسط قيمة الطلب (AOV)؟"
];

export default function AIAssistant({
  messages,
  onSendMessage,
  onClearHistory,
  onAutoSummarize,
  activeTenant,
  loading,
  language,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isRTL = language === 'ar';
  const sideClass = isRTL ? 'left-6' : 'right-6';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, loading, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleChipClick = (suggestion: string) => {
    if (loading) return;
    onSendMessage(suggestion);
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;
    
    const header = isRTL 
      ? `--- سجل محادثة مساعد الذكاء الاصطناعي SniperAI ---\nمساحة العمل: ${activeTenant.name}\nالتاريخ: ${new Date().toLocaleString()}\n\n`
      : `--- SniperAI Assistant Chat History ---\nWorkspace: ${activeTenant.name}\nDate: ${new Date().toLocaleString()}\n\n`;
      
    const chatContent = messages.map((msg) => {
      const roleName = msg.role === 'user' 
        ? (isRTL ? 'المستخدم' : 'User') 
        : (isRTL ? 'المساعد الذكي' : 'Assistant');
        
      let text = `[${roleName}]:\n${msg.text || ''}`;
      
      if (msg.tableData) {
        text += '\n\n';
        text += `[${isRTL ? 'جدول البيانات' : 'Data Table'}: ${msg.tableData.title || ''}]\n`;
        const headersLine = `| ${msg.tableData.headers.join(' | ')} |`;
        const separatorLine = `| ${msg.tableData.headers.map(() => '---').join(' | ')} |`;
        const rowsLines = msg.tableData.rows.map(row => `| ${row.join(' | ')} |`).join('\n');
        text += `${headersLine}\n${separatorLine}\n${rowsLines}`;
      }
      
      return text;
    }).join('\n\n' + '='.repeat(40) + '\n\n');

    const blob = new Blob([header + chatContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sniperai_chat_${activeTenant.name.toLowerCase().replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const chips = isRTL ? CHIP_SUGGESTIONS_AR : CHIP_SUGGESTIONS_EN;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="ai-floating-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${sideClass} z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-950/40 border border-indigo-400/30 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200`}
        title={isRTL ? "مساعد الذكاء الاصطناعي المالي" : "Financial AI Assistant"}
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-fade-in" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#070b13]"></span>
          </div>
        )}
      </button>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-assistant-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed bottom-24 ${sideClass} z-50 w-[92vw] sm:w-[420px] h-[520px] max-h-[calc(100vh-120px)] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 p-4 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xs font-bold font-display text-white text-start">
                    {isRTL ? 'المساعد المالي الذكي (AI)' : 'Smart Financial AI Assistant'}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-light text-start">
                    {isRTL 
                      ? `مدرب على ملفات الأداء الخاصة بـ ${activeTenant.name}` 
                      : `Trained on ${activeTenant.name}'s performance profiles`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={handleDownloadChat}
                      className="text-slate-500 hover:text-indigo-400 p-1.5 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                      title={isRTL ? 'تحميل المحادثة' : 'Download Chat'}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={onClearHistory}
                      className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                      title={isRTL ? 'مسح المحادثة' : 'Clear conversations'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-300 p-1.5 hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer"
                  title={isRTL ? 'إغلاق' : 'Close'}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 space-y-4 pr-1.5 scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/60 text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="max-w-xs">
                    <h4 className="text-xs font-semibold text-slate-300">
                      {isRTL ? 'كيف يمكن لـ SniperAI مساعدتك؟' : 'How can SniperAI assist you?'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-light">
                      {isRTL 
                        ? 'اطرح أسئلة تحليلية، أو اطلب جداول لمقارنة المبيعات، أو راجع محفزات التدفق النقدي الاستراتيجية.' 
                        : 'Ask analytical questions, request tables comparing sales, or review strategic cash flow triggers.'}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed text-start ${
                          isUser 
                            ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-950/20 rounded-tr-sm' 
                            : 'bg-slate-900/80 text-slate-300 border border-slate-800/80 rounded-tl-sm'
                        }`}
                      >
                        {/* Chat Message text formatted simply with break lines */}
                        <div className="space-y-2 whitespace-pre-wrap font-light">
                          {(msg.text || '').split('\n').map((line, lidx) => {
                            if (line.startsWith('|')) {
                              // Skip raw table lines in text if table is rendered below
                              if (msg.tableData) return null;
                            }
                            
                            if (line.trim().startsWith('###') || line.trim().startsWith('**')) {
                              return (
                                <p key={lidx} className="font-semibold text-white pt-1">
                                  {line.replace(/###|\*\*/g, '').trim()}
                                </p>
                              );
                            }
                            return <p key={lidx}>{line}</p>;
                          })}
                        </div>

                        {/* Render Table data if processed by backend */}
                        {msg.tableData && (
                          <div className="mt-3.5 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/60 shadow-md">
                            <div className="bg-slate-950/80 px-3 py-1.5 border-b border-slate-800/80 flex items-center gap-1.5 justify-start">
                              <Table className="w-3 h-3 text-indigo-400" />
                              <span className="text-[10px] font-medium text-slate-400">
                                {msg.tableData.title || (isRTL ? 'جدول مقارنة مستخرج ذكياً' : 'AI Extracted Comparison Grid')}
                              </span>
                            </div>
                            <div className="overflow-x-auto max-w-full">
                              <table className="w-full text-[10px] text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-950/30 text-slate-400 border-b border-slate-800/60 font-medium">
                                    {msg.tableData.headers.map((h, hi) => (
                                      <th key={hi} className="px-3 py-2 font-mono text-start">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                  {msg.tableData.rows.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-slate-800/20 font-light text-start">
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="px-3 py-1.5 font-mono text-slate-300 text-start">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Loading Spinner */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/60 text-slate-400 border border-slate-800/60 rounded-2xl rounded-tl-sm px-4 py-3 text-xs flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 animate-pulse">
                      {isRTL ? 'Gemini يقوم بتحليل المعطيات...' : 'Gemini analyzing parameters...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Bottom Actions Wrapper */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
              {/* Auto-Summarize & Suggestion Chips */}
              {!loading && (
                <div className="flex flex-wrap gap-1.5 justify-start items-center">
                  <button
                    id="ai-auto-summarize-btn"
                    type="button"
                    onClick={onAutoSummarize}
                    className="text-[10px] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5 font-semibold cursor-pointer animate-fade-in"
                    title={isRTL ? "توليد ملخص تلقائي للجلسة الحالية وحفظه" : "Generate and save session summary"}
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>{isRTL ? "ملخص الجلسة تلقائياً" : "Auto-Summarize Session"}</span>
                  </button>

                  <button
                    id="sql-query-builder-btn"
                    type="button"
                    onClick={() => setShowQueryBuilder(true)}
                    className="text-[10px] bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1.5 font-semibold cursor-pointer animate-fade-in"
                    title={isRTL ? "فتح باني استعلامات SQL المرئي" : "Open Visual SQL Query Builder"}
                  >
                    <Database className="w-3 h-3 text-emerald-400" />
                    <span>{isRTL ? "مخطط وباني SQL" : "SQL Query Builder"}</span>
                  </button>

                  {messages.length === 0 && chips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip)}
                      className="text-[10px] bg-slate-900/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800/80 transition-all flex items-center gap-1 text-start cursor-pointer"
                    >
                      <span>{chip}</span>
                      <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="relative">
                <input
                  id="chat-input-field"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  placeholder={isRTL ? `اسأل أي شيء حول إحصاءات ${activeTenant.name}...` : `Ask anything about ${activeTenant.name}'s stats...`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-4 pr-12 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 text-start"
                />
                <button
                  id="send-chat-btn"
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all h-8 w-8 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Visual Query Builder Slide-Up Overlay */}
            {showQueryBuilder && (
              <VisualQueryBuilder
                activeTenant={activeTenant}
                language={language}
                onClose={() => setShowQueryBuilder(false)}
                onQueryExecuted={(sqlText, resultMsg) => {
                  onSendMessage(sqlText, resultMsg);
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
