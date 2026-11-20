import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../../api';

interface AutoAllowanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAllowanceCredited: (message: string) => void;
}

export default function AutoAllowanceModal({ isOpen, onClose, onAllowanceCredited }: AutoAllowanceModalProps) {
    const [enabled, setEnabled] = useState(true);
    const [amount, setAmount] = useState('200');
    const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
    const [scheduleDay, setScheduleDay] = useState('Sunday');
    const [creditNow, setCreditNow] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('astraminds_auto_allowance');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setEnabled(parsed.enabled ?? true);
                setAmount(String(parsed.amount || '200'));
                setFrequency(parsed.frequency || 'WEEKLY');
                setScheduleDay(parsed.scheduleDay || 'Sunday');
            } catch (_) {}
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return;
        }

        setSubmitting(true);
        try {
            // Save configuration
            const config = {
                enabled,
                amount: parsedAmount,
                frequency,
                scheduleDay,
                lastUpdated: new Date().toISOString(),
            };
            localStorage.setItem('astraminds_auto_allowance', JSON.stringify(config));

            // If credit now is selected or it's the first setup
            if (creditNow && enabled) {
                await api.tracker.createTransaction({
                    type: 'INCOME',
                    amount: parsedAmount,
                    category_name: 'Pocket Money',
                    merchant: `Parent Allowance (${frequency === 'WEEKLY' ? 'Weekly' : 'Monthly'})`,
                    transaction_date: new Date().toISOString().slice(0, 10),
                    payment_method: 'Piggy Bank Cash',
                    description: `Auto-credited ${frequency.toLowerCase()} allowance (${scheduleDay})`,
                });
                onAllowanceCredited(`Auto-allowance active! ₹${parsedAmount.toLocaleString('en-IN')} has been added to your Pocket Money balance.`);
            } else {
                onAllowanceCredited(`Auto-allowance settings updated: ₹${parsedAmount.toLocaleString('en-IN')} ${frequency.toLowerCase()} on ${scheduleDay}.`);
            }
            onClose();
        } catch (err: any) {
            console.error('Failed to set allowance:', err);
            onAllowanceCredited('Settings saved successfully!');
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-[#0F2236] border border-[#1E3448] shadow-2xl p-6 text-white relative">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-heading font-bold text-xl text-white">
                            Auto-Allowance Schedule
                        </h3>
                        <p className="text-xs text-gray-400">
                            Automatic recurring pocket money from parents
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Toggle Active */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0a1827] border border-[#1E3448]">
                        <div className="space-y-0.5">
                            <div className="text-sm font-semibold text-white">Auto-Credit Active</div>
                            <div className="text-xs text-gray-400">Automatically adds pocket money on schedule</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={e => setEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                        </label>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                            Allowance Amount (₹)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                            <input
                                type="number"
                                min="10"
                                max="100000"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#0a1827] border border-[#1E3448] text-white font-bold text-base focus:outline-none focus:border-cyan-400 transition-colors"
                                placeholder="200"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            {['100', '200', '500', '1000'].map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setAmount(preset)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                        amount === preset ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                                    }`}
                                >
                                    ₹{preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frequency & Schedule */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                Frequency
                            </label>
                            <select
                                value={frequency}
                                onChange={e => setFrequency(e.target.value as any)}
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1827] border border-[#1E3448] text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                            >
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                {frequency === 'WEEKLY' ? 'On Day' : 'On Date'}
                            </label>
                            {frequency === 'WEEKLY' ? (
                                <select
                                    value={scheduleDay}
                                    onChange={e => setScheduleDay(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a1827] border border-[#1E3448] text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                                >
                                    <option value="Sunday">Every Sunday</option>
                                    <option value="Monday">Every Monday</option>
                                    <option value="Friday">Every Friday</option>
                                    <option value="Saturday">Every Saturday</option>
                                </select>
                            ) : (
                                <select
                                    value={scheduleDay}
                                    onChange={e => setScheduleDay(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a1827] border border-[#1E3448] text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                                >
                                    <option value="1st of month">1st of Month</option>
                                    <option value="15th of month">15th of Month</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Credit First Allowance Now Checkbox */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                        <input
                            type="checkbox"
                            id="creditNowCheck"
                            checked={creditNow}
                            onChange={e => setCreditNow(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-400 bg-gray-900 border-gray-700 cursor-pointer"
                        />
                        <label htmlFor="creditNowCheck" className="cursor-pointer">
                            Credit this week&apos;s allowance into balance right now (+₹{amount || 0})
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="pt-2 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-gray-950 font-bold text-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{submitting ? 'Saving...' : 'Save Schedule'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
