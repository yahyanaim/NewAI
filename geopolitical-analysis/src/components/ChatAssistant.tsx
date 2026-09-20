import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, FileDown, Crown } from 'lucide-react';
import type { IntelEvent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { generateChatResponse, type ChatMessage } from '@/lib/chatService';
import { PremiumModal } from './PremiumModal';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface ChatAssistantProps {
    event: IntelEvent;
    onAuthRequired?: () => void;
}

export function ChatAssistant({ event, onAuthRequired }: ChatAssistantProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [showPremium, setShowPremium] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial check for premium
    useEffect(() => {
        const checkPremium = () => {
            setIsPremium(localStorage.getItem('is_premium_intel') === 'true');
        };

        checkPremium();
        window.addEventListener('storage', checkPremium);
        return () => window.removeEventListener('storage', checkPremium);
    }, [user]);

    // Reset chat when event changes
    useEffect(() => {
        setMessages([
            {
                id: 'welcome',
                sender: 'ai',
                text: `I analyze intelligence on "${event.headline}". Ask me about actors, risks, or implications.`,
                timestamp: new Date(),
            },
        ]);
        setQuestionCount(0);
    }, [event.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        // Check question limit
        const limit = isPremium ? 10 : 1;
        if (questionCount >= limit) {
            if (!user && onAuthRequired) {
                onAuthRequired();
            } else {
                setShowPremium(true);
            }
            return;
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setQuestionCount(prev => prev + 1);

        try {
            const responseText = await generateChatResponse(userMsg.text, event);
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: responseText,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestions = [
        "Who is involved?",
        "What are the risks?",
        "Economic impact?",
        "Summarize situation"
    ];

    const exportToPDF = () => {
        if (!isPremium) {
            if (!user && onAuthRequired) {
                onAuthRequired();
            } else {
                setShowPremium(true);
            }
            return;
        }

        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Title
        doc.setFontSize(22);
        doc.setTextColor(38, 145, 175); // accent-primary color
        doc.text("WarTracker24 Intelligence Report", 20, 20);

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(`Tactical Analysis: ${event.headline}`, 20, 30);
        doc.text(`Generated: ${timestamp}`, 20, 38);

        // Content
        let yOffset = 50;
        messages.forEach((msg) => {
            if (yOffset > 270) {
                doc.addPage();
                yOffset = 20;
            }

            const sender = msg.sender === 'ai' ? 'STRATEGIC AI' : 'ANALYST';
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(msg.sender === 'ai' ? 38 : 100, 145, msg.sender === 'ai' ? 175 : 100);
            doc.text(`${sender}:`, 20, yOffset);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(50);
            const splitText = doc.splitTextToSize(msg.text, 170);
            doc.text(splitText, 20, yOffset + 7);

            yOffset += (splitText.length * 7) + 15;
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("CLASSIFIED INFORMATION - INTERNAL USE ONLY", 105, 290, { align: "center" });

        doc.save(`Intel_Report_${event.id}.pdf`);
    };

    return (
        <div className="flex flex-col h-full bg-bg-elevated/20 rounded-lg border border-accent-primary/10">
            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''
                            }`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user'
                                ? 'bg-accent-secondary/20 text-accent-secondary'
                                : 'bg-accent-primary/20 text-accent-primary'
                                }`}
                        >
                            {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        </div>

                        <div
                            className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                ? 'bg-accent-secondary/10 text-white rounded-tr-none border border-accent-secondary/20'
                                : 'bg-bg-surface text-text-primary rounded-tl-none border border-accent-primary/10'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="bg-bg-surface p-3 rounded-2xl rounded-tl-none border border-accent-primary/10">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-accent-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-accent-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-accent-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Limit Notice */}
            {questionCount >= (isPremium ? 10 : 1) && (
                <div className="px-4 py-2 bg-accent-primary/5 border-t border-accent-primary/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-accent-primary" />
                        <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">
                            {isPremium ? 'PRO LIMIT REACHED (10/10)' : 'FREE TIER LIMIT REACHED'}
                        </span>
                    </div>
                    {!isPremium && (
                        <button
                            onClick={() => {
                                if (!user && onAuthRequired) {
                                    onAuthRequired();
                                } else {
                                    setShowPremium(true);
                                }
                            }}
                            className="px-2 py-0.5 bg-accent-primary text-[#0a0f16] text-[9px] font-black uppercase tracking-widest rounded hover:bg-accent-primary/90 transition-colors"
                        >
                            UPGRADE
                        </button>
                    )}
                </div>
            )}

            {/* Premium Status & Export */}
            {isPremium && (
                <div className="px-4 py-2 bg-accent-primary/5 border-t border-accent-primary/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-accent-primary animate-pulse" />
                        <span className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em]">
                            PRO ACTIVE ({questionCount}/10)
                        </span>
                    </div>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        <FileDown className="w-3.5 h-3.5" />
                        EXPORT PDF
                    </button>
                </div>
            )}

            {/* Suggestions */}
            {messages.length < 3 && questionCount === 0 && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto custom-scrollbar">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setInput(s);
                            }}
                            className="whitespace-nowrap px-3 py-1 bg-bg-surface border border-accent-primary/20 rounded-full text-xs text-accent-primary hover:bg-accent-primary/10 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-3 bg-bg-elevated border-t border-accent-primary/20">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={questionCount >= (isPremium ? 10 : 1) ? (isPremium ? "Pro limit reached..." : "Upgrade to continue...") : "Ask about this event..."}
                        className={`w-full bg-bg-surface border border-accent-primary/20 rounded-lg pl-4 pr-10 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 ${questionCount >= (isPremium ? 10 : 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={questionCount >= (isPremium ? 10 : 1)}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping || (questionCount >= (isPremium ? 10 : 1) && !input.trim())}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-accent-primary hover:bg-accent-primary/10 rounded-md transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <PremiumModal
                isOpen={showPremium}
                onClose={() => setShowPremium(false)}
                onSuccess={() => setIsPremium(true)}
            />
        </div>
    );
}
