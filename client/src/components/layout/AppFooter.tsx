const AppFooter = () => {
  return (
    <footer className="mt-auto py-8 px-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm relative z-10">
      <div className="flex items-center gap-4 group">
        <div className="w-8 h-[1px] bg-gray-300 group-hover:w-12 group-hover:bg-brand-accent transition-all duration-500" />
        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.3em]">
          Developed with <span className="text-rose-400 group-hover:animate-pulse">♥</span> by
          <span className="text-gray-900 font-bold ml-2 group-hover:text-brand-accent transition-colors">Dr. Osheen Agrawal</span>
        </p>
      </div>
      <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-6">
        <span>Enterprise Workspace Intelligence</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span>v2.4.0-Production</span>
      </div>
    </footer>
  );
};

export default AppFooter;
