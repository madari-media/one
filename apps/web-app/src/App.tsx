import AppLayout from './layout/layout/default.layout.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppAuthProvider } from '@/context/AppAuthContext.tsx';
import { CatalogProvider } from '@/service/catalog/provider.tsx';

import HomePage from '@/pages/home.page.tsx';
import MetaDetails from '@/pages/meta-details.tsx';
import PersonDetails from '@/pages/person-details.tsx';
import SettingsPage from '@/pages/settings.page.tsx';
import SearchPage from '@/pages/search.page';
import ExplorePage from '@/pages/explore.page.tsx';
import { ExtensionProvider } from './context/ExtensionContext.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      {
        path: '/',
        Component: HomePage,
      },
      {
        path: '/explore',
        Component: ExplorePage,
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

export default function App() {
  return (
    <AppAuthProvider isAuthenticated={false} profiles={[]}>
      <CatalogProvider>
        <ExtensionProvider>
          <RouterProvider router={router} />
        </ExtensionProvider>
      </CatalogProvider>
    </AppAuthProvider>
  );
}
