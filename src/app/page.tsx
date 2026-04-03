export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-white tracking-tight">Main Content Area</h2>
        <p className="text-muted-text text-sm max-w-lg">
          The sidebar and top navbar have been successfully integrated with a modern dark theme and glassmorphism effects. Main content will follow soon as per requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-sidebar-bg/50 border border-sidebar-border rounded-3xl p-6 relative overflow-hidden animate-pulse">
            <div className="w-12 h-12 bg-white/5 rounded-2xl mb-4" />
            <div className="w-3/4 h-4 bg-white/10 rounded-full mb-3" />
            <div className="w-1/2 h-3 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}