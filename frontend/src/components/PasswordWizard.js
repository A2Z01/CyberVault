import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

const PasswordWizard = ({ open, onClose, onGenerate }) => {
  const [step, setStep] = useState(1);
  const [useCase, setUseCase] = useState('general');
  const [typingFrequency, setTypingFrequency] = useState('weekly');
  const [priority, setPriority] = useState('balanced');
  const [requiresSpecialChars, setRequiresSpecialChars] = useState(false);

  const handleSubmit = () => {
    onGenerate({
      use_case: useCase,
      typing_frequency: typingFrequency,
      priority: priority,
      requires_special_chars: requiresSpecialChars,
    });
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setUseCase('general');
    setTypingFrequency('weekly');
    setPriority('balanced');
    setRequiresSpecialChars(false);
    onClose();
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-emerald-500/30 text-slate-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Wand2 className="w-7 h-7 text-emerald-400" />
            Password Wizard
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Answer a few questions to get the perfect passphrase for your needs
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Step {step} of 4</span>
              <span className="text-sm text-emerald-400">{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Use Case */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-slate-200">What will you use this password for?</h3>
                <RadioGroup value={useCase} onValueChange={setUseCase} className="space-y-3">
                  {[
                    { value: 'banking', label: '🏦 Banking & Financial', desc: 'High security for financial accounts' },
                    { value: 'work', label: '💼 Work Account', desc: 'Corporate email or work systems' },
                    { value: 'email', label: '📧 Personal Email', desc: 'Gmail, Outlook, etc.' },
                    { value: 'social_media', label: '📱 Social Media', desc: 'Facebook, Twitter, Instagram' },
                    { value: 'gaming', label: '🎮 Gaming', desc: 'Steam, Xbox, PlayStation' },
                    { value: 'personal', label: '🔐 Personal/Other', desc: 'General purpose password' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        useCase === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <RadioGroupItem value={option.value} className="mt-1" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-200">{option.label}</div>
                        <div className="text-sm text-slate-400">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </motion.div>
            )}

            {/* Step 2: Typing Frequency */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-slate-200">How often will you type this password?</h3>
                <RadioGroup value={typingFrequency} onValueChange={setTypingFrequency} className="space-y-3">
                  {[
                    { value: 'daily', label: '📅 Daily', desc: 'Multiple times a day' },
                    { value: 'weekly', label: '📆 Weekly', desc: 'Few times a week' },
                    { value: 'rarely', label: '🗓️ Rarely', desc: 'Once a month or less' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        typingFrequency === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <RadioGroupItem value={option.value} className="mt-1" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-200">{option.label}</div>
                        <div className="text-sm text-slate-400">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </motion.div>
            )}

            {/* Step 3: Priority */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-slate-200">What's more important to you?</h3>
                <RadioGroup value={priority} onValueChange={setPriority} className="space-y-3">
                  {[
                    { value: 'security', label: '🛡️ Maximum Security', desc: 'Longer, harder to crack' },
                    { value: 'balanced', label: '⚖️ Balanced', desc: 'Good security, easier to remember' },
                    { value: 'memorable', label: '🧠 Easy to Remember', desc: 'Shorter, simpler phrases' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        priority === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <RadioGroupItem value={option.value} className="mt-1" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-200">{option.label}</div>
                        <div className="text-sm text-slate-400">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </motion.div>
            )}

            {/* Step 4: Special Requirements */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-slate-200">Any special requirements?</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div>
                      <Label className="text-slate-200 font-medium">Require Numbers</Label>
                      <p className="text-sm text-slate-400">Add numbers for extra security</p>
                    </div>
                    <Switch
                      checked={requiresSpecialChars}
                      onCheckedChange={setRequiresSpecialChars}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-emerald-400 mb-1">Ready to Generate!</h4>
                        <p className="text-sm text-slate-300">
                          We'll create a passphrase optimized for your needs. Click "Generate" to continue.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
            <Button
              onClick={step === 1 ? handleClose : prevStep}
              variant="ghost"
              className="text-slate-400 hover:text-slate-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              onClick={step === 4 ? handleSubmit : nextStep}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
            >
              {step === 4 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordWizard;