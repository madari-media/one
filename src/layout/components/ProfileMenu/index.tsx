import { useNavigate } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';

export default function ProfileMenu() {
  const navigate = useNavigate();
  const { profiles, selectedProfile, setSelectedProfile } =
    useAppAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const goToProfiles = () => {
    navigate('/profiles');
  };

  const handleSignOut = () => {
    // Add sign out logic here if needed
    console.log('Signing out...');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border border-gray-700">
            {selectedProfile?.icon ? (
              <AvatarImage
                src={selectedProfile.icon}
                alt={selectedProfile.label}
              />
            ) : (
              <AvatarFallback className="bg-gray-800 text-gray-200">
                {selectedProfile ? getInitials(selectedProfile.label) : 'U'}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {selectedProfile ? selectedProfile.label : 'Default Profile'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {profiles.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-gray-500">
              Profiles
            </DropdownMenuLabel>
            {profiles.map((profile) => (
              <DropdownMenuItem
                key={profile.id}
                className={`cursor-pointer ${
                  selectedProfile?.id === profile.id
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : ''
                }`}
                onClick={() => setSelectedProfile(profile)}
              >
                <Avatar className="h-6 w-6 mr-2">
                  {profile.icon ? (
                    <AvatarImage src={profile.icon} alt={profile.label} />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {getInitials(profile.label)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span>{profile.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => goToProfiles()}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Manage Profiles</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-500 hover:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
