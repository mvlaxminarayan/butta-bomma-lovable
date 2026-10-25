import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(uname)) {
      toast.error("Username must be 3–20 letters, numbers or underscores.");
      return;
    }
    setLoading(true);
    const { data: free } = await (supabase as any).schema("api").rpc("username_available", { _username: uname });
    if (free === false) {
      toast.error("That username is taken. Please choose another.");
      setLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          username: uname,
        }
      }
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user && (data.user.identities?.length ?? 0) === 0) {
      // Email already registered: no confirmation email is sent in this case.
      toast.error("An account with this email already exists. Please sign in, or use \"Forgot password?\" to reset it.");
    } else if (data.session) {
      navigate("/");
    } else {
      toast.success("Check your email to confirm your account!");
    }
    setLoading(false);
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const id = identifier.trim();
    let errMsg: string | null = null;
    if (id.includes("@")) {
      const { error } = await supabase.auth.signInWithPassword({ email: id, password });
      if (error) errMsg = error.message === "Invalid login credentials"
        ? "Wrong email or password. Try again or use \"Forgot password?\"."
        : error.message;
    } else {
      const { data, error } = await supabase.functions.invoke("username-login", { body: { username: id, password } });
      if (error || !data?.access_token) {
        let m = "Wrong username or password.";
        try { const b = await (error as any)?.context?.json?.(); if (b?.error) m = b.error; } catch { /* ignore */ }
        errMsg = data?.error || m;
      } else {
        const { error: se } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
        if (se) errMsg = se.message;
      }
    }

    if (errMsg) toast.error(errMsg);
    else navigate("/");
    setLoading(false);
  };

  const forgotPassword = async () => {
    const resetEmail = identifier.includes("@") ? identifier.trim() : email;
    if (!resetEmail) {
      toast.error("Enter your email above first (password reset needs your email).");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      console.error("Password reset error:", error.status, error.message);
      const msg = (error.message || "").toLowerCase();
      if (error.status === 429 || msg.includes("rate limit") || msg.includes("security purposes")) {
        toast.error("Too many reset emails were requested. Please wait a few minutes and try again.");
      } else {
        toast.error("Couldn't send the reset email. Please try again in a moment.");
      }
    } else toast.success("If that email has an account, a password reset link is on its way.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Username or email</Label>
                  <Input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <button type="button" onClick={forgotPassword} className="w-full text-sm text-primary hover:underline" disabled={loading}>
                  Forgot password?
                </button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="e.g. lakshmi_22"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                    required
                    minLength={3}
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">3–20 letters, numbers or underscores.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}