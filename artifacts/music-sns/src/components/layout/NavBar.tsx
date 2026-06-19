import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { stringToColor } from "@/lib/color-utils";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, User as UserIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function NavBar() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto max-w-2xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(157,78,221,0.5)]">
            <span className="text-white font-bold text-lg leading-none mt-[-2px]">音</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white hidden sm:inline-block">音楽SNS</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 outline-none rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform hover:scale-105 active:scale-95">
                  <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                    <AvatarFallback 
                      style={{ backgroundColor: stringToColor(user.username), color: 'white' }}
                      className="font-bold text-sm"
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-white/10">
                <DropdownMenuItem asChild className="cursor-pointer font-medium">
                  <Link href={`/profile/${user.username}`} className="flex items-center w-full">
                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    プロフィール
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-white">
                <Link href="/login">ログイン</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_10px_rgba(157,78,221,0.3)]">
                <Link href="/register">新規登録</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
