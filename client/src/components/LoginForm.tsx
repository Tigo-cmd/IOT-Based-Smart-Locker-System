import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
interface LoginFormProps {
  onLogin: (username: string) => void;
}
const LoginForm = ({
  onLogin
}: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      // Demo credentials - in production this would be secure authentication
      if (username === 'admin' && password === 'admin123') {
        onLogin(username);
        toast({
          title: "Login Successful",
          description: "Welcome to Smart Locker System"
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Try admin/admin123",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 1000);
  };
  return <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">IOT Based Smart Locker System</h1>
          <p className="text-blue-200">Secure Access Management</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              System Login
            </CardTitle>
            <CardDescription className="text-blue-200">
              Enter your credentials to access the locker management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" placeholder="Enter username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" placeholder="Enter password" />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>
            {/* <div className="mt-4 p-3 bg-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Demo credentials:</strong><br />
                Username: admin<br />
                Password: admin123
              </p>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default LoginForm;