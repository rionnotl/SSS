import { Post, useLikePost, useUnlikePost, getListPostsQueryKey, getGetUserPostsQueryKey } from "@workspace/api-client-react";
import { formatRelativeTime } from "@/lib/date-utils";
import { stringToColor } from "@/lib/color-utils";
import { extractSpotifyId, extractYouTubeVideoId } from "@/lib/media-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Heart, Music, Disc } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  profileContext?: string;
}

export function PostCard({ post, profileContext }: PostCardProps) {
  const queryClient = useQueryClient();
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();

  const handleLikeToggle = () => {
    // Optimistic update
    const updateCache = (oldData: Post[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            likedByMe: !p.likedByMe,
            likesCount: p.likedByMe ? Math.max(0, p.likesCount - 1) : p.likesCount + 1
          };
        }
        return p;
      });
    };

    queryClient.setQueryData(getListPostsQueryKey({}), updateCache);
    if (profileContext) {
      queryClient.setQueryData(getGetUserPostsQueryKey(profileContext), updateCache);
    }

    if (post.likedByMe) {
      unlikeMutation.mutate({ id: post.id }, {
        onError: () => {
          // Revert on error
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          if (profileContext) queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(profileContext) });
        }
      });
    } else {
      likeMutation.mutate({ id: post.id }, {
        onError: () => {
          // Revert on error
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          if (profileContext) queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(profileContext) });
        }
      });
    }
  };

  const renderEmbed = () => {
    if (post.sourceType === "youtube" && post.sourceUrl) {
      const videoId = extractYouTubeVideoId(post.sourceUrl);
      if (videoId) {
        return (
          <div className="w-full aspect-video rounded-md overflow-hidden bg-black mt-3 shadow-lg shadow-black/50 border border-white/5">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    }

    if (post.sourceType === "spotify" && post.sourceUrl) {
      const spotifyData = extractSpotifyId(post.sourceUrl);
      if (spotifyData) {
        return (
          <div className="w-full h-[152px] rounded-md overflow-hidden mt-3 shadow-lg shadow-black/50 border border-white/5">
            <iframe
              src={`https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}?utm_source=generator&theme=0`}
              width="100%"
              height="152"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="border-0"
              loading="lazy"
            />
          </div>
        );
      }
    }

    // Manual/Fallback
    return (
      <div className="w-full h-[120px] rounded-md overflow-hidden mt-3 bg-gradient-to-br from-card to-background border border-white/10 relative shadow-lg shadow-black/50 flex items-center p-4 gap-4 overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none" />
        <div className="h-16 w-16 min-w-[4rem] rounded-full bg-black flex items-center justify-center border-4 border-neutral-800 relative z-10 shadow-lg group-hover:rotate-180 transition-transform duration-1000 ease-in-out">
          <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-primary to-secondary" />
          <div className="absolute inset-2 rounded-full border border-white/10" />
          <div className="absolute inset-4 rounded-full border border-white/5" />
        </div>
        <div className="flex-1 min-w-0 z-10">
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <Music className="w-3 h-3" />
            <span className="text-[10px] font-medium tracking-wider uppercase">Vinyl Record</span>
          </div>
          <h3 className="text-base font-bold text-white truncate">{post.songTitle}</h3>
          <p className="text-sm text-muted-foreground truncate">{post.artistName}</p>
        </div>
      </div>
    );
  };

  return (
    <article className="group bg-card/40 backdrop-blur-sm border border-white/5 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/20 flex flex-col gap-2 relative overflow-hidden">
      {/* Decorative gradient corner on hover */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.username}`}>
            <Avatar className="h-10 w-10 border border-white/10 hover:border-primary/50 transition-colors cursor-pointer ring-2 ring-transparent hover:ring-primary/20">
              <AvatarFallback 
                style={{ backgroundColor: stringToColor(post.username), color: 'white' }}
                className="font-bold shadow-inner"
              >
                {post.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <Link href={`/profile/${post.username}`}>
              <span className="text-sm font-bold text-white hover:text-primary transition-colors cursor-pointer">{post.username}</span>
            </Link>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-1">
        <h2 className="text-xl font-black text-white leading-tight">{post.songTitle}</h2>
        <p className="text-sm text-secondary/90 font-medium">{post.artistName}</p>
      </div>

      {renderEmbed()}

      {post.message && (
        <p className="text-sm text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">
          {post.message}
        </p>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <div className="flex flex-wrap gap-2">
          {post.moodTag && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {post.moodTag}
            </span>
          )}
        </div>
        
        <button 
          onClick={handleLikeToggle}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-pink-500 transition-colors focus:outline-none"
        >
          <Heart 
            className={cn(
              "w-5 h-5 transition-all duration-300", 
              post.likedByMe ? "fill-pink-500 text-pink-500 scale-110" : "hover:scale-110 active:scale-95"
            )} 
          />
          <span className={cn(
            "text-sm font-medium tabular-nums",
            post.likedByMe ? "text-pink-500" : ""
          )}>{post.likesCount > 0 ? post.likesCount : ''}</span>
        </button>
      </div>
    </article>
  );
}
