import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, CheckCircle, TrendingUp, 
  Zap, RefreshCw, X, Activity, Lock, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PasswordHealthDashboard = ({ open, onClose, onOpenWizard, onOpenSaved }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchHealthData();
    }
  }, [open]);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/passphrases/health`, {
        withCredentials: true,
      });
      setHealthData(data);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      toast.error('Failed to load password health data');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionId) => {
    onClose(); // Close health dashboard first
    
    setTimeout(() => {
      if (actionId === 'Use Password Wizard' || actionId === 'low_entropy') {
        onOpenWizard && onOpenWizard();
      } else if (actionId === 'Update weak passwords' || actionId === 'Make passwords unique' || actionId === 'Upgrade passwords') {
        onOpenSaved && onOpenSaved();
      }
    }, 300);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-rose-500 to-rose-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSeverityBorder = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-rose-500/30 bg-rose-500/5';
      case 'medium':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/5';
      default:
        return 'border-slate-500/30 bg-slate-500/5';
    }
  };

  if (loading || !healthData) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-emerald-500/30 text-slate-100 max-w-5xl max-h-[90vh]">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Analyzing your password security...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const score = healthData.security_score;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-emerald-500/30 text-slate-100 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-3xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Shield className="w-8 h-8 text-emerald-400" />
            Password Health Dashboard
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Comprehensive analysis of your password security
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Security Score Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Large Score Circle */}
            <div className="lg:col-span-1 flex items-center justify-center">
              <div className="relative">
                <svg className="transform -rotate-90" width="180" height="180">
                  {/* Background circle */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-slate-800"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={getScoreColor(score)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black ${getScoreColor(score)}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {score}
                  </span>
                  <span className="text-slate-400 text-sm mt-1">{getScoreLabel(score)}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="backdrop-blur-sm bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-400 uppercase tracking-wider">Total Passwords</span>
                </div>
                <div className="text-3xl font-bold text-slate-200">{healthData.total_passwords}</div>
              </div>

              <div className="backdrop-blur-sm bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-400 uppercase tracking-wider">Avg Entropy</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400">{healthData.average_entropy}</div>
                <div className="text-xs text-slate-500 mt-1">bits</div>
              </div>

              <div className="backdrop-blur-sm bg-rose-500/10 rounded-xl p-4 border border-rose-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span className="text-sm text-rose-300 uppercase tracking-wider">Weak</span>
                </div>
                <div className="text-3xl font-bold text-rose-400">{healthData.weak_count}</div>
                <div className="text-xs text-rose-300 mt-1">
                  {((healthData.weak_count / healthData.total_passwords) * 100).toFixed(0)}% of total
                </div>
              </div>

              <div className="backdrop-blur-sm bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span className="text-sm text-amber-300 uppercase tracking-wider">Reused</span>
                </div>
                <div className="text-3xl font-bold text-amber-400">{healthData.reused_count}</div>
                <div className="text-xs text-amber-300 mt-1">
                  {healthData.reused_passwords.length} unique duplicates
                </div>
              </div>
            </div>
          </div>

          {/* Strength Distribution */}
          <div className="backdrop-blur-sm bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Password Strength Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-emerald-400">Strong ({healthData.strong_count})</span>
                  <span className="text-slate-400">
                    {((healthData.strong_count / healthData.total_passwords) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${(healthData.strong_count / healthData.total_passwords) * 100}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-amber-400">Medium ({healthData.medium_count})</span>
                  <span className="text-slate-400">
                    {((healthData.medium_count / healthData.total_passwords) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${(healthData.medium_count / healthData.total_passwords) * 100}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-rose-400">Weak ({healthData.weak_count})</span>
                  <span className="text-slate-400">
                    {((healthData.weak_count / healthData.total_passwords) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${(healthData.weak_count / healthData.total_passwords) * 100}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-200">Recommendations</h3>
            {healthData.recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${getSeverityBorder(rec.severity)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(rec.severity)}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200 mb-1">{rec.title}</h4>
                    <p className="text-sm text-slate-400">{rec.description}</p>
                  </div>
                  {rec.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActionClick(rec.action)}
                      className="shrink-0 border-slate-600 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-colors"
                    >
                      {rec.action}
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Weak Passwords List (if any) */}
          {healthData.weak_passwords.length > 0 && (
            <div className="backdrop-blur-sm bg-rose-500/5 rounded-xl p-6 border border-rose-500/30">
              <h3 className="text-lg font-semibold text-rose-400 mb-4">
                Weak Passwords Requiring Attention
              </h3>
              <div className="space-y-2">
                {healthData.weak_passwords.map((pwd) => (
                  <div key={pwd.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-200">{pwd.label}</div>
                      <div className="text-sm text-slate-500 font-mono">{pwd.entropy} bits</div>
                    </div>
                    <span className="text-xs uppercase font-semibold text-rose-400 px-2 py-1 bg-rose-500/20 rounded">
                      {pwd.strength}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reused Passwords */}
          {healthData.reused_passwords.length > 0 && (
            <div className="backdrop-blur-sm bg-amber-500/5 rounded-xl p-6 border border-amber-500/30">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">
                Reused Passwords
              </h3>
              <div className="space-y-3">
                {healthData.reused_passwords.map((reused, index) => (
                  <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-slate-300">{reused.passphrase}</span>
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-semibold">
                        Used {reused.count}x
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Found in: {reused.labels.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t border-slate-700">
          <Button
            onClick={fetchHealthData}
            variant="outline"
            className="border-slate-600 hover:border-emerald-500/50 text-slate-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Analysis
          </Button>
          <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordHealthDashboard;
