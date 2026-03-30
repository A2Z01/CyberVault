import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CyberVault = () => {
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [entropy, setEntropy] = useState(0);
  const [strength, setStrength] = useState("medium");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePassphrase = async () => {
    setIsGenerating(true);
    try {
      // Handle "none" separator
      const actualSeparator = separator === "none" ? "" : separator;
      
      const response = await fetch(`${API}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word_count: wordCount,
          separator: actualSeparator,
          append_digit: includeNumbers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate passphrase");
      }

      const data = await response.json();
      setPassphrase(data.passphrase);
      setEntropy(data.entropy);
      setStrength(data.strength);
    } catch (error) {
      console.error("Error generating passphrase:", error);
      toast.error("Failed to generate passphrase");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!passphrase) return;

    try {
      await navigator.clipboard.writeText(passphrase);
      setCopied(true);
      toast.success("Copied to clipboard!", {
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const getStrengthColor = () => {
    if (strength === "weak") return "bg-rose-500";
    if (strength === "medium") return "bg-amber-400";
    return "bg-emerald-400";
  };

  const getStrengthShadow = () => {
    if (strength === "weak") return "shadow-[0_0_12px_rgba(244,63,94,0.6)]";
    if (strength === "medium") return "shadow-[0_0_12px_rgba(251,191,36,0.6)]";
    return "shadow-[0_0_12px_rgba(52,211,153,0.8)]";
  };

  const getStrengthPercentage = () => {
    if (strength === "weak") return 33;
    if (strength === "medium") return 66;
    return 100;
  };

  useEffect(() => {
    generatePassphrase();
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://static.prod-images.emergentagent.com/jobs/b58ad749-2a8a-46d4-9053-efd9e05e23ac/images/0ec6e2150d74a657d0122210311f2dd763b55692324edd15bb8b75c9591a70aa.png')",
        }}
      />
      <div className="absolute inset-0 z-0 bg-slate-950/85" />

      {/* Main Content */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-7xl mx-auto p-6 md:p-12 items-stretch min-h-screen">
        
        {/* Sidebar Controls */}
        <div className="col-span-1 lg:col-span-4 space-y-8 flex flex-col justify-start w-full">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-100" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Shield className="inline-block w-10 h-10 mr-3 text-emerald-400" />
              Cyber-Vault
            </h1>
            <p className="text-base text-slate-400">Cryptographically secure passphrase generator</p>
          </div>

          {/* Controls Container */}
          <div className="backdrop-blur-2xl bg-slate-900/40 border border-emerald-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-8 space-y-8">
            
            {/* Word Count Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="word-count" className="text-slate-200 font-medium">Word Count</Label>
                <span className="text-emerald-400 font-bold text-lg">{wordCount}</span>
              </div>
              <Slider
                id="word-count"
                data-testid="word-count-slider"
                min={3}
                max={8}
                step={1}
                value={[wordCount]}
                onValueChange={(value) => setWordCount(value[0])}
                className="w-full"
              />
            </div>

            {/* Separator Select */}
            <div className="space-y-4">
              <Label htmlFor="separator" className="text-slate-200 font-medium">Separator</Label>
              <Select value={separator} onValueChange={setSeparator}>
                <SelectTrigger 
                  id="separator"
                  data-testid="separator-select"
                  className="bg-slate-950/60 border-slate-700 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 text-slate-200"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-emerald-500/30">
                  <SelectItem value="-">Hyphen ( - )</SelectItem>
                  <SelectItem value="_">Underscore ( _ )</SelectItem>
                  <SelectItem value=" ">Space</SelectItem>
                  <SelectItem value=".">Dot ( . )</SelectItem>
                  <SelectItem value="none">No Separator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Numbers Toggle */}
            <div className="flex items-center justify-between space-x-4 pt-2">
              <Label htmlFor="include-numbers" className="text-slate-200 font-medium">Include Numbers</Label>
              <Switch
                id="include-numbers"
                data-testid="include-numbers-toggle"
                checked={includeNumbers}
                onCheckedChange={setIncludeNumbers}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            {/* Generate Button */}
            <Button
              data-testid="generate-button"
              onClick={generatePassphrase}
              disabled={isGenerating}
              className="w-full bg-slate-950/60 hover:bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-semibold py-6 rounded-lg transition-all duration-300"
            >
              <Zap className="w-5 h-5 mr-2" />
              {isGenerating ? "Generating..." : "Generate New"}
            </Button>
          </div>
        </div>

        {/* Main Display Area */}
        <div className="col-span-1 lg:col-span-8 flex flex-col justify-center space-y-12 w-full h-full">
          
          {/* Passphrase Display */}
          <div className="backdrop-blur-2xl bg-slate-900/40 border border-emerald-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-12 relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-200" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Passphrase</h2>
              <Button
                data-testid="copy-button"
                onClick={copyToClipboard}
                variant="ghost"
                size="icon"
                disabled={!passphrase}
                className="text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition-all duration-300"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Check className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Copy className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>

            {/* Passphrase Text */}
            <div 
              data-testid="passphrase-display"
              className="text-center py-8 px-4 min-h-[120px] flex items-center justify-center"
            >
              {passphrase ? (
                <motion.p
                  key={passphrase}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="font-mono text-3xl md:text-5xl lg:text-6xl tracking-[0.1em] font-light text-emerald-400 leading-tight break-all animate-pulse-glow"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {passphrase}
                </motion.p>
              ) : (
                <p className="text-slate-600 text-xl">Click generate to create a passphrase</p>
              )}
            </div>

            {/* Strength Meter */}
            {passphrase && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">Strength</span>
                  <span className="text-slate-200 text-sm font-bold uppercase">{strength}</span>
                </div>
                <div data-testid="strength-meter" className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                  <motion.div
                    className={`h-full ${getStrengthColor()} ${getStrengthShadow()} transition-all duration-700 ease-out`}
                    initial={{ width: 0 }}
                    animate={{ width: `${getStrengthPercentage()}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Entropy: {entropy} bits</span>
                  <span>Character Length: {passphrase.length}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="backdrop-blur-xl bg-slate-900/30 border border-emerald-500/20 rounded-xl p-6">
              <h3 className="text-emerald-400 font-semibold mb-2">Cryptographic</h3>
              <p className="text-slate-400 text-sm">Generated using Python's secrets module for maximum randomness</p>
            </div>
            <div className="backdrop-blur-xl bg-slate-900/30 border border-emerald-500/20 rounded-xl p-6">
              <h3 className="text-emerald-400 font-semibold mb-2">Memorable</h3>
              <p className="text-slate-400 text-sm">Word-based phrases are easier to remember than random characters</p>
            </div>
            <div className="backdrop-blur-xl bg-slate-900/30 border border-emerald-500/20 rounded-xl p-6">
              <h3 className="text-emerald-400 font-semibold mb-2">Secure</h3>
              <p className="text-slate-400 text-sm">High entropy ensures protection against brute-force attacks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberVault;