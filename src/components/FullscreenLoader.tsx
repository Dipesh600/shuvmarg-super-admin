import LoadingSpinner from "./ui/loadingSpinner";

const FullscreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={45}/>
        <p className="text-sm text-slate-400">Loading, please wait...</p>
      </div>
    </div>
  );
};

export default FullscreenLoader;
