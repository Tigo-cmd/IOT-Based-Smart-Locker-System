// LockerCard.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, RefreshCw, Eye, EyeOff, Copy } from 'lucide-react';
import { formatLastActivity } from '../utils/lockerUtils';
import { useToast } from '@/hooks/use-toast';

interface Locker {
  locker_id: string;
  status: 'open' | 'closed';
  current_password: string;
  last_activity: string;
  expires_at?: string;
}

interface LockerCardProps {
  locker: Locker;
  onStatusChange: (lockerId: string, newStatus: 'open' | 'closed') => void;
  onPasswordChange: (lockerId: string) => void;
}

const LockerCard = ({ locker, onStatusChange, onPasswordChange }: LockerCardProps) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleStatusToggle = async () => {
    setIsChangingStatus(true);
    const newStatus = locker.status === 'open' ? 'closed' : 'open';
    await onStatusChange(locker.locker_id, newStatus);
    setIsChangingStatus(false);
  };

  const handleGenerateOTP = async () => {
    await onPasswordChange(locker.locker_id);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(locker.current_password);
    toast({
      title: 'Copied!',
      description: 'OTP copied to clipboard',
    });
  };

  const StatusIcon = locker.status === 'open' ? Unlock : Lock;
  const statusColor = locker.status === 'open' ? 'bg-red-500' : 'bg-green-500';

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Locker {locker.locker_id}</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
            <Badge
              variant={locker.status === 'open' ? 'destructive' : 'default'}
              className={locker.status === 'open' ? 'bg-red-600' : 'bg-green-600'}
            >
              {locker.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Control */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2">
            <StatusIcon className="w-5 h-5 text-white" />
            <span className="text-white text-sm">
              {locker.status === 'open' ? 'Unlocked' : 'Locked'}
            </span>
          </div>
          <Button
            onClick={handleStatusToggle}
            disabled={isChangingStatus}
            size="sm"
            variant={locker.status === 'open' ? 'destructive' : 'default'}
          >
            {isChangingStatus ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : locker.status === 'open' ? (
              'Lock'
            ) : (
              'Unlock'
            )}
          </Button>
        </div>

        {/* Password Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Current OTP:</span>
            <Button
              onClick={handleGenerateOTP}
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              New
            </Button>
          </div>

          <div className="flex items-center gap-2 p-2 bg-white/5 rounded border">
            <code className="text-white font-mono text-sm flex-1">
              {showPassword ? locker.current_password : '••••••'}
            </code>
            <Button
              onClick={() => setShowPassword((s) => !s)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-white"
            >
              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
            <Button
              onClick={handleCopyPassword}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-white"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>

          {locker.expires_at && (
            <div className="text-xs text-white/60">
              Expires {new Date(locker.expires_at).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Last Activity */}
        <div className="text-xs text-white/60">
          Last activity: {formatLastActivity(locker.last_activity)}
        </div>
      </CardContent>
    </Card>
  );
};

export default LockerCard;
