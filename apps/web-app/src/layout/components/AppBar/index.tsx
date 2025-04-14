import { Button } from '@/components/ui/button';
import {
  Bell,
  Cast,
  Compass,
  Film,
  Home as HomeIcon,
  Menu,
  Navigation,
  Search as SearchIcon,
  Settings,
  Tv,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import { Link, useLocation, useNavigate } from 'react-router';
import { selectedContentTypeAtom, sidebarOpenAtom } from '@/layout/atoms.ts';
import Search from '../Search';
import ProfileMenu from '@/layout/components/ProfileMenu';

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = ({ icon, label, isActive, onClick }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200',
        isActive ? 'text-red-500' : 'text-zinc-400 hover:text-red-500',
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-xl transition-all duration-200',
          isActive ? 'bg-red-500/10' : 'hover:bg-red-500/10',
        )}
      >
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

export default function TopBar() {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(sidebarOpenAtom);
  const [selectedContentType, setSelectedContentType] = useAtom(
    selectedContentTypeAtom,
  );
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleContentTypeClick = (type: 'movie' | 'tv') => {
    if (selectedContentType === type) {
      setSelectedContentType(null);
    } else {
      setSelectedContentType(type);
    }
  };

  const isMobile = window.innerWidth < 768;
  const isSearchPage = location.pathname === '/search';
  const isHomePage = location.pathname === '/';

  return (
    <>
      {/* Top Bar - Hide on search page */}
      {!isSearchPage && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 shadow-lg z-50 md:top-2 md:left-2 md:right-2 md:rounded-2xl md:border-b-0 md:border">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl',
                    isSidebarOpen && 'text-red-500',
                  )}
                  onClick={toggleSidebar}
                >
                  <Menu size={20} />
                </Button>
              )}

              <Link to="/" className="flex justify-center content-center gap-2">
                <img
                  src="https://web.madari.media/assets/assets/icon/icon_mini.png"
                  alt="Madari"
                  className="h-6"
                />

                <h1 className="heading-font text-white self-center">
                  Madari One
                </h1>
              </Link>

              <div className="flex items-center gap-2 ml-4">
                {!isMobile && isHomePage && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl',
                        selectedContentType === null &&
                          'text-red-500 bg-red-500/10',
                      )}
                      onClick={() => setSelectedContentType(null)}
                    >
                      <HomeIcon size={16} className="mr-2" />
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl',
                        selectedContentType === 'movie' &&
                          'text-red-500 bg-red-500/10',
                      )}
                      onClick={() => handleContentTypeClick('movie')}
                    >
                      <Film size={16} className="mr-2" />
                      Movies
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl',
                        selectedContentType === 'tv' &&
                          'text-red-500 bg-red-500/10',
                      )}
                      onClick={() => handleContentTypeClick('tv')}
                    >
                      <Tv size={16} className="mr-2" />
                      TV Shows
                    </Button>
                  </>
                )}

                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl',
                      location.pathname === '/explore' &&
                        'text-red-500 bg-red-500/10',
                    )}
                    onClick={() => navigate('/explore')}
                  >
                    <Compass size={16} className="mr-2" />
                    Explore
                  </Button>
                )}
              </div>

              {!isMobile && (
                <div className="md:ml-4">
                  <Search />
                </div>
              )}
            </div>

            {/* Right Section - Only show on desktop */}
            {!isMobile ? (
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl relative"
                >
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                  onClick={() => navigate('/settings')}
                >
                  <Settings size={20} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                >
                  <Cast size={20} />
                </Button>

                <ProfileMenu />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                >
                  <Cast size={20} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar - Always visible */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 z-50">
          <div className="flex items-center justify-around h-full px-1">
            <TabButton
              icon={<HomeIcon size={20} />}
              label="Home"
              isActive={location.pathname === '/'}
              onClick={() => navigate('/')}
            />
            <TabButton
              icon={<SearchIcon size={20} />}
              label="Search"
              isActive={location.pathname === '/search'}
              onClick={() => navigate('/search')}
            />
            <TabButton
              icon={<Navigation size={20} />}
              label="Explore"
              isActive={location.pathname === '/explore'}
              onClick={() => navigate('/explore')}
            />
            <TabButton
              icon={<Settings size={20} />}
              label="Settings"
              isActive={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
            />
          </div>
        </div>
      )}
    </>
  );
}
