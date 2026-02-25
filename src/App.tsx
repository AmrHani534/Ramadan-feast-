import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  MapPin, Clock, Calendar, CheckCircle2, 
  CreditCard, Smartphone, Banknote, Share2, Printer,
  Moon, Star, ChevronDown, Info, User, Ticket, LogOut
} from 'lucide-react';

const QR_CODE_URLS = {
  telda: 'https://raw.githubusercontent.com/AmrHani534/Ramadan-feast-/main/telda-qr.jpg',
  vodafone: 'https://raw.githubusercontent.com/AmrHani534/Ramadan-feast-/main/vodafone-qr.jpg',
  instapay: 'https://raw.githubusercontent.com/AmrHani534/Ramadan-feast-/main/instapay-qr.jpg'
};

const INVITATION_CODES: Record<string, { name: string, price: number, isAdmin: boolean }> = {
  "RAM-2026-AH485": { name: "Amr Hani", price: 485, isAdmin: true },
  "RAM-2026-AE485": { name: "Amr Eldowaik", price: 485, isAdmin: false },
  "RAM-2026-AR485": { name: "Abdelrahman Rabiee", price: 485, isAdmin: false },
  "RAM-2026-AG485": { name: "Adam Gomaa", price: 485, isAdmin: false },
  "RAM-2026-AI485": { name: "Adham Ibrahim", price: 485, isAdmin: false },
  "RAM-2026-AA485": { name: "Ahmed Amr", price: 485, isAdmin: false },
  "RAM-2026-AM250": { name: "Ahmed Mando", price: 250, isAdmin: false },
  "RAM-2026-IA250": { name: "Islam Ahmed", price: 250, isAdmin: false },
  "RAM-2026-MT250": { name: "Mostafa Taha", price: 250, isAdmin: false },
  "RAM-2026-MK485": { name: "Mohamed Khaled", price: 485, isAdmin: false },
  "RAM-2026-ME485": { name: "Mostafa Ezat", price: 485, isAdmin: false },
  "RAM-2026-ZS485": { name: "Ziad Sameh", price: 485, isAdmin: false }
};

const DRINKS = [
  { id: 'sobia', emoji: '🥤', arabic: 'سوبيا', english: 'Sobia (2L)' },
  { id: 'pepsi', emoji: '🥤', arabic: 'بيبسي 1.5 لتر', english: 'Pepsi (1.5L)' },
  { id: 'schweppes', emoji: '🍹', arabic: 'شويبس رمان 0.95 لتر', english: 'Schweppes Pomegranate (0.95L)' },
];

const HAWAWSHI_PREFS = [
  { id: 'with_cheese', emoji: '🧀', arabic: 'بالموتزاريلا', english: 'With Mozzarella Cheese' },
  { id: 'without_cheese', emoji: '🥙', arabic: 'بدون موتزاريلا', english: 'Without Mozzarella Cheese' },
];

const SNACKS = [
  { id: 'spuds_ribs', emoji: '🍟', arabic: 'شيبس Spuds بضلوع اللحم', english: 'Spuds Ribs Flavor' },
  { id: 'raw_chili', emoji: '🌶️', arabic: 'شيبس Raw سويت تشيلي', english: 'Raw Sweet Chili' },
  { id: 'raw_cheddar', emoji: '🧀', arabic: 'شيبس Raw شيدر وبصل', english: 'Raw Cheddar & Onion' },
  { id: 'raw_truffle', emoji: '🍄', arabic: 'شيبس Raw بالكمأة البيضاء', english: 'Raw White Truffle' },
  { id: 'chipsy_ranch', emoji: '🧈', arabic: 'شيبسي ويفي رانش وجبنة', english: 'Chipsy Wavy Ranch & Cheese' },
  { id: 'bigchips_cream', emoji: '🥔', arabic: 'بيج شيبس كيتل بالكريمة والبصل', english: 'Big Chips Kettle Cream & Onion' },
];

