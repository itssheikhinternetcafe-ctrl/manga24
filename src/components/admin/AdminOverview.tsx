import React from 'react';
import { BookOpen, Eye, Flag, Users } from 'lucide-react';
import { Series, UserProfile } from '../../types';

export const AdminOverview: React.FC<{ stories: Series[]; writers: UserProfile[] }> = ({ stories, writers }) => {
  const cards = [
    { label: 'Total stories', value: stories.length, icon: BookOpen },
    { label: 'Total views', value: stories.reduce((sum, story) => sum + (story.views || 0), 0).toLocaleString(), icon: Eye },
    { label: 'Flagged review', value: stories.filter((story) => story.flaggedForReview).length, icon: Flag },
    { label: 'Creators', value: writers.length, icon: Users },
  ];
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="border border-[#2C2340] bg-[#171122] p-5 rounded-xl"><Icon className="mb-4 h-5 w-5 text-[#FF4D6D]" /><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-[#A79FC0]">{label}</p></div>)}</section>;
};
