import {Loader} from "@/components/Loader";

function Bone({className = ""}: {className?: string}) {
  return <div className={`skeleton-bone ${className}`} />;
}

export function SessionSkeleton() {
  return (
    <div className="session-skeleton">
      <Loader size="lg" label="Uruchamianie Valora" />
    </div>
  );
}

export function AppLoadingSkeleton() {
  return (
    <div className="page-enter mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <Bone className="h-3 w-24" />
        <Bone className="h-10 w-48 sm:w-64" />
        <Bone className="h-4 w-full max-w-xl" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Bone className="h-10 w-full max-w-xs rounded-full" />
        <div className="flex gap-2">
          <Bone className="h-10 w-36 rounded-xl" />
          <Bone className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      <div className="surface-strong rounded-[1.5rem] p-6 sm:p-8">
        <Bone className="h-3 w-28" />
        <Bone className="mt-4 h-14 w-56 sm:w-72" />
        <Bone className="mt-3 h-6 w-32" />
        <div className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
          <Bone className="h-16 rounded-xl" />
          <Bone className="h-16 rounded-xl" />
          <Bone className="h-16 rounded-xl" />
        </div>
      </div>

      <div className="space-y-3">
        <Bone className="h-7 w-56" />
        <Bone className="h-36 w-full rounded-[1.25rem]" />
        <Bone className="h-36 w-full rounded-[1.25rem]" />
      </div>

      <div className="flex justify-center pt-2">
        <Loader size="sm" label="Ładowanie portfela" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Ładowanie pulpitu">
      <div className="dash-toolbar">
        <Bone className="h-10 w-full max-w-xs rounded-full" />
        <div className="dash-toolbar-actions">
          <Bone className="h-10 w-40 rounded-xl" />
          <Bone className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      <div className="surface-strong relative overflow-hidden rounded-[1.25rem] p-5 sm:rounded-[1.5rem] sm:p-7 md:p-9">
        <Bone className="h-3 w-28" />
        <Bone className="mt-4 h-12 w-52 sm:h-14 sm:w-72" />
        <Bone className="mt-3 h-6 w-28" />
        <div className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-7 w-28" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-24" />
            <Bone className="h-7 w-32" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-28" />
            <Bone className="h-7 w-20" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <Bone className="h-7 w-56" />
          <Bone className="h-4 w-16" />
        </div>
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="surface rounded-[1.25rem] border border-line p-5 md:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <Bone className="h-7 w-36" />
                <Bone className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Bone className="h-3 w-28" />
                <Bone className="h-8 w-32" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line/80 pt-5 lg:grid-cols-4">
              <Bone className="h-12 rounded-lg" />
              <Bone className="h-12 rounded-lg" />
              <Bone className="h-12 rounded-lg" />
              <Bone className="h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