const PAYMENT_METHODS = [
  { id: 'telda', label: 'Telda', icon: CreditCard, link: 'https://telda.me/amrhanygomaa' },
  { id: 'vodafone', label: 'Vodafone Cash (+10 L.E. fees)', icon: Smartphone, link: 'http://vf.eg/vfcash?id=mt&qrId=aqh175' },
  { id: 'instapay', label: 'Instapay', icon: Banknote, link: 'https://ipn.eg/S/amrhany2022/instapay/5k2I2k' },
  { id: 'cash', label: 'Cash (Pay at event)', icon: Banknote, link: null },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [verifiedGuest, setVerifiedGuest] = useState<{ enteredName: string, verifiedName: string, code: string, price: number, isAdmin: boolean } | null>(null);

  const [preferences, setPreferences] = useState({
    drink: '',
    hawawshi: '',
    snack: '',
    notes: '',
    paymentMethod: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showCheckTicketModal, setShowCheckTicketModal] = useState(false);
  const [checkTicketCode, setCheckTicketCode] = useState('');
  const [checkTicketLoading, setCheckTicketLoading] = useState(false);
  const [checkTicketResult, setCheckTicketResult] = useState<{name: string, status: string, code: string} | null>(null);
  const [checkTicketError, setCheckTicketError] = useState('');

  const [isConfirming, setIsConfirming] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [isPreferencesCompleted, setIsPreferencesCompleted] = useState(false);

  const togglePayment = (method: string) => {
    setExpandedPayment(prev => prev === method ? null : method);
    setPreferences(prev => ({ ...prev, paymentMethod: method }));
  };

  const handleCheckTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckTicketError('');
    setCheckTicketResult(null);
    
    const trimmedCode = checkTicketCode.trim().toUpperCase();
    if (!/^RAM-2026-[A-Z]{2}\d{3}$/.test(trimmedCode)) {
      setCheckTicketError('Invalid code format. Please use RAM-2026-XXXXX format.');
      return;
    }

    setCheckTicketLoading(true);
    try {
      const response = await fetch('https://docs.google.com/spreadsheets/d/1XCoWyi17026og4sc0mrTklvz2fl328iB78ON2SfVN1A/export?format=csv');
      const csvText = await response.text();
      
      const rows = csvText.split('\n');
      let targetRow = null;
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].includes(trimmedCode)) {
          const cols = rows[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          targetRow = cols;
          break;
        }
      }
      
      if (targetRow) {
        const header = rows[0].split(',').map(c => c.replace(/^"|"$/g, '').trim().toLowerCase());
        const nameIndex = header.indexOf('name');
        const statusIndex = header.length - 1;
        
        setCheckTicketResult({
          name: nameIndex !== -1 ? targetRow[nameIndex] : targetRow[2] || 'Unknown',
          status: targetRow[statusIndex] || 'Unknown',
          code: trimmedCode
        });
      } else {
        setCheckTicketError('Ticket not found. Please check your code.');
      }
    } catch (err) {
      setCheckTicketError('Error fetching data. Please try again later.');
    } finally {
      setCheckTicketLoading(false);
    }
  };

  // Load admin settings on mount
  useEffect(() => {
    // Check if current user has saved preferences
    const savedGuestData = sessionStorage.getItem('ramadan_verified_guest');
    if (savedGuestData) {
      const parsedGuest = JSON.parse(savedGuestData);
      setVerifiedGuest(parsedGuest);
      setIsAuthenticated(true);
    }
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsShaking(false);

    if (!authName || authName.length < 3) {
      setAuthError('Please enter a valid name (minimum 3 characters).');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const trimmedCode = authCode.trim().toUpperCase();
    const codePattern = /^RAM-2026-[A-Z]{2}\d{3}$/;
    
    if (!codePattern.test(trimmedCode)) {
      setAuthError('Invalid code format. Please use RAM-2026-XXXXX format.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const guestData = INVITATION_CODES[trimmedCode];

    if (guestData) {
      const newVerifiedGuest = {
        enteredName: authName,
        verifiedName: guestData.name,
        code: trimmedCode,
        price: guestData.price,
        isAdmin: guestData.isAdmin
      };
      
      setVerifiedGuest(newVerifiedGuest);
      sessionStorage.setItem('ramadan_verified_guest', JSON.stringify(newVerifiedGuest));
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#5B2C6F', '#50C878']
      });

      // Load their preferences if they exist
      const loadPrefs = async () => {
        if (!database) return;
        try {
          const snapshot = await get(child(ref(database), `guestPreferences/${trimmedCode}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            setPreferences({
              drink: data.drink || '',
              hawawshi: data.hawawshi || '',
              snack: data.snack || '',
              notes: data.notes || ''
            });
          } else {
            setPreferences({
              drink: '',
              hawawshi: '',
              snack: '',
              notes: ''
            });
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      };
      loadPrefs();
      
      setIsAuthenticated(true);
    } else {
      setAuthError('❌ Invalid invitation code. Please check and try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setTimeout(() => setAuthError(''), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setVerifiedGuest(null);
    setAuthName('');
    setAuthCode('');
    sessionStorage.removeItem('ramadan_verified_guest');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!preferences.drink) newErrors.drink = 'Please select a drink';
    if (!preferences.hawawshi) newErrors.hawawshi = 'Please select your Hawawshi preference';
    if (!preferences.snack) newErrors.snack = 'Please select a snack';
    if (!preferences.paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = (step: number) => {
    setWizardStep(step);
  };

  const previousStep = (step: number) => {
    setWizardStep(step);
  };

  const completePreferences = () => {
    setIsPreferencesCompleted(true);
    setTimeout(() => {
      document.getElementById('paymentSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleConfirm = async () => {
    if (validateForm() && verifiedGuest) {
      setIsConfirming(true);
      try {
        // Save to Google Sheets
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzD3-8pU2wOaNMCrT3IiDqlck8j0UNHX5OVOfqlQsBJKTxgCp7cpW5sYNk2HEsIIhyfsw/exec";
        if (!GOOGLE_SCRIPT_URL) {
          alert('Google Sheets URL is not configured.');
          setIsConfirming(false);
          return;
        }

        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Required to avoid CORS issues with Google Apps Script
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: verifiedGuest.code,
            name: verifiedGuest.verifiedName,
            drink: DRINKS.find(d => d.id === preferences.drink)?.english || preferences.drink,
            hawawshi: HAWAWSHI_PREFS.find(h => h.id === preferences.hawawshi)?.english || preferences.hawawshi,
            snack: SNACKS.find(s => s.id === preferences.snack)?.english || preferences.snack,
            notes: preferences.notes || 'None',
            price: verifiedGuest.price,
            paymentMethod: preferences.paymentMethod
          })
        });
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#5B2C6F', '#50C878']
        });
        
        setShowSuccess(true);
      } catch (error) {
        console.error('Error saving preferences:', error);
        alert('❌ Error saving preferences. Please check your connection.');
      } finally {
        setIsConfirming(false);
      }
    } else {
      // Scroll to first error
      const firstError = document.querySelector('.text-red-500');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleShare = () => {
    const text = `Ramadan Kareem! 🌙\nI've confirmed my attendance for the feast.\nJoin me here: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-20 font-english-sans text-gray-800 bg-gradient-to-br from-ramadan-bg-start to-ramadan-bg-end relative overflow-x-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 z-0">
        <div className="absolute top-10 left-10 text-ramadan-secondary animate-float" style={{ animationDelay: '0s' }}><Star size={32} /></div>
        <div className="absolute top-40 right-20 text-ramadan-secondary animate-float" style={{ animationDelay: '1s' }}><Star size={24} /></div>
        <div className="absolute bottom-40 left-20 text-ramadan-secondary animate-float" style={{ animationDelay: '2s' }}><Star size={40} /></div>
        <div className="absolute top-1/2 right-10 text-ramadan-secondary animate-float" style={{ animationDelay: '1.5s' }}><Star size={28} /></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
        
        {/* Header */}
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center items-center min-h-[70vh]"
            >
              <div className="bg-white rounded-[20px] p-8 md:p-10 w-[90%] md:w-[400px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-ramadan-primary to-ramadan-secondary"></div>
                
                <div className="text-center mb-8">
                  <Moon size={40} className="mx-auto text-ramadan-secondary mb-4 animate-pulse-glow rounded-full" />
                  <h2 className="text-2xl font-english-serif text-ramadan-primary mb-1">🌙 Welcome to Our Ramadan Feast</h2>
                  <h3 className="text-xl font-arabic-serif text-ramadan-primary mb-2">أهلاً بك في عزومة رمضان</h3>
                  <p className="text-gray-500 text-sm">Please verify your invitation</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name / اسمك</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full h-[55px] pl-[45px] pr-4 rounded-xl border-2 border-[#e0e0e0] focus:border-ramadan-secondary focus:outline-none focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-[16px]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Invitation Code / كود الدعوة</label>
                    <div className="relative">
                      <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                        placeholder="RAM-2026-XXXXX"
                        className={`w-full h-[55px] pl-[45px] pr-4 rounded-xl border-2 border-[#e0e0e0] focus:border-ramadan-secondary focus:outline-none focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-[16px] uppercase ${isShaking ? 'input-error' : ''}`}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Format: RAM-2026-XX000</p>
                    {authError && (
                      <div className="error-message">
                        {authError}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={!authName || !authCode}
                    className="w-full h-[55px] mt-6 bg-gradient-to-r from-ramadan-primary to-[#7D3C98] text-white font-bold text-[18px] rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_25px_rgba(91,44,111,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    ✅ Verify & Continue
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowCheckTicketModal(true)}
                    className="w-full h-[55px] mt-4 bg-white text-ramadan-primary border-2 border-ramadan-primary font-bold text-[18px] rounded-xl cursor-pointer transition-all duration-300 hover:bg-ramadan-primary/5 active:scale-95"
                  >
                    🔍 Check Ticket Status
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <header className="text-center mb-12">
                <div className="flex justify-center mb-4 text-ramadan-secondary">
                  <Moon size={48} className="animate-pulse-glow rounded-full" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ramadan-primary mb-2 arabic-text">
                  رمضان كريم
                </h1>
                <h2 className="text-2xl md:text-3xl font-english-serif text-ramadan-primary mb-4">
                  Ramadan Kareem
                </h2>
                <div className="w-24 h-1 bg-ramadan-secondary mx-auto rounded-full mb-4"></div>
                <p className="text-xl text-gray-600 font-english-serif italic">
                  Feast Invitation - دعوة إفطار
                </p>
              </header>

              {/* Welcome Banner */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-r from-ramadan-primary to-[#7D3C98] rounded-2xl p-6 md:p-8 mb-8 text-white relative overflow-hidden shadow-lg"
              >
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-english-serif mb-2">Welcome, {verifiedGuest?.enteredName}! 🎉</h3>
                    <p className="text-white/80 flex items-center gap-2">
                      <Ticket size={16} /> Your invitation code: <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{verifiedGuest?.code}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button 
                      onClick={handleLogout}
                      className="text-white/80 hover:text-white flex items-center gap-1 text-sm transition-colors"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                </div>
              </motion.section>

              {/* Feast Details */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-6 md:p-8 mb-8"
        >
          <h3 className="text-2xl font-english-serif text-ramadan-primary mb-6 flex items-center gap-2">
            <span className="text-ramadan-secondary">2.</span> Feast Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/40">
              <div className="p-3 bg-ramadan-primary/10 rounded-full text-ramadan-primary">
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Date</h4>
                <p className="text-gray-600 mt-1">
                  Date to be announced by host
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/40">
              <div className="p-3 bg-ramadan-primary/10 rounded-full text-ramadan-primary">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Time</h4>
                <p className="text-gray-600 mt-1">5:30 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/40 md:col-span-2">
              <div className="p-3 bg-ramadan-primary/10 rounded-full text-ramadan-primary">
                <MapPin size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-3">Location</h4>
                <a 
                  href="https://maps.app.goo.gl/ufywaYtTVKeChWUY8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  📍 View Location on Map
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/40 md:col-span-2">
              <div className="p-3 bg-ramadan-primary/10 rounded-full text-ramadan-primary">
                <span className="text-2xl">🍽️</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Main Dishes</h4>
                <p className="text-gray-600 mt-1">Steak, Beef Kofta, Hawawshi</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Preferences Form */}
        <AnimatePresence>
          {isAuthenticated && !isPreferencesCompleted && (
            <motion.section 
              id="preferencesSection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 md:p-8 mb-8"
            >
              <h3 className="text-[1.3rem] font-english-serif text-ramadan-primary mb-6 flex items-center gap-2">
                <span className="text-ramadan-secondary">3.</span> Your Preferences
              </h3>

              {/* Progress Indicator */}
              <div className="flex justify-between mb-8 px-0 sm:px-5 relative">
                <div className="absolute top-[15px] left-[10%] right-[10%] h-[2px] bg-[#E0E0E0] -z-10"></div>
                <div className="absolute top-[15px] left-[10%] h-[2px] bg-[#D4AF37] -z-10 transition-all duration-300" style={{ width: `${((wizardStep - 1) / 3) * 80}%` }}></div>
                
                {[
                  { step: 1, label: 'Drink' },
                  { step: 2, label: 'Hawawshi' },
                  { step: 3, label: 'Snack' },
                  { step: 4, label: 'Notes' }
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-center flex-1 relative bg-white/0">
                    <div className={`w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] rounded-full flex items-center justify-center font-bold text-[0.8rem] sm:text-[0.9rem] mb-1 transition-all duration-300 ${wizardStep === item.step ? 'bg-[#D4AF37] text-white' : wizardStep > item.step ? 'bg-[#5B2C6F] text-white' : 'bg-[#E0E0E0] text-[#999]'}`}>
                      {item.step}
                    </div>
                    <span className={`text-[0.7rem] sm:text-[0.75rem] text-center ${wizardStep === item.step ? 'text-[#5B2C6F] font-semibold' : 'text-[#999]'}`}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-12">
                {/* Step 1: Drink */}
                {wizardStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="wizard-step"
                  >
                    <h3 className="text-[1.2rem] text-[#5B2C6F] text-center mb-6">Choose Your Favorite Drink</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {DRINKS.map((drink) => (
                        <div 
                          key={drink.id}
                          onClick={() => setPreferences({...preferences, drink: drink.id})}
                          className={`bg-white border-2 rounded-xl p-5 text-center cursor-pointer transition-all duration-300 relative ${preferences.drink === drink.id ? 'border-[#D4AF37] bg-gradient-to-br from-[#FFFEF7] to-[#FFF9E6] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' : 'border-[#E0E0E0] hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(212,175,55,0.2)]'}`}
                        >
                          {preferences.drink === drink.id && (
                            <div className="absolute top-2 right-2 bg-[#D4AF37] text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[0.8rem] font-bold">✓</div>
                          )}
                          <div className="text-[2.5rem] mb-2">{drink.emoji}</div>
                          <div className="text-[1rem] font-semibold text-[#333] mb-1">{drink.arabic}</div>
                          <div className="text-[0.85rem] text-[#666]">{drink.english}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => nextStep(2)}
                        disabled={!preferences.drink}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-[#5B2C6F] to-[#7B3F8F] text-white rounded-lg font-semibold text-[0.95rem] transition-all duration-300 shadow-[0_3px_10px_rgba(91,44,111,0.3)] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(91,44,111,0.4)] disabled:bg-[#CCC] disabled:bg-none disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                      >
                        Next
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Hawawshi */}
                {wizardStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="wizard-step"
                  >
                    <h3 className="text-[1.2rem] text-[#5B2C6F] text-center mb-6">Choose Your Hawawshi Preference</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {HAWAWSHI_PREFS.map((pref) => (
                        <div 
                          key={pref.id}
                          onClick={() => setPreferences({...preferences, hawawshi: pref.id})}
                          className={`bg-white border-2 rounded-xl p-8 text-center cursor-pointer transition-all duration-300 relative ${preferences.hawawshi === pref.id ? 'border-[#D4AF37] bg-gradient-to-br from-[#FFFEF7] to-[#FFF9E6] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' : 'border-[#E0E0E0] hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(212,175,55,0.2)]'}`}
                        >
                          {preferences.hawawshi === pref.id && (
                            <div className="absolute top-2 right-2 bg-[#D4AF37] text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[0.8rem] font-bold">✓</div>
                          )}
                          <div className="text-[2.5rem] mb-2">{pref.emoji}</div>
                          <div className="text-[1rem] font-semibold text-[#333] mb-1">{pref.english}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <button 
                        onClick={() => previousStep(1)}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-[#5B2C6F] border-2 border-[#5B2C6F] rounded-lg font-semibold text-[0.95rem] transition-all duration-300 hover:bg-[#F5F0F8]"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => nextStep(3)}
                        disabled={!preferences.hawawshi}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-[#5B2C6F] to-[#7B3F8F] text-white rounded-lg font-semibold text-[0.95rem] transition-all duration-300 shadow-[0_3px_10px_rgba(91,44,111,0.3)] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(91,44,111,0.4)] disabled:bg-[#CCC] disabled:bg-none disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                      >
                        Next
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Snack */}
                {wizardStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="wizard-step"
                  >
                    <h3 className="text-[1.2rem] text-[#5B2C6F] text-center mb-6">Choose Your Favorite Snack</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {SNACKS.map((snack) => (
                        <div 
                          key={snack.id}
                          onClick={() => setPreferences({...preferences, snack: snack.id})}
                          className={`bg-white border-2 rounded-xl p-5 text-center cursor-pointer transition-all duration-300 relative ${preferences.snack === snack.id ? 'border-[#D4AF37] bg-gradient-to-br from-[#FFFEF7] to-[#FFF9E6] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' : 'border-[#E0E0E0] hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(212,175,55,0.2)]'}`}
                        >
                          {preferences.snack === snack.id && (
                            <div className="absolute top-2 right-2 bg-[#D4AF37] text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[0.8rem] font-bold">✓</div>
                          )}
                          <div className="text-[2.5rem] mb-2">{snack.emoji}</div>
                          <div className="text-[1rem] font-semibold text-[#333] mb-1">{snack.arabic}</div>
                          <div className="text-[0.85rem] text-[#666]">{snack.english}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <button 
                        onClick={() => previousStep(2)}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-[#5B2C6F] border-2 border-[#5B2C6F] rounded-lg font-semibold text-[0.95rem] transition-all duration-300 hover:bg-[#F5F0F8]"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => nextStep(4)}
                        disabled={!preferences.snack}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-[#5B2C6F] to-[#7B3F8F] text-white rounded-lg font-semibold text-[0.95rem] transition-all duration-300 shadow-[0_3px_10px_rgba(91,44,111,0.3)] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(91,44,111,0.4)] disabled:bg-[#CCC] disabled:bg-none disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                      >
                        Next
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Notes */}
                {wizardStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="wizard-step"
                  >
                    <h3 className="text-[1.2rem] text-[#5B2C6F] text-center mb-6">Additional Notes (Optional)</h3>
                    <textarea 
                      value={preferences.notes}
                      onChange={(e) => setPreferences({...preferences, notes: e.target.value})}
                      placeholder="Any special requests or dietary restrictions?"
                      className="w-full p-4 border-2 border-[#E0E0E0] rounded-xl text-[0.95rem] font-english-sans resize-y mb-6 transition-colors duration-300 focus:outline-none focus:border-[#D4AF37]"
                      rows={5}
                    ></textarea>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <button 
                        onClick={() => previousStep(3)}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-[#5B2C6F] border-2 border-[#5B2C6F] rounded-lg font-semibold text-[0.95rem] transition-all duration-300 hover:bg-[#F5F0F8]"
                      >
                        Back
                      </button>
                      <button 
                        onClick={completePreferences}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-[#5B2C6F] to-[#7B3F8F] text-white rounded-lg font-semibold text-[0.95rem] transition-all duration-300 shadow-[0_3px_10px_rgba(91,44,111,0.3)] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(91,44,111,0.4)]"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Payment Section */}
        <AnimatePresence>
          {isAuthenticated && isPreferencesCompleted && (
            <motion.section 
              id="paymentSection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 md:p-8 mb-8"
            >
              <h3 className="text-[1.3rem] font-english-serif text-ramadan-primary mb-6 flex items-center gap-2">
                <span className="text-ramadan-secondary">4.</span> Payment
              </h3>

              <div className="space-y-4">
                <p className="text-center text-[1rem] text-[#5B2C6F] mb-5">
                  Total Amount: <strong>{verifiedGuest?.price} L.E.</strong>
                </p>

                {/* Telda */}
                <div className={`bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_4px_12px_rgba(212,175,55,0.15)] ${preferences.paymentMethod === 'telda' ? 'border-[#D4AF37] shadow-[0_4px_12px_rgba(212,175,55,0.15)]' : 'border-[#E0E0E0] hover:border-[#D4AF37]'}`}>
                  <div 
                    onClick={() => togglePayment('telda')}
                    className={`flex justify-between items-center p-4 cursor-pointer transition-colors duration-300 ${expandedPayment === 'telda' ? 'bg-[#F0E6F6] border-b-2 border-[#E0E0E0]' : 'bg-[#FAFAFA] hover:bg-[#F5F5F5]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${preferences.paymentMethod === 'telda' ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-[#CCC]'}`}>
                        {preferences.paymentMethod === 'telda' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[1.1rem] font-semibold text-[#333]">Telda</span>
                    </div>
                    <ChevronDown className={`text-[#666] transition-transform duration-300 ${expandedPayment === 'telda' ? 'rotate-180' : ''}`} size={20} />
                  </div>
                  
                  <AnimatePresence>
                    {expandedPayment === 'telda' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-white border-t border-[#F0F0F0]">
                          <img src={QR_CODE_URLS.telda} alt="Telda QR Code" className="block w-full max-w-[220px] h-auto mx-auto mb-4 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]" />
                          <p className="text-center text-[1.4rem] font-bold text-[#5B2C6F] mt-2 mb-1">Amount: {verifiedGuest?.price} L.E.</p>
                          <p className="text-center text-[#666] text-[0.85rem] mb-4">Scan QR code or click button to pay</p>
                          <a href="https://telda.me/amrhanygomaa" target="_blank" rel="noopener noreferrer" className="block w-full max-w-[300px] mx-auto p-3 bg-gradient-to-br from-[#5B2C6F] to-[#7B3F8F] text-white text-center no-underline rounded-lg font-semibold text-[0.95rem] transition-all duration-300 shadow-[0_3px_10px_rgba(91,44,111,0.3)] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(91,44,111,0.4)]">
                            Pay via Telda
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Vodafone Cash */}
                <div className={`bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_4px_12px_rgba(212,175,55,0.15)] ${preferences.paymentMethod === 'vodafone' ? 'border-[#D4AF37] shadow-[0_4px_12px_rgba(212,175,55,0.15)]' : 'border-[#E0E0E0] hover:border-[#D4AF37]'}`}>
                  <div 
                    onClick={() => togglePayment('vodafone')}
                    className={`flex justify-between items-center p-4 cursor-pointer transition-colors duration-300 ${expandedPayment === 'vodafone' ? 'bg-[#F0E6F6] border-b-2 border-[#E0E0E0]' : 'bg-[#FAFAFA] hover:bg-[#F5F5F5]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${preferences.paymentMethod === 'vodafone' ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-[#CCC]'}`}>
                        {preferences.paymentMethod === 'vodafone' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[1.1rem] font-semibold text-[#333]">Vodafone Cash</span>
                      <span className="text-[0.75rem] bg-[#FFE5E5] text-[#D32F2F] py-1 px-2 rounded-lg font-medium">+10 L.E. fees</span>
                    </div>
                    <ChevronDown className={`text-[#666] transition-transform duration-300 ${expandedPayment === 'vodafone' ? 'rotate-180' : ''}`} size={20} />
                  </div>
                  
                  <AnimatePresence>
                    {expandedPayment === 'vodafone' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-white border-t border-[#F0F0F0]">
                          <img src={QR_CODE_URLS.vodafone} alt="Vodafone Cash QR Code" className="block w-full max-w-[220px] h-auto mx-auto mb-4 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]" />
                          <p className="text-center text-[1.4rem] font-bold text-[#5B2C6F] mt-2 mb-1">Amount: {(verifiedGuest?.price || 0) + 10} L.E. <span className="text-[0.9rem] font-normal">(includes fees)</span></p>
                          <p className="text-center text-[#666] text-[0.85rem] mb-4">Scan QR code or click button to pay</p>
                          <a href="http://vf.eg/vfcash?id=mt&qrId=aqh175" target="_blank" rel="noopener noreferrer" className="block w-full max-w-[300px] mx-auto p-3 bg-gradient-to-br from-[#5B2C6F] to-[#7B3F8F] text-white text-center no-underline rounded-lg font-semibold text-[0.95rem] transition-all duration-300 shadow-[0_3px_10px_rgba(91,44,111,0.3)] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(91,44,111,0.4)]">
                            Pay via Vodafone Cash
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Instapay */}
                <div className={`bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_4px_12px_rgba(212,175,55,0.15)] ${preferences.paymentMethod === 'instapay' ? 'border-[#D4AF37] shadow-[0_4px_12px_rgba(212,175,55,0.15)]' : 'border-[#E0E0E0] hover:border-[#D4AF37]'}`}>
                  <div 
                    onClick={() => togglePayment('instapay')}
                    className={`flex justify-between items-center p-4 cursor-pointer transition-colors duration-300 ${expandedPayment === 'instapay' ? 'bg-[#F0E6F6] border-b-2 border-[#E0E0E0]' : 'bg-[#FAFAFA] hover:bg-[#F5F5F5]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${preferences.paymentMethod === 'instapay' ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-[#CCC]'}`}>
                        {preferences.paymentMethod === 'instapay' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[1.1rem] font-semibold text-[#333]">Instapay</span>
                    </div>
                    <ChevronDown className={`text-[#666] transition-transform duration-300 ${expandedPayment === 'instapay' ? 'rotate-180' : ''}`} size={20} />
                  </div>
                  
                  <AnimatePresence>
                    {expandedPayment === 'instapay' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-white border-t border-[#F0F0F0]">
                          <img src={QR_CODE_URLS.instapay} alt="Instapay QR Code" className="block w-full max-w-[220px] h-auto mx-auto mb-4 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]" />
                          <p className="text-center text-[1.4rem] font-bold text-[#5B2C6F] mt-2 mb-1">Amount: {verifiedGuest?.price} L.E.</p>
                          <p className="text-center text-[#666] text-[0.85rem] mb-4">Scan QR code or click button to pay</p>
                          <a href="https://ipn.eg/S/amrhany2022/instapay/5k2I2k" target="_blank" rel="noopener noreferrer" className="block w-full max-w-[300px] mx-auto p-3 bg-gradient-to-br from-[#5B2C6F] to-[#7B3F8F] text-white text-center no-underline rounded-lg font-semibold text-[0.95rem] transition-all duration-300 shadow-[0_3px_10px_rgba(91,44,111,0.3)] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(91,44,111,0.4)]">
                            Pay via Instapay
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cash */}
                <div className={`bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_4px_12px_rgba(212,175,55,0.15)] ${preferences.paymentMethod === 'cash' ? 'border-[#D4AF37] shadow-[0_4px_12px_rgba(212,175,55,0.15)]' : 'border-[#E0E0E0] hover:border-[#D4AF37]'}`}>
                  <div 
                    onClick={() => togglePayment('cash')}
                    className={`flex justify-between items-center p-4 cursor-pointer transition-colors duration-300 ${expandedPayment === 'cash' ? 'bg-[#F0E6F6] border-b-2 border-[#E0E0E0]' : 'bg-[#FAFAFA] hover:bg-[#F5F5F5]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${preferences.paymentMethod === 'cash' ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-[#CCC]'}`}>
                        {preferences.paymentMethod === 'cash' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[1.1rem] font-semibold text-[#333]">Cash (Pay at Event)</span>
                    </div>
                    <ChevronDown className={`text-[#666] transition-transform duration-300 ${expandedPayment === 'cash' ? 'rotate-180' : ''}`} size={20} />
                  </div>
                  
                  <AnimatePresence>
                    {expandedPayment === 'cash' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-white text-center border-t border-[#F0F0F0]">
                          <p className="text-[1rem] text-[#333] mb-2">
                            Please bring <strong className="text-[#5B2C6F] text-[1.4rem]">{verifiedGuest?.price} L.E.</strong> cash to the event.
                          </p>
                          <p className="text-[0.85rem] text-[#666]">No advance payment needed</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Confirm Button */}
        <AnimatePresence>
          {isAuthenticated && isPreferencesCompleted && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 no-print"
            >
              {errors.paymentMethod && (
                <p className="text-red-500 text-center mb-4 font-bold">{errors.paymentMethod}</p>
              )}
              <button 
                onClick={handleConfirm}
                disabled={isConfirming}
                className="w-full btn-primary text-lg py-4 shadow-[0_10px_30px_rgba(91,44,111,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? '⏳ Confirming...' : '✅ Confirm Attendance & Preferences'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="text-center pb-8 pt-12 border-t border-ramadan-primary/10">
          <div className="flex justify-center mb-4 text-ramadan-secondary">
            <Moon size={24} />
          </div>
          <p className="text-gray-600 font-english-serif">
            Built with ❤️ by Amr Hani
          </p>
          <p className="text-sm text-gray-500 mt-1">© 2025</p>
          
          <div className="flex justify-center gap-4 mt-6 no-print">
            <button onClick={handleShare} className="p-2 rounded-full bg-white/50 hover:bg-white text-ramadan-primary transition-colors shadow-sm">
              <Share2 size={20} />
            </button>
            <button onClick={() => window.print()} className="p-2 rounded-full bg-white/50 hover:bg-white text-ramadan-primary transition-colors shadow-sm">
              <Printer size={20} />
            </button>
          </div>
        </footer>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
            >
              <div className="bg-gradient-to-r from-ramadan-primary to-[#7D3C98] p-8 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="relative z-10 flex justify-center mb-4"
                >
                  <div className="bg-white rounded-full p-2">
                    <CheckCircle2 size={48} className="text-ramadan-accent" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-english-serif relative z-10">Thank You!</h2>
                <p className="text-white/80 relative z-10 mt-2">Your attendance is confirmed</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Guest</span>
                    <span className="font-semibold text-gray-900">{verifiedGuest?.verifiedName}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-semibold text-gray-900">{verifiedGuest?.price} L.E.</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Drink</span>
                    <span className="font-semibold text-gray-900 arabic-sans text-right max-w-[200px] truncate">{DRINKS.find(d => d.id === preferences.drink)?.english}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full btn-primary"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check Ticket Modal */}
      <AnimatePresence>
        {showCheckTicketModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
            >
              <div className="bg-gradient-to-r from-ramadan-primary to-[#7D3C98] p-6 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
                <h2 className="text-2xl font-english-serif relative z-10">Check Ticket Status</h2>
                <button 
                  onClick={() => {
                    setShowCheckTicketModal(false);
                    setCheckTicketResult(null);
                    setCheckTicketCode('');
                    setCheckTicketError('');
                  }}
                  className="absolute top-4 right-4 text-white/80 hover:text-white z-20 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-6">
                {!checkTicketResult ? (
                  <form onSubmit={handleCheckTicket} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Invitation Code</label>
                      <div className="relative">
                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                          type="text" 
                          value={checkTicketCode}
                          onChange={(e) => setCheckTicketCode(e.target.value.toUpperCase())}
                          placeholder="RAM-2026-XXXXX"
                          className="w-full h-[55px] pl-[45px] pr-4 rounded-xl border-2 border-[#e0e0e0] focus:border-ramadan-secondary focus:outline-none focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-[16px] uppercase"
                          required
                        />
                      </div>
                    </div>
                    {checkTicketError && (
                      <div className="text-red-500 text-sm font-medium text-center">
                        {checkTicketError}
                      </div>
                    )}
                    <button 
                      type="submit"
                      disabled={!checkTicketCode || checkTicketLoading}
                      className="w-full btn-primary py-3 flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {checkTicketLoading ? '⏳ Checking...' : 'Check Status'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left space-y-2">
                      <p className="text-sm text-gray-500">Name: <span className="font-semibold text-gray-900">{checkTicketResult.name}</span></p>
                      <p className="text-sm text-gray-500">Code: <span className="font-mono font-semibold text-gray-900">{checkTicketResult.code}</span></p>
                      <p className="text-sm text-gray-500">Status: <span className={`font-semibold ${checkTicketResult.status.toLowerCase().includes('paid') || checkTicketResult.status.toLowerCase().includes('confirmed') ? 'text-green-600' : 'text-orange-500'}`}>{checkTicketResult.status}</span></p>
                    </div>
                    
                    <div className="flex justify-center py-4">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`Name: ${checkTicketResult.name}\nCode: ${checkTicketResult.code}\nStatus: ${checkTicketResult.status}`)}`} 
                        alt="Ticket QR Code" 
                        className="w-48 h-48 rounded-lg shadow-md"
                      />
                    </div>
                    
                    <p className="text-sm text-gray-500">Screenshot this QR code to present at the event.</p>
                    
                    <button 
                      onClick={() => setCheckTicketResult(null)}
                      className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Check Another Code
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
