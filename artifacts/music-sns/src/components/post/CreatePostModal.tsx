import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost, getListPostsQueryKey, getGetTrendingTagsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PenLine, Link2, Music, Loader2 } from "lucide-react";
import { extractSpotifyId, extractYouTubeVideoId } from "@/lib/media-utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MOOD_TAGS = [
  "#感動", "#テンション上がる", "#しみる", "#懐かし", "#作業用", "#恋愛", "#アニメ"
];

const postSchema = z.object({
  url: z.string().optional(),
  songTitle: z.string().min(1, "曲名を入力してください"),
  artistName: z.string().min(1, "アーティスト名を入力してください"),
  message: z.string().max(140, "140文字以内で入力してください").optional(),
  moodTag: z.string().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

export function CreatePostModal() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreatePost();
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      url: "",
      songTitle: "",
      artistName: "",
      message: "",
      moodTag: "",
    }
  });

  const urlValue = form.watch("url");
  
  // Auto-detect source type
  let detectedType: "spotify" | "youtube" | "manual" = "manual";
  if (urlValue) {
    if (extractYouTubeVideoId(urlValue)) {
      detectedType = "youtube";
    } else if (extractSpotifyId(urlValue)) {
      detectedType = "spotify";
    }
  }

  const onSubmit = (data: PostFormValues) => {
    createMutation.mutate({
      data: {
        songTitle: data.songTitle,
        artistName: data.artistName,
        sourceType: detectedType,
        sourceUrl: data.url || undefined,
        message: data.message || undefined,
        moodTag: data.moodTag || undefined,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "投稿しました！",
          description: "タイムラインに楽曲が追加されました。",
        });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingTagsQueryKey() });
        setOpen(false);
        form.reset();
      },
      onError: () => {
        toast({
          title: "エラー",
          description: "投稿に失敗しました。もう一度お試しください。",
          variant: "destructive",
        });
      }
    });
  };

  const messageLength = form.watch("message")?.length || 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 h-14 w-14 rounded-full shadow-[0_0_20px_rgba(157,78,221,0.5)] hover:shadow-[0_0_30px_rgba(157,78,221,0.8)] transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-tr from-primary to-secondary z-40 border-0"
        >
          <PenLine className="h-6 w-6 text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-white/10 sm:max-w-2xl sm:mx-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Music className="text-primary h-6 w-6" />
            音楽をシェア
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 overflow-y-auto pr-2 pb-20 max-h-full">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Link2 className="h-4 w-4" />
                      YouTube / Spotify URL (任意)
                    </span>
                    {detectedType !== "manual" && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded bg-black border",
                        detectedType === "youtube" ? "text-red-500 border-red-500/30" : "text-green-500 border-green-500/30"
                      )}>
                        {detectedType.toUpperCase()}
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." className="bg-black/50 border-white/10 focus-visible:ring-primary focus-visible:border-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="songTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">曲名 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Neon Lights" className="bg-black/50 border-white/10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="artistName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">アーティスト <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Artist Name" className="bg-black/50 border-white/10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex justify-between">
                    <span>想いを綴る (任意)</span>
                    <span className={cn("text-xs", messageLength > 140 ? "text-red-500" : "text-muted-foreground")}>
                      {messageLength}/140
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="この曲のここが好き..." 
                      className="resize-none h-24 bg-black/50 border-white/10" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moodTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">ムードタグ (任意)</FormLabel>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {MOOD_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => field.onChange(field.value === tag ? "" : tag)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                          field.value === tag 
                            ? "bg-primary text-white border-primary shadow-[0_0_10px_rgba(157,78,221,0.4)] scale-105" 
                            : "bg-black/40 text-muted-foreground border-white/10 hover:border-white/30 hover:bg-black/60"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 pb-8">
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(157,78,221,0.3)] transition-all"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {createMutation.isPending ? "投稿中..." : "投稿する"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
