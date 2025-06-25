import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, Clock, Download, Film, Plus, Settings, Tv } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { ArrAppsProvider } from '@/context/ArrAppsContext';

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

const tabVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const ArrAppsPage: React.FC = () => {
  const location = useLocation();

  const navigation = [
    {
      to: '/arr-apps/series-movies',
      label: 'Library',
      icon: <Tv className="w-4 h-4" />,
    },
    {
      to: '/arr-apps/add-new',
      label: 'Add New',
      icon: <Plus className="w-4 h-4" />,
    },
    {
      to: '/arr-apps/downloads',
      label: 'Downloads',
      icon: <Download className="w-4 h-4" />,
    },
    {
      to: '/arr-apps/calendar',
      label: 'Calendar',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      to: '/arr-apps/activity',
      label: 'Activity',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      to: '/arr-apps/history',
      label: 'History',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      to: '/arr-apps/configuration',
      label: 'Configuration',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <ArrAppsProvider>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-background dark:bg-background pt-16"
      >
        <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
          <motion.div
            variants={itemVariants}
            className="mb-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 shadow-lg">
                  <Film className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground dark:text-foreground tracking-tight">
                    Media Center
                  </h1>
                  <p className="text-muted-foreground text-lg mt-1">
                    Manage your Sonarr, Radarr, and qBittorrent applications
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-8">
              <nav className="inline-flex flex-wrap gap-1 p-1 bg-card dark:bg-card/40 rounded-lg border border-border dark:border-border/50 shadow-sm">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.to}
                    variants={tabVariants}
                    custom={index}
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`
                      }
                    >
                      <span className={`transition-all duration-200 ${
                        location.pathname === item.to
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground group-hover:text-primary'
                      }`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
            </div>

            <motion.div 
              variants={itemVariants}
              className="bg-card dark:bg-card/40 rounded-xl border border-border dark:border-border/50 shadow-xl"
            >
              <div className="p-8">
                <Outlet />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </ArrAppsProvider>
  );
};

export default ArrAppsPage;