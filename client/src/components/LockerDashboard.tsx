// LockerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import LockerCard from './LockerCard';
import { useToast } from '@/hooks/use-toast';
import { getAllLockers, updateLockerStatusApi, generateOtpApi } from '../integrations/client';

import { formatLastActivity } from '../utils/lockerUtils';

interface Locker {
  locker_id: string;
  status: 'open' | 'closed';
  current_password: string;
  last_activity: string;
  expires_at?: string;
}

interface LockerDashboardProps {
  currentUser: string;
  onLogout: () => void;
}

const LockerDashboard = ({ currentUser, onLogout }: LockerDashboardProps) => {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchLockers = async () => {
    try {
      const data = await getAllLockers();
      // Assume API returns array of { locker_id, status, current_password, last_activity, expires_at }
      setLockers(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to fetch lockers: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchLockers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLockers();
    setIsRefreshing(false);
  };

  const handleStatusChange = async (lockerId: string, newStatus: 'open' | 'closed') => {
    try {
      await updateLockerStatusApi(lockerId, newStatus);
      setLockers((prev) =>
        prev.map((l) =>
          l.locker_id === lockerId
            ? { ...l, status: newStatus, last_activity: new Date().toISOString() }
            : l
        )
      );
      toast({
        title: 'Success',
        description: `Locker ${lockerId} ${newStatus}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update locker status',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordChange = async (lockerId: string) => {
    try {
      const { otp, expires_at } = await generateOtpApi(lockerId);
      setLockers((prev) =>
        prev.map((l) =>
          l.locker_id === lockerId
            ? { ...l, current_password: otp, last_activity: new Date().toISOString(), expires_at }
            : l
        )
      );
      toast({
        title: 'OTP Generated',
        description: `New OTP for ${lockerId}: ${otp}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate OTP',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Smart Locker Management</h1>
            <p className="text-blue-200">Welcome back, {currentUser}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              className="bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 className="text-white text-sm font-medium mb-2">Total Lockers</h3>
            <p className="text-3xl font-bold text-white">{lockers.length}</p>
          </div>
          <div className="bg-green-600/20 backdrop-blur-lg rounded-lg p-6 border border-green-500/30">
            <h3 className="text-green-200 text-sm font-medium mb-2">Available</h3>
            <p className="text-3xl font-bold text-green-300">
              {lockers.filter((l) => l.status === 'closed').length}
            </p>
          </div>
          <div className="bg-red-600/20 backdrop-blur-lg rounded-lg p-6 border border-red-500/30">
            <h3 className="text-red-200 text-sm font-medium mb-2">In Use</h3>
            <p className="text-3xl font-bold text-red-300">
              {lockers.filter((l) => l.status === 'open').length}
            </p>
          </div>
          <div className="bg-blue-600/20 backdrop-blur-lg rounded-lg p-6 border border-blue-500/30">
            <h3 className="text-blue-200 text-sm font-medium mb-2">System Status</h3>
            <p className="text-xl font-bold text-blue-300">Online</p>
          </div>
        </div>

        {/* Locker Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {lockers.map((locker) => (
            <LockerCard
              key={locker.locker_id}
              locker={locker}
              onStatusChange={handleStatusChange}
              onPasswordChange={handlePasswordChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LockerDashboard;
