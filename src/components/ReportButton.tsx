import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { dbCreateReport } from '../services/db';
import { ReportReason } from '../types';

const reasons: ReportReason[] = ['Copyright/stolen', 'Minor/child content', 'Non-consensual/real person', 'Wrong content rating', 'Other'];

export const ReportButton: React.FC<{ seriesId: string; chapterId?: string }> = ({ seriesId, chapterId }) => {
  const { user, showToast } = useAppStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('Copyright/stolen');
  const [message, setMessage] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await dbCreateReport({ reporterId: user?.id, seriesId, chapterId, reason, message: message.trim() });
    setOpen(false);
    setMessage('');
    showToast('Report submitted', 'Thank you. An admin will review this report.', 'success');
  };
  return <div className="relative">
    <button onClick={() => setOpen((value) => !value)} className="py-2 px-3 rounded-xl border border-[#2C2340] text-xs font-semibold text-[#FF4D6D] flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" />Report</button>
    {open && <form onSubmit={submit} className="absolute right-0 top-full mt-2 z-40 w-72 p-4 rounded-2xl bg-[#171122] border border-[#2C2340] shadow-2xl space-y-3">
      <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} className="w-full p-2 rounded-lg bg-[#0E0A14] border border-[#2C2340] text-xs">{reasons.map((item) => <option key={item}>{item}</option>)}</select>
      <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Optional details" rows={3} className="w-full p-2 rounded-lg bg-[#0E0A14] border border-[#2C2340] text-xs" />
      <button type="submit" className="w-full py-2 rounded-lg bg-[#FF4D6D] text-white text-xs font-bold">Submit report</button>
    </form>}
  </div>;
};