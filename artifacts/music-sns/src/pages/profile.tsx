import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { 
  useGetUser, 
  useGetUserPosts, 
  useGetMe, 
  useUpdateBio,
  getGetUserQueryKey
} from "@workspace/api-client-react";
import { PostCard } from "@/components/post/PostCard";
import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { stringToColor } from "@/lib/color-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Edit2, Loader2, Music, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useGetMe({ query: { retry: false } });
  const isOwnProfile = currentUser?.username === username;

  const { data: profile, isLoading: profileLoading, error: profileError } = useGetUser(username, {
    query: { enabled: !!username }
  });
  
  const { data: posts, isLoading: postsLoading } = useGetUserPosts(username, {
    query: { enabled: !!username }
  });

  const updateBioMutation = useUpdateBio();

  // Bio Editing State
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");

  const handleEditStart = () => {
    setBioInput(profile?.bio || "");
    setIsEditingBio(true);
  };

  const handleSaveBio = () => {
    updateBioMutation.mutate({
      username,
      data: { bio: bioInput }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(username) });
        setIsEditingBio(false);
        toast({ title: "自己紹介を更新しました" });
      },
      onError: () => {
        toast({ 
          title: "エラー", 
          description: "更新に失敗しました", 
          variant: "destructive" 
        });
      }
    });
  };

  if (profileError) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">ユーザーが見つかりません</h2>
          <p className="text-muted-foreground">URLを確認するか、別のユーザーをお探しください。</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-20 animate-in fade-in duration-500">
        
        {/* Profile Header */}
        <section className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative background for profile card */}
          {profile && (
            <div 
              className="absolute top-0 left-0 right-0 h-32 opacity-20 pointer-events-none"
              style={{ background: `linear-gradient(to bottom, ${stringToColor(profile.username)}, transparent)` }}
            />
          )}

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {profileLoading ? (
              <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full" />
            ) : profile ? (
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-xl">
                <AvatarFallback 
                  style={{ backgroundColor: stringToColor(profile.username), color: 'white' }}
                  className="font-bold text-4xl shadow-inner"
                >
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : null}

            <div className="flex-1 w-full space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {profileLoading ? (
                    <Skeleton className="h-8 w-48 mb-2" />
                  ) : profile ? (
                    <h1 className="text-3xl font-black text-white tracking-tight">{profile.username}</h1>
                  ) : null}
                  {profileLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : profile ? (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(profile.createdAt), "yyyy年MM月dd日", { locale: ja })}から利用
                    </p>
                  ) : null}
                </div>

                {profile && (
                  <div className="flex gap-4">
                    <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-center backdrop-blur-md">
                      <p className="text-2xl font-bold text-white leading-none">{profile.postCount}</p>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1">Posts</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/10">
                {profileLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : isEditingBio ? (
                  <div className="space-y-3">
                    <Textarea 
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      placeholder="自己紹介を入力してください"
                      className="bg-black/50 border-white/20 resize-none h-24 text-white focus-visible:ring-primary"
                      maxLength={200}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingBio(false)} disabled={updateBioMutation.isPending}>
                        <X className="w-4 h-4 mr-1" /> キャンセル
                      </Button>
                      <Button size="sm" onClick={handleSaveBio} className="bg-primary text-white" disabled={updateBioMutation.isPending}>
                        {updateBioMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                        保存
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="text-gray-300 whitespace-pre-wrap min-h-[1.5rem] leading-relaxed">
                      {profile?.bio || <span className="text-muted-foreground italic">自己紹介はまだありません</span>}
                    </p>
                    {isOwnProfile && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 border border-white/10 text-muted-foreground hover:text-white"
                        onClick={handleEditStart}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* User's Posts */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Music className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-bold text-white">投稿一覧</h2>
          </div>

          {postsLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl bg-card/40" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <div 
                  key={post.id} 
                  className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <PostCard post={post} profileContext={username} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/20 rounded-xl border border-white/5 border-dashed">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-secondary/50" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">投稿がありません</h3>
              <p className="text-muted-foreground">
                {isOwnProfile ? "まだ音楽をシェアしていません。" : "このユーザーはまだ投稿していません。"}
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
