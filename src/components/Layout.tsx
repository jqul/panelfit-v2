import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  console.log('🏗️ PanelFit: Layout render');
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#edeae2] text-[#111110] font-sans selection:bg-[#b89a7a] selection:text-white"
    >
      {children}
    </motion.div>
  );
}
