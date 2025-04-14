import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Plug, Settings, Tv } from 'lucide-react';
import SettingsTabs from '@/features/settings/components/SettingsTabs';
import ContentProviderSettings from '@/features/settings/components/ContentProviderSettings';
import { ExtensionSettings } from '@/features/settings/components/ExtensionSettings';
import TraktSettings from '@/features/settings/components/TraktSettings';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const SettingsPage: React.FC = () => {
  const tabs = [
    {
      id: 'content',
      label: 'Content Providers',
      icon: <Tv className="w-5 h-5" />,
      component: <ContentProviderSettings />,
    },
    {
      id: 'extensions',
      label: 'Extensions',
      icon: <Plug className="w-5 h-5" />,
      component: <ExtensionSettings />,
    },
    {
      id: 'trakt',
      label: 'Trakt Integration',
      icon: <BarChart2 className="w-5 h-5" />,
      component: <TraktSettings />,
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-zinc-900 pt-12 text-white"
    >
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 mb-8"
        >
          <Settings className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SettingsTabs tabs={tabs} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;