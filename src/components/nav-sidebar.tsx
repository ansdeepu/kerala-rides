'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Shield, HelpCircle, LogOut, Share2, User as UserIcon, Bus } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { KeralaRidesLogo } from './icons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavSidebarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export function NavSidebar({ 
    searchQuery, 
    setSearchQuery,
}: NavSidebarProps) {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const router = useRouter();
  const auth = getAuth();

  React.useEffect(() => {
    if (user && user.email === 'ss.deepu@gmail.com') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const userInitial = user?.displayName?.charAt(0).toUpperCase() || <UserIcon />;

  return (
      <div className="flex flex-col h-full w-80 bg-card p-4 border-r">
        <header className="flex items-center gap-2 mb-6 px-4">
          <KeralaRidesLogo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold font-headline">Kerala Rides</h1>
        </header>

        <div className="relative mb-4 px-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Global search..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <nav className="flex flex-col gap-1 px-4 mb-2">
            <Button variant="secondary" className="justify-start" asChild>
                <Link href="/">
                    <Bus />
                    All Routes
                </Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/admin">
                  <Shield />
                  Admin Panel
                </Link>
              </Button>
            )}
            <Button variant="ghost" className="justify-start" asChild>
                <Link href="/help">
                    <HelpCircle />
                    Help
                </Link>
            </Button>
            <Button variant="ghost" className="justify-start">
                <Share2 />
                Share App
            </Button>
        </nav>
        
        <Separator className="mx-4 my-4" />

        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto p-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="text-left overflow-hidden">
                    <p className="font-semibold text-sm truncate">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" side="top" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
  );
}
