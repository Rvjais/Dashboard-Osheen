import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import AlertDialog from '../ui/AlertDialog';
import { Role, User } from '../../types';

interface TeamSectionProps {
  team: User[];
  onAddMember: (u: { name?: string; email?: string; password?: string; role?: Role }) => void;
  onDeleteMember: (id: string) => void;
  onMessageMember?: (memberId: string) => void;
}

const TeamSection = ({ team, onAddMember, onDeleteMember, onMessageMember }: TeamSectionProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<{ name?: string; email?: string; password?: string; role?: Role }>({ name: '', role: Role.EMPLOYEE, email: '', password: '' });
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              👥 Team Panel
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage team capacity and see real-time availability.</p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setShowAddForm(true)}>
             <Plus size={16} /> Add Member
          </Button>
        </div>

        {showAddForm && (
          <Card className="bg-white border-2 border-brand-accent/20 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Enroll New Employee</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}><X size={20} /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Full Name</label>
                  <input 
                    className="w-full mt-1 p-2 bg-gray-50 border rounded-lg focus:ring-1 ring-brand-accent outline-none"
                    placeholder="John Doe"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Role</label>
                  <select 
                    className="w-full mt-1 p-2 bg-gray-50 border rounded-lg"
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value as Role})}
                  >
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Email Address</label>
                  <input 
                    type="email"
                    className="w-full mt-1 p-2 bg-gray-50 border rounded-lg font-mono"
                    placeholder="employee@company.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Initial Password</label>
                  <input 
                    type="password"
                    className="w-full mt-1 p-2 bg-gray-50 border rounded-lg"
                    placeholder="••••••••"
                    value={newMember.password}
                    onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                  />
                </div>
                <div className="pt-6">
                   <Button className="w-full" onClick={() => {
                     if (!newMember.name || !newMember.email || !newMember.password) {
                       setValidationAlert('Fill all required fields');
                       return;
                     }
                     onAddMember(newMember);
                     setShowAddForm(false);
                     setNewMember({ name: '', role: Role.EMPLOYEE, email: '', password: '' });
                   }}>Enroll Member</Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map(member => (
            <Card key={member.id} className="p-0 overflow-hidden group">
               <div className="h-1 bg-gray-100 w-full group-hover:bg-brand-accent transition-all" />
               <div className="p-6">
                 <div className="flex items-start justify-between mb-4">
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm" style={{ backgroundColor: member.avatarColor || '#EF4444', color: 'white' }}>
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col items-end gap-1">
                       <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">{member.status || 'Active'}</span>
                       <span className="text-lg">{member.mood || '✨'}</span>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-900">{member.name}</h4>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">{member.role}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-2">{member.email}</p>
                 </div>
                 
                 <div className="mt-6 space-y-4">
                    <div className="space-y-1">
                       <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                          <span>Capacity</span>
                          <span>{member.capacity || 0}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${member.capacity || 0}%` }} className={cn("h-full", (member.capacity || 0) > 85 ? 'bg-red-500' : 'bg-emerald-500')} />
                       </div>
                    </div>
                 </div>

                  <div className="mt-8 flex gap-2">
                    {onMessageMember && <Button variant="secondary" className="flex-1 text-[10px] h-8" onClick={() => onMessageMember(member.id)}>Message</Button>}
                    <button 
                      onClick={() => onDeleteMember(member.id)}
                      className="p-1 px-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
               </div>
            </Card>
          ))}
        </div>

        <AlertDialog
          open={!!validationAlert}
          onClose={() => setValidationAlert(null)}
          title="Validation Error"
          message={validationAlert || ''}
          variant="error"
        />
    </div>
  );
};

export default TeamSection;
