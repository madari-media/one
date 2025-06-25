import AppLayout from './layout/layout/default.layout.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppAuthProvider } from '@/context/AppAuthContext.tsx';

import HomePage from '@/pages/home.page.tsx';
import MetaDetails from '@/pages/meta-details.tsx';
import PersonDetails from '@/pages/person-details.tsx';
import SettingsPage from '@/pages/settings.page.tsx';
import SearchPage from '@/pages/search.page';
import LoginPage from '@/pages/login.page.tsx';
import { ProtectedRoute } from '@/components/ProtectedRoute.tsx';
import { CatalogConnectionProvider } from '@/context/CatalogConnectionContext.tsx';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext.tsx';
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
      <PlayerProvider>
        <AppWithPlayer />
      </PlayerProvider>
    </AppAuthProvider>
  );
}
