import { useState } from "react";
import { useListPosts, useGetTrendingTags, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post/PostCard";
import { CreatePostModal } from "@/components/post/CreatePostModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";

export default function Timeline() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data: posts, isLoading: postsLoading, error: postsError } = useListPosts();
  const { data: trendingTags, isLoading: tagsLoading } = useGetTrendingTags();

  return (
    <Layout>
      <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Trending Tags Section */}
        <section className="bg-card/30 border border-white/5 rounded-2xl p-4 backdrop-blur-md sticky top-[72px] z-30 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <h2 className="text-sm font-bold text-white tracking-wider">トレンドタグ</h2>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {tagsLoading ? (
              Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full snap-start" />)
            ) : trendingTags && trendingTags.length > 0 ? (
              trendingTags.map((tag) => (
                <div 
                  key={tag.tag} 
                  className="flex items-center whitespace-nowrap bg-black/40 border border-white/10 px-3 py-1.5 rounded-full snap-start hover:border-primary/50 hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">{tag.tag}</span>
                  <span className="ml-2 text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-full">
                    {tag.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground w-full text-center py-2">
                まだトレンドはありません
              </p>
            )}
          </div>
        </section>

        {/* Timeline Feed */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Music className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-black text-white">最新の投稿</h1>
          </div>

          {postsError ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-white font-medium">投稿の読み込みに失敗しました</p>
              <p className="text-sm text-muted-foreground mt-1">時間をおいて再度お試しください</p>
            </div>
          ) : postsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-card/40 border border-white/5 p-4 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            ))
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/20 rounded-xl border border-white/5 border-dashed">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">最初の投稿をしましょう</h3>
              <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                あなたの好きな音楽を共有して、タイムラインを盛り上げましょう。
              </p>
              {!user && (
                <Button asChild className="bg-primary hover:bg-primary/90 text-white">
                  <Link href="/login">ログインして投稿する</Link>
                </Button>
              )}
            </div>
          )}
        </section>

        {user ? (
          <CreatePostModal />
        ) : (
          <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
            <Button asChild className="rounded-full shadow-[0_0_20px_rgba(157,78,221,0.5)] bg-primary hover:bg-primary/90">
              <Link href="/login" className="flex items-center gap-2 font-bold px-6 py-6 text-base">
                <PenLine className="w-5 h-5" />
                <span>投稿する</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Ensure PenLine is imported if used in fallback
import { PenLine } from "lucide-react";
