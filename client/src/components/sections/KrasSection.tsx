import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Target, Calendar, AlertTriangle, CheckCircle, BarChart3, Clock, Sparkles } from 'lucide-react';
import { krasAPI } from '../../services/api';
import { Kra, User, Role } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';

interface KrasSectionProps {
  session: { user: User };
  team: User[];
}

export default function KrasSection({ session, team }: KrasSectionProps) {
  const queryClient = useQueryClient();
  const isAdmin = session.user.role === Role.ADMIN;

  // --- States ---
  const [selectedUserId, setSelectedUserId] = useState<string>(session.user.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKra, setEditingKra] = useState<Kra | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWeightage, setFormWeightage] = useState<number>(20);
  const [formTarget, setFormTarget] = useState('');
  const [formTimeframe, setFormTimeframe] = useState('');
  const [formStatus, setFormStatus] = useState<Kra['status']>('In Progress');
  const [formUserId, setFormUserId] = useState<string>(selectedUserId);

  // --- Queries ---
  const { data: kras = [], isLoading } = useQuery<Kra[]>({
    queryKey: ['kras', selectedUserId],
    queryFn: () => krasAPI.getAll(selectedUserId).then(res => res.data.kras),
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: Partial<Kra>) => krasAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kras'] });
      setIsFormOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; data: Partial<Kra> }) => krasAPI.update(args.id, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kras'] });
      setIsFormOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => krasAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kras'] });
    }
  });

  // --- Handlers & Helpers ---
  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormWeightage(20);
    setFormTarget('');
    setFormTimeframe('');
    setFormStatus('In Progress');
    setFormUserId(selectedUserId);
    setEditingKra(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setFormUserId(selectedUserId);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (kra: Kra) => {
    setEditingKra(kra);
    setFormTitle(kra.title);
    setFormDescription(kra.description || '');
    setFormWeightage(kra.weightage || 0);
    setFormTarget(kra.target || '');
    setFormTimeframe(kra.timeframe || '');
    setFormStatus(kra.status);
    setFormUserId(kra.userId);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formUserId) return;

    const payload = {
      userId: formUserId,
      title: formTitle,
      description: formDescription,
      weightage: Number(formWeightage),
      target: formTarget,
      timeframe: formTimeframe,
      status: formStatus
    };

    if (editingKra) {
      updateMutation.mutate({ id: editingKra.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  // Calculations
  const totalWeight = kras.reduce((sum, k) => sum + (k.weightage || 0), 0);
  const statusCounts = kras.reduce((acc, k) => {
    acc[k.status] = (acc[k.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const selectedUser = team.find(u => u.id === selectedUserId) || session.user;

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold flex items-center gap-3 text-gray-900">
            🎯 Key Result Areas (KRAs)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Establish, view, and monitor core work benchmarks for the team.
          </p>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={handleOpenCreateModal}
            className="bg-brand-accent hover:bg-brand-accent/90 text-white rounded-2xl py-3 px-5 shadow-lg shadow-brand-accent/20 font-bold flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create KRA</span>
          </Button>
        )}
      </div>

      {/* User Selector Dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-gray-100 rounded-[24px] shadow-sm">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white uppercase"
            style={{ backgroundColor: selectedUser.avatarColor || '#EF4444' }}
          >
            {selectedUser.name.charAt(0)}
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Employee Focus</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="text-base font-bold text-gray-900 border-none bg-transparent p-0 pr-8 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value={session.user.id}>{session.user.name} (You)</option>
              {team
                .filter(u => u.id !== session.user.id)
                .map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role === Role.ADMIN ? 'Admin' : 'Employee'})
                  </option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Dynamic Weightage Alert */}
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Total Weightage</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-sm font-extrabold ${
                totalWeight === 100 
                  ? 'text-emerald-600' 
                  : totalWeight > 100 
                    ? 'text-rose-600' 
                    : 'text-amber-500'
              }`}>
                {totalWeight}% / 100%
              </span>
              {totalWeight === 100 ? (
                <CheckCircle size={14} className="text-emerald-500" />
              ) : (
                <AlertTriangle size={14} className={totalWeight > 100 ? 'text-rose-500' : 'text-amber-500'} />
              )}
            </div>
          </div>
          {totalWeight !== 100 && (
            <p className="text-[10px] text-gray-500 max-w-[200px] leading-tight border-l border-gray-200 pl-3">
              {totalWeight > 100 
                ? 'Allocated weightage exceeds 100%. Please reduce individual weights.'
                : 'Allocated weightage is under 100%. Please add more key results.'
              }
            </p>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-white border border-gray-100 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Target size={22} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active KRAs</p>
            <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{kras.length}</h4>
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Completed / Exceeded</p>
            <h4 className="text-2xl font-bold text-gray-900 mt-0.5">
              {(statusCounts['Completed'] || 0) + (statusCounts['Exceeded'] || 0)}
            </h4>
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">In Progress</p>
            <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{statusCounts['In Progress'] || 0}</h4>
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average Weight</p>
            <h4 className="text-2xl font-bold text-gray-900 mt-0.5">
              {kras.length ? Math.round(totalWeight / kras.length) : 0}%
            </h4>
          </div>
        </div>
      </div>

      {/* Main KRAs Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500 mt-4 font-medium">Loading Key Result Areas...</p>
        </div>
      ) : kras.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-[32px] shadow-sm flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/5 flex items-center justify-center text-brand-accent mb-4">
            <Target size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No KRAs established</h3>
          <p className="text-sm text-gray-500 max-w-sm mt-2 leading-relaxed">
            {isAdmin 
              ? 'Get started by creating key performance markers and goals for this employee.'
              : 'Key Result Areas have not been assigned to you yet. Check back later or reach out to your administrator.'
            }
          </p>
          {isAdmin && (
            <Button 
              onClick={handleOpenCreateModal} 
              className="mt-6 rounded-2xl bg-brand-accent text-white"
            >
              Set First KRA
            </Button>
          )}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {kras.map(kra => {
            // Status colors
            const statusConfig = {
              'Pending': 'bg-amber-50 text-amber-600 border border-amber-200/55',
              'In Progress': 'bg-sky-50 text-sky-600 border border-sky-200/55',
              'Completed': 'bg-emerald-50 text-emerald-600 border border-emerald-200/55',
              'Exceeded': 'bg-purple-50 text-purple-600 border border-purple-200/55',
              'Not Met': 'bg-rose-50 text-rose-600 border border-rose-200/55'
            };

            return (
              <motion.div key={kra.id} variants={cardVariants}>
                <Card 
                  className="bg-white border border-gray-100 rounded-[32px] p-6 hover:shadow-xl hover:shadow-gray-100 hover:border-brand-accent/15 transition-all duration-500 flex flex-col justify-between h-full relative overflow-hidden group"
                >
                  <div className="space-y-4">
                    {/* Card Header Info */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusConfig[kra.status]}`}>
                          {kra.status}
                        </span>
                        {kra.timeframe && (
                          <span className="text-[10px] font-bold px-3 py-1 bg-gray-50 border border-gray-100 text-gray-500 rounded-full flex items-center gap-1.5">
                            <Calendar size={10} />
                            {kra.timeframe}
                          </span>
                        )}
                      </div>
                      
                      {/* Weightage Circle */}
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Weight</span>
                        <span className="text-lg font-black text-gray-900">{kra.weightage}%</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-accent transition-colors leading-snug">
                        {kra.title}
                      </h3>
                      {kra.description && (
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed whitespace-pre-line">
                          {kra.description}
                        </p>
                      )}
                    </div>

                    {/* Target Segment */}
                    {kra.target && (
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mt-3 space-y-1 relative">
                        <div className="absolute top-0 right-0 p-3 text-gray-300 opacity-20 pointer-events-none">
                          <Sparkles size={24} />
                        </div>
                        <span className="text-[9px] uppercase font-extrabold text-brand-accent tracking-wider block">
                          Performance Target
                        </span>
                        <p className="text-xs font-semibold text-gray-800 leading-normal">
                          {kra.target}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Admin actions block */}
                  {isAdmin && (
                    <div className="flex justify-end gap-2 pt-5 mt-4 border-t border-gray-100/80">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(kra)}
                        className="p-2 rounded-xl text-gray-400 hover:text-brand-accent hover:bg-gray-50 transition-all"
                      >
                        <Edit2 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(kra.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create / Edit Form Modal */}
      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingKra ? 'Modify Key Result Area' : 'Establish New KRA'}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target User Selector (Admin only) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Target Employee</label>
            <select
              value={formUserId}
              onChange={(e) => setFormUserId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-2xl text-sm font-semibold focus:outline-none transition-colors"
              required
            >
              <option value="">Select Employee...</option>
              <option value={session.user.id}>{session.user.name} (You)</option>
              {team
                .filter(u => u.id !== session.user.id)
                .map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))
              }
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">KRA Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Sales Conversion Optimization"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-2xl text-sm font-semibold focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Weightage */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Weightage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formWeightage}
                onChange={(e) => setFormWeightage(Number(e.target.value))}
                placeholder="20"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-2xl text-sm font-semibold focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Timeframe</label>
              <input
                type="text"
                value={formTimeframe}
                onChange={(e) => setFormTimeframe(e.target.value)}
                placeholder="e.g. Q2 2026"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-2xl text-sm font-semibold focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as Kra['status'])}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-2xl text-sm font-semibold focus:outline-none transition-colors"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Exceeded">Exceeded</option>
              <option value="Not Met">Not Met</option>
            </select>
          </div>

          {/* Performance Target Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Performance Target</label>
            <textarea
              value={formTarget}
              onChange={(e) => setFormTarget(e.target.value)}
              placeholder="Describe the measurable target (e.g. Increase product conversions from 2.1% to 3.5%)"
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-2xl text-sm font-semibold focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Additional details and scope of work..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-2xl text-sm font-semibold focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 rounded-2xl py-3"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 rounded-2xl py-3 bg-brand-accent text-white hover:bg-brand-accent/90"
            >
              {editingKra ? 'Save Changes' : 'Establish KRA'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        title="Delete Key Result Area?"
        message="This KRA will be permanently deleted and removed from the target employee's roster."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}
