import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Tenant } from '../types';
import { Send, Sparkles, MessageSquare, Trash2, ArrowUpRight, Table, X, Minus, Download, Database, Volume2, VolumeX, Mic, MicOff, Lock, RefreshCw, ShieldAlert, Info } from 'lucide-react';
import { Language } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';
import VisualQueryBuilder from './VisualQueryBuilder';
import { useApp } from '../context/AppContext';

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
  const { speechLocale } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const browserSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeechSupported = typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const isRTL = language === 'ar';
  const sideClass = isRTL ? 'left-6' : 'right-6';

  useEffect(() => {
    const SpeechRecognitionClass = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (SpeechRecognitionClass) {
      try {
        const rec = new SpeechRecognitionClass();
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (event: any) => {
          console.warn("Speech recognition warning:", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setShowPermissionModal(true);
            setSpeechError(null);
          } else {
            setSpeechError(isRTL ? `خطأ في التعرف على الصوت: ${event.error}` : `Speech recognition error: ${event.error}`);
          }
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + transcript);
          }
        };

        recognitionRef.current = rec;
      } catch (err) {
        console.warn("Failed to initialize Speech Recognition:", err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn("Failed to abort Speech Recognition:", e);
        }
      }
    };
  }, [isRTL]);

  const toggleSpeechRecognition = async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSpeechError(null);
      // Synchronize with the corresponding language locale
      recognitionRef.current.lang = speechLocale || (language === 'ar' ? 'ar-SA' : 'en-US');
      
      try {
        // Request microphone permission explicitly via getUserMedia to trigger the browser prompt
        // precisely when the user clicks the button and only if permissions are not already granted.
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Release the stream immediately as Web Speech API's SpeechRecognition will handle its own capture
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Start speech recognition
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn("Microphone permission or start failed:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied') || err.message?.includes('Allowed')) {
          setShowPermissionModal(true);
          setSpeechError(null);
        } else {
          // If another error occurred, try starting recognition anyway
          try {
            recognitionRef.current.start();
          } catch (recErr) {
            console.warn("Speech recognition start failed:", recErr);
          }
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playBrowserSpeech = (msgId: string, text: string) => {
    if (!window.speechSynthesis) {
      setPlayingAudioId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean text of markdown formatters
      const cleanText = text
        .replace(/\*\*|###|##|#/g, "")
        .replace(/[-*•]/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Determine actual speech locale to use, prioritizing text content detection for flawless matching
      const hasArabic = /[\u0600-\u06FF]/.test(cleanText);
      const targetLocale = hasArabic ? 'ar-SA' : (speechLocale || 'en-US');
      utterance.lang = targetLocale;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langCode = targetLocale.toLowerCase(); // 'ar-sa' or 'en-us'
        const baseLangCode = targetLocale.slice(0, 2).toLowerCase(); // 'ar' or 'en'
        
        // Filter voices that exactly match the target locale
        const exactMatches = voices.filter(v => {
          const vLang = v.lang.toLowerCase().replace('_', '-');
          return vLang === langCode || vLang.startsWith(langCode);
        });
        
        // Find a high quality voice from the exact matches
        let selectedVoice = exactMatches.find(v => 
          v.name.toLowerCase().includes('google') || 
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('premium') ||
          v.name.toLowerCase().includes('microsoft') ||
          v.name.toLowerCase().includes('apple')
        ) || exactMatches[0];

        // If no exact locale matches, fall back to base language matching (e.g. any 'ar' or 'en')
        if (!selectedVoice) {
          const baseMatches = voices.filter(v => v.lang.toLowerCase().startsWith(baseLangCode));
          selectedVoice = baseMatches.find(v => 
            v.name.toLowerCase().includes('google') || 
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('premium') ||
            v.name.toLowerCase().includes('microsoft') ||
            v.name.toLowerCase().includes('apple')
          ) || baseMatches[0];
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => {
        setPlayingAudioId(null);
      };

      utterance.onerror = () => {
        setPlayingAudioId(null);
      };

      browserSpeechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Browser speech failed:", e);
      setPlayingAudioId(null);
    }
  };

  const handlePlayTTS = async (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setPlayingAudioId(msgId);
    
    // Play back responses natively using the Web Speech API's speechSynthesis
    playBrowserSpeech(msgId, text);
  };

  const parseInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderFormattedMessage = (text: string, msg: ChatMessage) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('|') && msg.tableData) {
        return null;
      }

      const trimmed = line.trim();

      if (trimmed.startsWith('###')) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-white mt-3 mb-1 font-display tracking-wide border-b border-slate-800/40 pb-0.5">
            {parseInlineStyles(trimmed.replace(/^###\s*/, ''))}
          </h3>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h2 key={idx} className="text-sm font-bold text-white mt-4 mb-1.5 font-display tracking-tight">
            {parseInlineStyles(trimmed.replace(/^##\s*/, ''))}
          </h2>
        );
      }
      if (trimmed.startsWith('#')) {
        return (
          <h1 key={idx} className="text-base font-bold text-white mt-5 mb-2 font-display tracking-tight">
            {parseInlineStyles(trimmed.replace(/^#\s*/, ''))}
          </h1>
        );
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        const bulletText = trimmed.replace(/^[-*•]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1">
            <span className="text-indigo-400 mt-1.5 select-none text-[8px]">●</span>
            <span className="flex-1 text-slate-300 leading-relaxed font-normal">
              {parseInlineStyles(bulletText)}
            </span>
          </div>
        );
      }

      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-slate-300 leading-relaxed font-normal my-1">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

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
                        {/* Chat Message text formatted with advanced markdown rules */}
                        <div className="space-y-1.5 font-light">
                          {renderFormattedMessage(msg.text || '', msg)}
                        </div>

                        {/* Speaker Button for assistant messages */}
                        {!isUser && (
                          <div className="mt-2.5 flex justify-end">
                            <button
                              onClick={() => handlePlayTTS(msg.id, msg.text)}
                              className={`px-2 py-1 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/10 transition-all flex items-center gap-1.5 cursor-pointer text-[10px] ${playingAudioId === msg.id ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 animate-pulse' : ''}`}
                              title={isRTL ? "استمع إلى الإجابة بصوت الذكاء الاصطناعي" : "Listen to this response with AI voice"}
                            >
                              {playingAudioId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                                  <span>{isRTL ? 'إيقاف الاستماع' : 'Stop Listening'}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>{isRTL ? 'استمع للإجابة' : 'Listen'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

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

              {/* Speech Recognition Error Alert */}
              <AnimatePresence>
                {speechError && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 text-[10px] text-red-400 flex items-center justify-between gap-2"
                  >
                    <span>{speechError}</span>
                    <button
                      type="button"
                      onClick={() => setSpeechError(null)}
                      className="hover:bg-red-500/20 p-1 rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="relative animate-fade-in">
                <input
                  id="chat-input-field"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  placeholder={isRTL ? `اسأل أي شيء حول إحصاءات ${activeTenant.name}...` : `Ask anything about ${activeTenant.name}'s stats...`}
                  className={`w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 text-start ${
                    isRTL 
                      ? (isSpeechSupported ? 'pl-20 pr-4' : 'pl-12 pr-4') 
                      : (isSpeechSupported ? 'pr-20 pl-4' : 'pr-12 pl-4')
                  }`}
                />
                
                {/* Actions container inside the input bar */}
                <div className={`absolute top-2 flex items-center gap-1.5 ${isRTL ? 'left-2' : 'right-2'}`}>
                  {isSpeechSupported && (
                    <button
                      id="speech-recognition-btn"
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`p-1.5 rounded-xl transition-all h-8 w-8 flex items-center justify-center cursor-pointer ${
                        isListening 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse border border-red-500/30' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-transparent hover:border-slate-700/60'
                      }`}
                      title={isListening ? (isRTL ? 'إيقاف الاستماع' : 'Stop Listening') : (isRTL ? 'التحدث للكتابة' : 'Voice-to-Text Input')}
                    >
                      {isListening ? (
                        <MicOff className="w-3.5 h-3.5" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  
                  <button
                    id="send-chat-btn"
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all h-8 w-8 flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
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

            {/* Microphone Permission Guide Overlay */}
            {showPermissionModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-md flex flex-col justify-between p-6 overflow-y-auto"
              >
                {/* Close Button */}
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-white">
                      {isRTL ? "إعدادات صلاحيات الميكروفون" : "Microphone Access Setup"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPermissionModal(false)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Guidance Body */}
                <div className="flex-1 py-4 flex flex-col justify-center space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-start">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-300">
                        {isRTL ? "تم حظر الميكروفون أو رفض الوصول" : "Microphone Access Blocked or Denied"}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                        {isRTL
                          ? "لحماية خصوصيتك، تمنع المتصفحات إظهار واجهة منح الصلاحيات بمجرد رفضها أول مرة. لتفعيلها مجدداً، يرجى اتباع الإرشادات البسيطة أدناه:"
                          : "To protect your privacy, browsers block permission prompts if denied once. Please follow the simple guide below to reset and grant permission:"}
                      </p>
                    </div>
                  </div>

                  {/* Step-by-Step Interactive Guide */}
                  <div className="space-y-3.5 text-start">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center border border-indigo-500/20 shrink-0">
                        1
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {isRTL ? (
                          <>
                            انقر فوق <strong>أيقونة القفل 🔒</strong> (أو أيقونة إعدادات الموقع) بجوار رابط الموقع في شريط العنوان أعلى المتصفح.
                          </>
                        ) : (
                          <>
                            Click the <strong>Lock icon 🔒</strong> (or Site Settings icon) next to the URL in your browser's address bar.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center border border-indigo-500/20 shrink-0">
                        2
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {isRTL ? (
                          <>
                            ابحث عن خيار <strong>الميكروفون (Microphone)</strong> في قائمة الصلاحيات المعروضة للموقع.
                          </>
                        ) : (
                          <>
                            Locate <strong>Microphone</strong> from the dropdown site permissions list.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center border border-indigo-500/20 shrink-0">
                        3
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {isRTL ? (
                          <>
                            قم بتغيير الإذن من <i>حظر</i> إلى <strong>سماح (Allow)</strong>.
                          </>
                        ) : (
                          <>
                            Change the permission from <i>Block</i> to <strong>Allow</strong>.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold flex items-center justify-center border border-indigo-500/20 shrink-0">
                        4
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {isRTL ? (
                          <>
                            إذا كنت تستخدم التطبيق بداخل إطار مدمج (iFrame)، يفضل <strong>فتح التطبيق في علامة تبويب مستقلة جديدة</strong> عبر قائمة الإعدادات أعلى اليسار لتمكين الميكروفون بنجاح.
                          </>
                        ) : (
                          <>
                            If inside an iframe container, you may need to <strong>open the app in a new tab</strong> via the settings menu to successfully capture microphone input.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-slate-800/80 pt-4 flex gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPermissionModal(false);
                      setSpeechError(null);
                      setTimeout(() => {
                        toggleSpeechRecognition();
                      }, 150);
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>{isRTL ? "إعادة المحاولة" : "Try Again"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPermissionModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    {isRTL ? "إغلاق" : "Close"}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
