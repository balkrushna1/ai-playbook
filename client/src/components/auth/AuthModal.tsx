import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export default function AuthModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      onOpenChange(false);
    } catch (err) {
      // Error handled by hook toast
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ username, password });
      onOpenChange(false);
    } catch (err) {
      // Error handled by hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">Welcome</DialogTitle>
            <DialogDescription>
              Sign in to save favorites and create your own AI playbooks.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary rounded-lg p-1">
              <TabsTrigger value="login" className="rounded-md">Log In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input 
                    id="login-username" 
                    placeholder="Enter your username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="focus-visible:ring-primary/20"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-medium rounded-xl mt-2" disabled={isLoggingIn}>
                  {isLoggingIn ? "Logging in..." : "Log In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input 
                    id="register-username" 
                    placeholder="Choose a username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    placeholder="Choose a strong password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="focus-visible:ring-primary/20"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-medium rounded-xl mt-2" disabled={isRegistering}>
                  {isRegistering ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
