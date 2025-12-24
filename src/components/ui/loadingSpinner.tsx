import { motion } from "framer-motion";

const LoadingSpinner = ({ size = 40 }: { size?: number }) => {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        style={{ width: size, height: size }}
        className="rounded-full border-4 border-slate-700 border-t-emerald-500"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1,
          ease: "linear",
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
