import { Button } from '@/components/ui/button';
import { Cast, Download, Film, Home as HomeIcon, LogOut, Menu, Search as SearchIcon, Settings, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';
import { Link, useLocation, useNavigate } from 'react-router';
import { selectedContentTypeAtom, sidebarOpenAtom } from '@/layout/atoms.ts';
import Search from '../Search';

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
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary',
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-xl transition-all duration-200',
          isActive ? 'bg-primary/10' : 'hover:bg-primary/10',
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
    if (location.pathname !== '/') {
      navigate('/');
    }
    if (selectedContentType === type) {
      setSelectedContentType(null);
    } else {
      setSelectedContentType(type);
    }
  };

  const handleSignOut = () => {
    console.log('Signing out...');
  };

  const isMobile = window.innerWidth < 768;
  const isSearchPage = location.pathname === '/search';

  return (
    <>
      {/* Top Bar - Hide on search page */}
      {!isSearchPage && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-background/95 dark:bg-background/90 backdrop-blur-md border-b border-border shadow-lg z-50 md:top-2 md:left-2 md:right-2 md:rounded-2xl md:border-b-0 md:border">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl',
                    isSidebarOpen && 'text-primary',
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

                <h1 className="heading-font text-foreground self-center">
                  Madari One
                </h1>
              </Link>

              <div className="flex items-center gap-2 ml-4">
                {!isMobile && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl',
                        selectedContentType === null && location.pathname === '/' &&
                          'text-primary bg-primary/10',
                      )}
                      onClick={() => {
                        setSelectedContentType(null);
                        navigate('/');
                      }}
                    >
                      <HomeIcon size={16} className="mr-2" />
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl',
                        selectedContentType === 'movie' && location.pathname === '/' &&
                          'text-primary bg-primary/10',
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
                        'text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl',
                        selectedContentType === 'tv' && location.pathname === '/' &&
                          'text-primary bg-primary/10',
                      )}
                      onClick={() => handleContentTypeClick('tv')}
                    >
                      <Tv size={16} className="mr-2" />
                      TV Shows
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl',
                        location.pathname.startsWith('/arr-apps') &&
                          'text-primary bg-primary/10',
                      )}
                      onClick={() => navigate('/arr-apps/series-movies')}
                    >
                      <Download size={16} className="mr-2" />
                      Arr Apps
                    </Button>
                  </>
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
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                  onClick={() => navigate('/settings')}
                >
                  <Settings size={20} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                >
                  <Cast size={20} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
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
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-background/95 dark:bg-background/90 backdrop-blur-md border-t border-border z-50">
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
              icon={<Download size={20} />}
              label="Arr Apps"
              isActive={location.pathname.startsWith('/arr-apps')}
              onClick={() => navigate('/arr-apps/series-movies')}
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
