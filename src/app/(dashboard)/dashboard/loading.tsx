export default function DashboardLoading() {
  return (
    <>
      {/* Mobile Skeleton — < md */}
      <div className="md:hidden animate-pulse">
        {/* Search */}
        <div className="h-10 rounded-xl bg-white/70 mb-4" />

        {/* Date header */}
        <div className="flex items-center justify-between mb-5">
          <div className="h-5 w-40 rounded-md bg-white/70" />
          <div className="h-7 w-20 rounded-lg bg-white/70" />
        </div>

        {/* Week strip */}
        <div className="grid grid-cols-7 gap-1 mb-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-1">
              <div className="h-9 w-9 rounded-full bg-white/70" />
              <div className="h-2.5 w-6 rounded bg-white/60 mt-1" />
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-3">
          <div className="h-8 w-20 rounded-full bg-white/60" />
          <div className="h-8 w-24 rounded-full bg-white/60" />
          <div className="h-8 w-16 rounded-full bg-white/60" />
        </div>

        {/* Timeline body */}
        <div className="rounded-2xl bg-white/80 h-[60vh]" />
      </div>

      {/* Desktop Skeleton — md+ */}
      <div className="hidden md:flex gap-6 animate-pulse">
        {/* Sidebar */}
        <div className="hidden lg:block w-[260px] shrink-0 space-y-6">
          <div className="rounded-2xl bg-white/80 h-72" />
          <div className="rounded-2xl bg-white/80 h-56" />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search */}
          <div className="h-10 max-w-xl rounded-xl bg-white/70" />

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="h-9 w-64 rounded-md bg-white/70" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-16 rounded-xl bg-white/60" />
              <div className="h-10 w-20 rounded-xl bg-white/70" />
              <div className="h-10 w-20 rounded-xl bg-white/60" />
            </div>
          </div>

          {/* Calendar grid */}
          <div className="rounded-2xl bg-white/80 h-[70vh]" />
        </div>
      </div>
    </>
  );
}
