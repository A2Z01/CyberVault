import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, Copy, Check, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SavedPassphrases = ({ open, onClose, trigger }) => {
  const [savedPassphrases, setSavedPassphrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (open) {
      fetchSavedPassphrases();
    }
  }, [open, trigger]);

  const fetchSavedPassphrases = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/passphrases/saved`, {
        withCredentials: true,
      });
      setSavedPassphrases(data);
    } catch (error) {
      console.error('Failed to fetch saved passphrases:', error);
      toast.error('Failed to load saved passphrases');
    } finally {
      setLoading(false);
    }
  };

  const deletePassphrase = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/passphrases/${id}`, {
        withCredentials: true,
      });
      setSavedPassphrases(savedPassphrases.filter((p) => p.id !== id));
      toast.success('Passphrase deleted');
    } catch (error) {
      console.error('Failed to delete passphrase:', error);
      toast.error('Failed to delete passphrase');
    }
  };

  const copyPassphrase = async (passphrase, id) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(passphrase);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = passphrase;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopiedId(id);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const getStrengthColor = (strength) => {
    if (strength === 'weak') return 'text-rose-400';
    if (strength === 'medium') return 'text-amber-400';
    return 'text-emerald-400';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-emerald-500/30 text-slate-100 max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <History className="w-7 h-7 text-emerald-400" />
            Saved Passphrases
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            View and manage your saved passphrases ({savedPassphrases.length} total)
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : savedPassphrases.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No saved passphrases yet</p>
              <p className="text-slate-500 text-sm mt-2">Generate and save your first passphrase!</p>
            </div>
          ) : (
            <AnimatePresence>
              {savedPassphrases.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="backdrop-blur-sm bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {item.label && (
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-3 h-3 text-emerald-400" />
                          <span className="text-sm text-emerald-400 font-medium">{item.label}</span>
                        </div>
                      )}
                      <p
                        className="font-mono text-lg text-slate-200 break-all leading-relaxed"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {item.passphrase}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className={`font-semibold uppercase ${getStrengthColor(item.strength)}`}>
                          {item.strength}
                        </span>
                        <span>{item.entropy} bits</span>
                        <span>{item.word_count} words</span>
                        <span className="text-slate-500">•</span>
                        <span>{formatDate(item.created_at)}</span>
                        {item.use_case !== 'general' && (
                          <>
                            <span className="text-slate-500">•</span>
                            <span className="capitalize">{item.use_case.replace('_', ' ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyPassphrase(item.passphrase, item.id)}
                        className="text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePassphrase(item.id)}
                        className="text-slate-400 hover:text-rose-400 hover:bg-slate-700/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-slate-700">
          <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavedPassphrases;