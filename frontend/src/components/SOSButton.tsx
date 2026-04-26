"use client";

interface SOSButtonProps {
  onPress: () => void;
}

export default function SOSButton({ onPress }: SOSButtonProps) {
  return (
    <button
      onClick={onPress}
      className="w-24 h-24 rounded-full bg-red-500/40 backdrop-blur-sm flex items-center justify-center text-white tracking-[0.22em] font-light text-[0.95rem] hover:bg-red-500/50 active:scale-95 transition-all"
    >
      S.O.S
    </button>
  );
}
