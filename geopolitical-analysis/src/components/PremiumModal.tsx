import React, { useState } from 'react';
import { X, Coffee, Sparkles, Check, Crown, CreditCard, ExternalLink, Heart, Key, Loader2, AlertTriangle } from 'lucide-react';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type ModalView = 'info' | 'payment' | 'activation' | 'success';

const VALID_CODES = ['WAR-PRO-2025', 'STRATEGIC-INTEL', 'GIFT-COFFEE'];

export function PremiumModal({ isOpen, onClose, onSuccess }: PremiumModalProps) {
    const [view, setView] = useState<ModalView>('info');
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [activationCode, setActivationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handlePaymentSelect = (method: string) => {
        setSelectedMethod(method);
        // Simulate redirect to payment platform
        setTimeout(() => {
            setView('activation');
        }, 800);
    };

    const handleVerifyCode = () => {
        setIsVerifying(true);
        setError(null);

        // Simulated verification lag
        setTimeout(() => {
            if (VALID_CODES.includes(activationCode.toUpperCase())) {
                localStorage.setItem('is_premium_intel', 'true');
                setView('success');
                if (onSuccess) onSuccess();
            } else {
                setError('Invalid activation code. Please try again or contact support.');
            }
            setIsVerifying(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-[#0a0f16] border border-accent-primary/20 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(38,145,175,0.3)] animate-in zoom-in-95 duration-300">

                {/* Premium Banner */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent-primary to-transparent" />

                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-accent-primary/10 rounded-2xl border border-accent-primary/20">
                                {view === 'success' ? <Sparkles className="w-6 h-6 text-accent-primary" /> : <Crown className="w-6 h-6 text-accent-primary" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {view === 'success' ? 'Access Granted' : view === 'activation' ? 'Enter Activation Code' : 'Upgrade to Pro'}
                                </h2>
                                <p className="text-sm text-text-tertiary">
                                    {view === 'success' ? 'Neural link established.' : view === 'activation' ? 'Enter the code sent to your email.' : 'Unlock unlimited tactical intelligence'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                onClose();
                                setTimeout(() => {
                                    setView('info');
                                    setActivationCode('');
                                    setError(null);
                                }, 300);
                            }}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {view === 'info' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 relative group hover:border-accent-primary/40 transition-all duration-500">
                                <div className="absolute top-4 right-4 px-3 py-1 bg-accent-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                                    Pro Tier
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-white">$5</span>
                                        <span className="text-text-tertiary">/ once</span>
                                    </div>
                                    <p className="text-sm text-white/60 mt-2">Support development & unlock full power</p>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {[
                                        "10 Tactical Questions per event",
                                        "Export Intelligence Reports (PDF)",
                                        "No recurring fees",
                                        "Instant Neural Link Activation"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                                            <div className="w-5 h-5 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-accent-primary" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => setView('payment')}
                                    className="w-full py-4 bg-accent-primary hover:bg-accent-primary/90 text-[#0a0f16] font-black uppercase tracking-[0.2em] text-xs rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(38,145,175,0.4)] flex items-center justify-center gap-3"
                                >
                                    <Coffee className="w-4 h-4" />
                                    Get Activation Code
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'payment' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                            <p className="text-sm text-white/60 mb-6">Redirecting to choose platform...</p>

                            <div className="grid grid-cols-1 gap-3">
                                <button onClick={() => handlePaymentSelect('Patreon')} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-[#FF424D] rounded-full flex items-center justify-center"><Heart className="w-5 h-5 text-white" /></div>
                                    <span className="text-white font-bold">Patreon</span>
                                </button>
                                <button onClick={() => handlePaymentSelect('BMC')} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-[#FFDD00] rounded-full flex items-center justify-center"><Coffee className="w-5 h-5 text-black" /></div>
                                    <span className="text-white font-bold">Buy Me A Coffee</span>
                                </button>
                                <button onClick={() => handlePaymentSelect('PayPal')} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                                    <div className="w-10 h-10 bg-[#0070BA] rounded-full flex items-center justify-center"><CreditCard className="w-5 h-5 text-white" /></div>
                                    <span className="text-white font-bold">PayPal</span>
                                </button>
                            </div>

                            <button onClick={() => setView('info')} className="mt-4 text-xs text-white/30 hover:text-white transition-colors">Go Back</button>
                        </div>
                    )}

                    {view === 'activation' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-bg-elevated p-6 rounded-2xl border border-accent-primary/20">
                                <label className="block text-[10px] font-black text-accent-primary uppercase tracking-[0.2em] mb-3">
                                    Activation Key
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                    <input
                                        type="text"
                                        value={activationCode}
                                        onChange={(e) => setActivationCode(e.target.value)}
                                        placeholder="EX: WAR-PRO-2025"
                                        className="w-full bg-bg-surface border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white font-mono placeholder:text-white/10 focus:outline-none focus:border-accent-primary/50"
                                    />
                                </div>
                                {error && (
                                    <div className="mt-4 flex items-center gap-2 text-xs text-sentiment-negative animate-in fade-in slide-in-from-top-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleVerifyCode}
                                disabled={!activationCode || isVerifying}
                                className="w-full py-4 bg-accent-primary disabled:opacity-50 text-[#0a0f16] font-black uppercase tracking-[0.2em] text-xs rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Verify & Activate
                            </button>

                            <p className="text-[10px] text-center text-text-tertiary italic">
                                Use code <span className="text-accent-primary font-bold">WAR-PRO-2025</span> for testing
                            </p>
                        </div>
                    )}

                    {view === 'success' && (
                        <div className="text-center py-6 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-accent-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10 text-accent-primary animate-bounce-slow" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">System Unlocked</h3>
                            <p className="text-sm text-text-tertiary mb-8">
                                All tactical restrictions have been removed. <br />
                                Your intelligence access is now unlimited.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-accent-primary text-[#0a0f16] font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-[0_0_30px_rgba(38,145,175,0.4)]"
                            >
                                Start Assessment
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest flex items-center justify-center gap-2">
                        Neural Interface Version 4.8.2 <span className="w-1 h-1 bg-white/30 rounded-full" /> Pro Status Enabled
                    </p>
                </div>
            </div>
        </div>
    );
}
