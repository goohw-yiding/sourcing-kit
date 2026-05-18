export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
      <div className="bg-gray-200 rounded-xl w-full h-36 mb-3" />
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2" />
      <div className="bg-gray-200 rounded h-3 w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 animate-pulse flex items-center gap-3">
      <div className="bg-gray-200 rounded-full w-10 h-10 flex-shrink-0" />
      <div className="flex-1">
        <div className="bg-gray-200 rounded h-4 w-2/3 mb-2" />
        <div className="bg-gray-200 rounded h-3 w-1/3" />
      </div>
    </div>
  );
}
