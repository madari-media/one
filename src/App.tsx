import AppLayout from './layout/layout/default.layout.tsx';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { AppAuthProvider } from '@/context/AppAuthContext.tsx';

import HomePage from '@/pages/home.page.tsx';
import MetaDetails from '@/pages/meta-details.tsx';
import PersonDetails from '@/pages/person-details.tsx';
import SettingsPage from '@/pages/settings.page.tsx';
import SearchPage from '@/pages/search.page';
import ArrAppsPage from '@/pages/arr-apps.page.tsx';
import ArrAppsConfiguration from '@/features/arr-apps/components/ArrAppsConfiguration';
import SeriesMoviesSection from '@/features/arr-apps/components/SeriesMoviesSection';
import AddNewSection from '@/features/arr-apps/components/AddNewSection';
import CalendarSection from '@/features/arr-apps/components/CalendarSection';
import ActivitySection from '@/features/arr-apps/components/ActivitySection';
import HistorySection from '@/features/arr-apps/components/HistorySection';
import DownloadsSection from '@/features/arr-apps/components/DownloadsSection';
import LoginPage from '@/pages/login.page.tsx';
import { ProtectedRoute } from '@/components/ProtectedRoute.tsx';
import { CatalogConnectionProvider } from '@/context/CatalogConnectionContext.tsx';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext.tsx';
import { ArrAppsProvider } from '@/context/ArrAppsContext.tsx';
import { MiniPlayer } from '@/components/MiniPlayer.tsx';

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <CatalogConnectionProvider>
        <LoginPage />
      </CatalogConnectionProvider>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        Component: HomePage,
      },
      {
        path: '/meta/:meta',
        Component: MetaDetails,
      },
      {
        path: '/person/:person',
        Component: PersonDetails,
      },
      {
        path: '/settings',
        Component: SettingsPage,
      },
      {
        path: '/search',
        Component: SearchPage,
      },
      {
        path: '/arr-apps',
        Component: ArrAppsPage,
        children: [
          {
            index: true,
            element: <Navigate to="configuration" replace />,
          },
          {
            path: 'configuration',
            Component: ArrAppsConfiguration,
          },
          {
            path: 'series-movies',
            Component: SeriesMoviesSection,
          },
          {
            path: 'add-new',
            Component: AddNewSection,
          },
          {
            path: 'calendar',
            Component: CalendarSection,
          },
          {
            path: 'activity',
            Component: ActivitySection,
          },
          {
            path: 'history',
            Component: HistorySection,
          },
          {
            path: 'downloads',
            Component: DownloadsSection,
          },
        ],
      },
    ],
  },
]);

function AppWithPlayer() {
  const { queue, currentIndex, isPlayerVisible, setQueue, setCurrentIndex, hidePlayer } = usePlayer();

  return (
    <>
      <RouterProvider router={router} />
      {isPlayerVisible && queue.length > 0 && (
        <MiniPlayer
          queue={queue}
          currentIndex={currentIndex}
          onQueueChange={setQueue}
          onCurrentIndexChange={setCurrentIndex}
          onClose={hidePlayer}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppAuthProvider isAuthenticated={true} profiles={[{id: '1', label: 'User', icon: '', isKid: false}]}>
      <ArrAppsProvider>
        <PlayerProvider>
          <AppWithPlayer />
        </PlayerProvider>
      </ArrAppsProvider>
    </AppAuthProvider>
  );
}
