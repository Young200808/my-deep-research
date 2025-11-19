import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Message, MessageRole, ResearchState } from './types';
import { streamDeepResearch } from './services/geminiService';
import { ArtifactPanel } from './components/ArtifactPanel';
import { SendIcon, BotIcon, UserIcon, SparklesIcon, ChevronRightIcon, SearchIcon } from './components/Icons';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: MessageRole.ASSISTANT,
      content: "Hello. I am your Deep Research Agent. What topic shall we investigate today?",
      timestamp: Date.now()
    }
  ]);
  
  const [researchState, setResearchState] = useState<ResearchState>({
    topic: '',
    status: 'idle',
    reportContent: '',
    sources: [],
    lastUpdated: 0
  });

  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearch = useCallback(async () => {
    if (!input.trim() || researchState.status === 'researching' || researchState.status === 'streaming') return;

    const topic = input;
    setInput('');

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: topic,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    // 2. Initialize Research State
    setResearchState({
      topic,
      status: 'researching',
      reportContent: '',
      sources: [],
      lastUpdated: Date.now()
    });
    setIsArtifactOpen(true);

    // 3. Add "Thinking/Working" System Message
    const sysMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: sysMsgId,
      role: MessageRole.ASSISTANT,
      content: `Initializing deep research protocol for: "${topic}"...`,
      timestamp: Date.now(),
      isThinking: true
    }]);

    try {
      // 4. Call Service
      await streamDeepResearch(topic, (chunk) => {
        setResearchState(prev => {
            const newSources = chunk.sources ? [...prev.sources, ...chunk.sources] : prev.sources;
            // Deduplicate sources based on URL
            const uniqueSources = Array.from(new Map(newSources.map(s => [s.url, s])).values());
            
            return {
                ...prev,
                status: 'streaming',
                reportContent: prev.reportContent + chunk.text,
                sources: uniqueSources,
                lastUpdated: Date.now()
            };
        });
      });

      // 5. Completion
      setResearchState(prev => ({ ...prev, status: 'completed' }));
      setMessages(prev => prev.map(msg => 
        msg.id === sysMsgId 
          ? { ...msg, content: `Research complete. I've generated a comprehensive report on "${topic}" in the artifact panel.`, isThinking: false } 
          : msg
      ));

    } catch (error) {
      console.error(error);
      setResearchState(prev => ({ ...prev, status: 'error' }));
      setMessages(prev => prev.map(msg => 
        msg.id === sysMsgId 
          ? { ...msg, content: "An error occurred while conducting research. Please try again.", isThinking: false } 
          : msg
      ));
    }
  }, [input, researchState.status]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-zinc-100 font-sans selection:bg-primary/30">
      
      {/* LEFT PANEL: CHAT & CONTROLS */}
      <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${isArtifactOpen ? 'w-full md:w-[45%] lg:w-[40%]' : 'w-full max-w-3xl mx-auto'}`}>
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <SparklesIcon className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold tracking-tight text-lg">DeepResearch</span>
          </div>
          {researchState.reportContent && !isArtifactOpen && (
            <button 
                onClick={() => setIsArtifactOpen(true)}
                className="flex items-center gap-2 text-xs font-medium text-primary hover:text-blue-400 transition-colors"
            >
                View Artifact <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role !== MessageRole.USER && (
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <BotIcon className="w-4 h-4 text-zinc-400" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-1`}>
                 <div className={`text-xs opacity-50 mb-1 ${msg.role === MessageRole.USER ? 'text-right' : 'text-left'}`}>
                    {msg.role === MessageRole.USER ? 'You' : 'Assistant'}
                 </div>
                 <div 
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.role === MessageRole.USER 
                        ? 'bg-zinc-800 text-white rounded-tr-none border border-zinc-700' 
                        : 'bg-transparent border border-border text-zinc-300 rounded-tl-none px-0 py-2 border-none'
                    }
                    ${msg.isThinking ? 'animate-pulse' : ''}
                 `}
                 >
                    {msg.content}
                    {msg.isThinking && (
                       <div className="flex items-center gap-2 mt-3 text-xs text-blue-400">
                          <SearchIcon className="w-3 h-3 animate-spin" />
                          <span>Scanning knowledge base & web sources...</span>
                       </div>
                    )}
                 </div>
              </div>

              {msg.role === MessageRole.USER && (
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 pt-2 bg-background/80 backdrop-blur">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-surface border border-border rounded-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-2xl">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a research topic..."
                    className="w-full bg-transparent border-none focus:ring-0 px-4 py-4 h-[60px] resize-none text-sm placeholder-zinc-500 text-zinc-200"
                />
                <div className="pr-3">
                    <button
                        onClick={handleSearch}
                        disabled={!input.trim() || researchState.status === 'researching'}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                            input.trim() 
                            ? 'bg-primary text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 hover:scale-105' 
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                    >
                        <SendIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-zinc-600 mt-3">
            AI can make mistakes. Review generated reports carefully.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: ARTIFACT */}
      <ArtifactPanel 
        isOpen={isArtifactOpen} 
        onClose={() => setIsArtifactOpen(false)} 
        researchState={researchState} 
      />
      
    </div>
  );
}