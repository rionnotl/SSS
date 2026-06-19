import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(2, "ユーザー名は2文字以上で入力してください"),
  password: z.string().min(4, "パスワードは4文字以上で入力してください"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: "ログインしました",
          description: "お帰りなさい！",
        });
        setLocation("/");
      },
      onError: () => {
        toast({
          title: "ログイン失敗",
          description: "ユーザー名またはパスワードが間違っています",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-background p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <Link href="/" className="mb-8 flex items-center gap-3 transition-transform hover:scale-105">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(157,78,221,0.5)]">
          <Music className="w-6 h-6 text-white" />
        </div>
        <span className="font-black text-3xl tracking-tight text-white">音楽SNS</span>
      </Link>

      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">ログイン</h1>
          <p className="text-muted-foreground text-sm">アカウントに入って音楽をシェアしよう</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">ユーザー名</FormLabel>
                  <FormControl>
                    <Input placeholder="username" className="bg-black/50 border-white/10 h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">パスワード</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="bg-black/50 border-white/10 h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(157,78,221,0.3)] transition-all"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loginMutation.isPending ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          アカウントを持っていませんか？{" "}
          <Link href="/register" className="text-primary hover:text-primary/80 font-bold hover:underline">
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}
