
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatSession } from './types';
import { geminiService } from './services/geminiService';
import ChatMessage from './components/ChatMessage';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      let accumulatedContent = '';
      const stream = geminiService.streamChat(messages, userMessage.content);

      for await (const chunk of stream) {
        accumulatedContent += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: accumulatedContent } 
              : msg
          )
        );
      }
    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: "Désolé, une erreur s'est produite lors de la génération de la réponse." } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform z-30 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full p-4">
          <button 
            onClick={startNewChat}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors mb-6 text-sm font-medium"
          >
            <i className="fas fa-plus"></i>
            Nouvelle Discussion
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Recents</h3>
            {/* Session list could go here */}
            <div className="space-y-1">
               <div className="px-3 py-2 text-sm text-slate-400 italic">Aucune session enregistrée</div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                <i className="fas fa-user text-xs"></i>
              </div>
              <span className="text-sm font-medium">Utilisateur</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-slate-400 hover:text-white p-2"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-white text-sm"></i>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Gemini Chat Pro</h1>
          </div>

          <div className="w-8 md:w-auto"></div> {/* Spacer for symmetry on mobile */}
        </header>

        {/* Messages Container */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-4"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800 shadow-xl">
                <i className="fas fa-robot text-4xl text-blue-500 animate-pulse"></i>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Bonjour ! Comment puis-je vous aider ?</h2>
                <p className="text-slate-400 text-sm">
                  Posez-moi n'importe quelle question, je suis là pour vous aider avec vos tâches, vos idées ou simplement discuter.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {['Explique l\'informatique quantique', 'Idées de cadeaux pour un chef', 'Planifie un voyage à Paris', 'Code un jeu Snake en Python'].map((hint) => (
                  <button 
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition-all text-left"
                  >
                    "{hint}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1].role === 'user' && (
                <div className="flex justify-start mb-6">
                  <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message Gemini..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 resize-none max-h-48 py-2 px-3 text-sm custom-scrollbar"
                rows={1}
                style={{ height: 'auto', minHeight: '40px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  input.trim() && !isLoading 
                    ? 'bg-blue-600 text-white hover:bg-blue-500' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-3">
              Gemini peut faire des erreurs. Envisagez de vérifier les informations importantes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
