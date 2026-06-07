import { useState } from 'react';
import { Plus, Trash2, MoreHorizontal, Calendar, Users, Brain, CheckCircle2, FileText, Link as LinkIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import PromptDialog from '../ui/PromptDialog';
import { MeetingNote } from '../../types';

interface MeetingsSectionProps {
  meetingNotes: MeetingNote[];
  setMeetingNotes: (notes: MeetingNote[]) => void;
}

const MeetingsSection = ({ meetingNotes, setMeetingNotes }: MeetingsSectionProps) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(meetingNotes.length > 0 ? meetingNotes[0].id : null);
  const [attendeePrompt, setAttendeePrompt] = useState(false);
  const [linkPrompt, setLinkPrompt] = useState(false);
  const activeNote = meetingNotes.find(n => n.id === activeNoteId) || null;

  return (
  <div className="space-y-6">
     <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            🗒️ Meeting Notes
          </h2>
          <p className="text-sm text-gray-500 mt-1">Capture decisions and follow-up actions instantly.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => {
          const newNote: MeetingNote = { id: crypto.randomUUID(), title: 'Untitled Meeting', date: new Date().toISOString().split('T')[0], type: 'Sync', attendees: [], notes: '', actionItems: '', link: '' };
          setMeetingNotes([newNote, ...meetingNotes]);
          setActiveNoteId(newNote.id);
        }}><Plus size={16} /> New Note</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
            {meetingNotes.map((n: MeetingNote) => (
              <div key={n.id} onClick={() => setActiveNoteId(n.id)} className={cn("p-4 rounded-xl border transition-all cursor-pointer group relative", activeNoteId === n.id ? "bg-brand-accent/5 border-brand-accent/50" : "border-gray-200 bg-white hover:border-brand-accent/30")}>
       <button onClick={(e) => { e.stopPropagation(); setMeetingNotes(meetingNotes.filter(m => m.id !== n.id)); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-gray-400">{n.date ? new Date(n.date).toLocaleDateString() : 'No date'}</span>
                    <MoreHorizontal size={14} className="text-gray-300" />
                 </div>
                 <h5 className="text-sm font-bold text-gray-900 group-hover:text-brand-accent transition-colors">{n.title}</h5>
                 <div className="flex gap-2 mt-4">
                    {(n.attendees || []).map(a => <span key={a} className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{a}</span>)}
                 </div>
              </div>
            ))}
         </div>

         <Card className="lg:col-span-2 p-8 space-y-8">
            {activeNote ? (
              <>
                <div className="space-y-2">
                   <input 
                     className="text-3xl font-display font-bold text-gray-900 w-full focus:outline-none bg-transparent" 
                     placeholder="Untitled Meeting Note" 
                     value={activeNote.title}
                     onChange={(e) => setMeetingNotes(meetingNotes.map(n => n.id === activeNote.id ? { ...n, title: e.target.value } : n))}
                   />
                   <div className="flex gap-6 items-center text-xs text-gray-400">
                      <span className="flex items-center gap-2"><Calendar size={14} /> {activeNote.date ? new Date(activeNote.date).toLocaleDateString() : 'No date'}</span>
                      <span className="flex items-center gap-2 cursor-pointer hover:text-brand-accent" onClick={() => setAttendeePrompt(true)}><Users size={14} /> {(activeNote.attendees || []).length} Attendees (Click to add)</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h6 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest flex items-center gap-2">
                         <Brain size={12} /> Discussion Topic
                      </h6>
                      <textarea 
                        className="w-full min-h-[300px] text-sm text-gray-600 focus:outline-none bg-transparent leading-relaxed resize-none" 
                        placeholder="Start typing key points here..." 
                        value={activeNote.notes}
                        onChange={(e) => setMeetingNotes(meetingNotes.map(n => n.id === activeNote.id ? { ...n, notes: e.target.value } : n))}
                      />
                   </div>
                   <div className="space-y-8">
                      <div className="space-y-4 bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50">
                         <h6 className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={12} /> Action Items
                         </h6>
                         <textarea 
                           className="w-full min-h-[120px] bg-transparent text-sm text-gray-700 italic focus:outline-none leading-relaxed resize-none" 
                           placeholder="1. Finalize the Figma components..." 
                           value={activeNote.actionItems || ''}
                           onChange={(e) => setMeetingNotes(meetingNotes.map(n => n.id === activeNote.id ? { ...n, actionItems: e.target.value } : n))}
                         />
                      </div>
                      <div className="space-y-4">
                         <h6 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Resource Links</h6>
                         <div className="space-y-2">
                            {activeNote.link ? (
                              <div className="flex items-center justify-between p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs text-gray-700">
                                <a href={activeNote.link.startsWith('http') ? activeNote.link : `https://${activeNote.link}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-blue-500"><LinkIcon size={12} /> {activeNote.link}</a>
                                <button onClick={() => setMeetingNotes(meetingNotes.map(n => n.id === activeNote.id ? { ...n, link: '' } : n))} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
                              </div>
                            ) : (
                              <div onClick={() => setLinkPrompt(true)} className="flex items-center gap-3 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors"><LinkIcon size={12} /> Add asset link...</div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 italic min-h-[500px]">
                <FileText size={48} className="opacity-20 mb-4" />
                <p>Select or create a meeting note to view details</p>
              </div>
            )}
         </Card>
      </div>

      <PromptDialog
        open={attendeePrompt}
        onClose={() => setAttendeePrompt(false)}
        onSubmit={(name) => {
          if (activeNote) {
            setMeetingNotes(meetingNotes.map(n => n.id === activeNote.id ? { ...n, attendees: [...(n.attendees || []), name] } : n));
          }
        }}
        title="Add Attendee"
        placeholder="Enter attendee name..."
      />

      <PromptDialog
        open={linkPrompt}
        onClose={() => setLinkPrompt(false)}
        onSubmit={(url) => {
          if (activeNote) {
            setMeetingNotes(meetingNotes.map(n => n.id === activeNote.id ? { ...n, link: url } : n));
          }
        }}
        title="Add Resource Link"
        placeholder="https://..."
      />
  </div>
  );
};

export default MeetingsSection;
