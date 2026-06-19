const AppFooter = () => {
  return (
    <footer className="mt-auto py-8 px-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm relative z-10">

      <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-6">
        <span>Enterprise Workspace Intelligence</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span>v2.4.0-Production</span>
      </div>
    </footer>
  );
};

export default AppFooter;
