import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  MapPin, Clock, Calendar, Upload, CheckCircle2, 
  CreditCard, Smartphone, Banknote, Share2, Printer,
  Moon, Star, ChevronDown, Info, User, Ticket, LogOut
} from 'lucide-react';

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
  { id: 'water', emoji: '💧', arabic: 'مياه طبيعية إيلانو', english: 'Natural Water Elano' },
  { id: 'pepsi', emoji: '🥤', arabic: 'بيبسي', english: 'Pepsi' },
  { id: 'schweppes', emoji: '🍹', arabic: 'شويبس رمان', english: 'Schweppes Pomegranate' },
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

  const [feastDate, setFeastDate] = useState('');
  const [qrs, setQrs] = useState({ telda: '', vodafone: '', instapay: '' });
  
  const [preferences, setPreferences] = useState({
    drink: '',
    hawawshi: '',
    snack: '',
    notes: '',
    paymentMethod: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load admin settings on mount
  useEffect(() => {
    const savedDate = localStorage.getItem('ramadan_feast_date');
    if (savedDate) setFeastDate(savedDate);

    const savedQrs = localStorage.getItem('ramadan_feast_qrs');
    if (savedQrs) setQrs(JSON.parse(savedQrs));
    
    // Check if current user has saved preferences
    const savedGuestData = sessionStorage.getItem('ramadan_verified_guest');
    if (savedGuestData) {
      const parsedGuest = JSON.parse(savedGuestData);
      setVerifiedGuest(parsedGuest);
      setIsAuthenticated(true);
      
      const savedPrefs = localStorage.getItem(`ramadan_prefs_${parsedGuest.verifiedName}`);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  const isAdmin = verifiedGuest?.isAdmin;

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
      const savedPrefs = localStorage.getItem(`ramadan_prefs_${guestData.name}`);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      } else {
        setPreferences({
          drink: '',
          hawawshi: '',
          snack: '',
          notes: '',
          paymentMethod: ''
        });
      }
      
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

  const handleImageUpload = (method: keyof typeof qrs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrs(prev => ({ ...prev, [method]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAdminSettings = () => {
    localStorage.setItem('ramadan_feast_date', feastDate);
    localStorage.setItem('ramadan_feast_qrs', JSON.stringify(qrs));
    alert('Settings saved successfully! ✨');
  };

  const calculateTotal = () => {
    if (!verifiedGuest) return 0;
    let total = verifiedGuest.price;
    if (preferences.paymentMethod === 'vodafone') {
      total += 10;
    }
    return total;
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

  const handleConfirm = () => {
    if (validateForm() && verifiedGuest) {
      localStorage.setItem(`ramadan_prefs_${verifiedGuest.verifiedName}`, JSON.stringify(preferences));
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#5B2C6F', '#50C878']
      });
      
      setShowSuccess(true);
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
                    <div className="bg-white text-ramadan-primary px-4 py-2 rounded-xl font-bold text-lg shadow-md">
                      Amount to pay: {verifiedGuest?.price} L.E.
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-white/80 hover:text-white flex items-center gap-1 text-sm transition-colors"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                </div>
              </motion.section>

              {/* Admin Panel */}
        <AnimatePresence>
          {isAdmin && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-6 md:p-8 mb-8 border-ramadan-secondary/50 overflow-hidden no-print"
            >
              <h3 className="text-2xl font-english-serif text-ramadan-secondary mb-6 flex items-center gap-2">
                ⚙️ Host Settings
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Set Feast Date</label>
                  <input 
                    type="date" 
                    value={feastDate}
                    onChange={(e) => setFeastDate(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-ramadan-secondary/30 focus:border-ramadan-secondary focus:outline-none bg-white/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['telda', 'vodafone', 'instapay'] as const).map((method) => (
                    <div key={method} className="border-2 border-dashed border-ramadan-secondary/30 rounded-xl p-4 text-center hover:bg-white/50 transition-colors relative">
                      <label className="cursor-pointer block">
                        <Upload className="mx-auto mb-2 text-ramadan-secondary" />
                        <span className="text-sm font-medium text-gray-600 capitalize">{method} QR</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload(method)}
                        />
                      </label>
                      {qrs[method] && (
                        <div className="mt-2 relative group">
                          <img src={qrs[method]} alt={`${method} QR`} className="w-full h-32 object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs">Click to change</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={saveAdminSettings}
                  className="w-full btn-secondary border-ramadan-secondary text-ramadan-secondary hover:bg-ramadan-secondary/10"
                >
                  💾 Save Settings
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

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
                  {feastDate ? new Date(feastDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Date to be announced by host"}
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
                <h4 className="font-semibold text-gray-900">Location</h4>
                <p className="text-gray-600 mt-1 mb-3">Villa in New Cairo</p>
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
          {isAuthenticated && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 md:p-8 mb-8"
            >
              <h3 className="text-2xl font-english-serif text-ramadan-primary mb-6 flex items-center gap-2">
                <span className="text-ramadan-secondary">3.</span> Your Preferences
              </h3>

              <div className="space-y-12">
                {/* Drink */}
                <div>
                  <div className="mb-5">
                    <h4 className="font-arabic-sans font-bold text-[1.4rem] md:text-[1.8rem] text-ramadan-primary mb-2">Favorite Drink</h4>
                    <div className="w-[50px] h-[3px] bg-ramadan-secondary"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {DRINKS.map((drink, index) => (
                      <motion.div 
                        key={drink.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`preference-card min-h-[120px] sm:min-h-[180px] ${preferences.drink === drink.id ? 'selected' : ''}`}
                        onClick={() => setPreferences({...preferences, drink: drink.id})}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreferences({...preferences, drink: drink.id});
                          }
                        }}
                        role="radio"
                        aria-checked={preferences.drink === drink.id}
                      >
                        <div className="text-[60px] mb-3 leading-none">{drink.emoji}</div>
                        <div className={`font-arabic-sans font-bold text-[16px] mb-1 ${preferences.drink === drink.id ? 'text-ramadan-secondary' : 'text-gray-800'}`}>{drink.arabic}</div>
                        <div className={`font-english-sans text-[14px] ${preferences.drink === drink.id ? 'text-ramadan-secondary/80' : 'text-gray-500'}`}>{drink.english}</div>
                      </motion.div>
                    ))}
                  </div>
                  {errors.drink && <p className="text-red-500 text-sm mt-2">{errors.drink}</p>}
                </div>

                {/* Hawawshi */}
                <div>
                  <div className="mb-5">
                    <h4 className="font-arabic-sans font-bold text-[1.4rem] md:text-[1.8rem] text-ramadan-primary mb-2">Hawawshi Preference</h4>
                    <div className="w-[50px] h-[3px] bg-ramadan-secondary"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {HAWAWSHI_PREFS.map((pref, index) => (
                      <motion.div 
                        key={pref.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`preference-card min-h-[150px] sm:min-h-[200px] ${preferences.hawawshi === pref.id ? 'selected' : ''}`}
                        onClick={() => setPreferences({...preferences, hawawshi: pref.id})}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreferences({...preferences, hawawshi: pref.id});
                          }
                        }}
                        role="radio"
                        aria-checked={preferences.hawawshi === pref.id}
                      >
                        <div className="text-[80px] mb-4 leading-none">{pref.emoji}</div>
                        <div className={`font-arabic-sans font-bold text-[18px] mb-1 ${preferences.hawawshi === pref.id ? 'text-ramadan-secondary' : 'text-gray-800'}`}>{pref.arabic}</div>
                        <div className={`font-english-sans text-[15px] ${preferences.hawawshi === pref.id ? 'text-ramadan-secondary/80' : 'text-gray-500'}`}>{pref.english}</div>
                      </motion.div>
                    ))}
                  </div>
                  {errors.hawawshi && <p className="text-red-500 text-sm mt-2">{errors.hawawshi}</p>}
                </div>

                {/* Snack */}
                <div>
                  <div className="mb-5">
                    <h4 className="font-arabic-sans font-bold text-[1.4rem] md:text-[1.8rem] text-ramadan-primary mb-2">Favorite Snack</h4>
                    <div className="w-[50px] h-[3px] bg-ramadan-secondary"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SNACKS.map((snack, index) => (
                      <motion.div 
                        key={snack.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`preference-card min-h-[120px] sm:min-h-[150px] ${preferences.snack === snack.id ? 'selected' : ''}`}
                        onClick={() => setPreferences({...preferences, snack: snack.id})}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreferences({...preferences, snack: snack.id});
                          }
                        }}
                        role="radio"
                        aria-checked={preferences.snack === snack.id}
                      >
                        <div className="text-[50px] mb-2 leading-none">{snack.emoji}</div>
                        <div className={`font-arabic-sans font-bold text-[16px] mb-1 ${preferences.snack === snack.id ? 'text-ramadan-secondary' : 'text-gray-800'}`}>{snack.arabic}</div>
                        <div className={`font-english-sans text-[14px] ${preferences.snack === snack.id ? 'text-ramadan-secondary/80' : 'text-gray-500'}`}>{snack.english}</div>
                      </motion.div>
                    ))}
                  </div>
                  {errors.snack && <p className="text-red-500 text-sm mt-2">{errors.snack}</p>}
                </div>

                {/* Notes */}
                <div>
                  <div className="mb-5">
                    <h4 className="font-arabic-sans font-bold text-[1.4rem] md:text-[1.8rem] text-ramadan-primary mb-2 flex items-center gap-2">
                      📝 Additional Notes
                    </h4>
                    <div className="w-[50px] h-[3px] bg-ramadan-secondary"></div>
                  </div>
                  <div className="relative group">
                    <textarea 
                      value={preferences.notes}
                      onChange={(e) => setPreferences({...preferences, notes: e.target.value})}
                      placeholder="Any special requests or dietary restrictions?"
                      className="w-full p-5 rounded-[15px] border-2 border-gray-200 bg-white/80 focus:outline-none focus:border-ramadan-secondary focus:bg-white transition-all duration-300 min-h-[120px] resize-y shadow-sm group-hover:shadow-md font-english-sans text-gray-800 placeholder:text-gray-400 placeholder:font-english-serif placeholder:italic"
                    ></textarea>
                    <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-english-sans">
                      {preferences.notes.length} chars
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Payment Section */}
        <AnimatePresence>
          {isAuthenticated && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 md:p-8 mb-8"
            >
              <h3 className="text-2xl font-english-serif text-ramadan-primary mb-6 flex items-center gap-2">
                <span className="text-ramadan-secondary">4.</span> Payment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {PAYMENT_METHODS.map(method => {
                  const Icon = method.icon;
                  return (
                    <label 
                      key={method.id}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center ${preferences.paymentMethod === method.id ? 'border-ramadan-primary bg-ramadan-primary/5' : 'border-transparent bg-white/50 hover:bg-white/80'}`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value={method.id}
                        checked={preferences.paymentMethod === method.id}
                        onChange={(e) => setPreferences({...preferences, paymentMethod: e.target.value})}
                        className="hidden"
                      />
                      <Icon className={preferences.paymentMethod === method.id ? 'text-ramadan-primary' : 'text-gray-500'} />
                      <span className="font-medium text-sm">{method.label}</span>
                    </label>
                  );
                })}
              </div>
              {errors.paymentMethod && <p className="text-red-500 text-sm -mt-4 mb-6">{errors.paymentMethod}</p>}

              {/* Dynamic Payment Display */}
              <AnimatePresence mode="wait">
                {preferences.paymentMethod && (
                  <motion.div 
                    key={preferences.paymentMethod}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/60 p-6 rounded-2xl border border-white/80 flex flex-col items-center text-center"
                  >
                    <div className="text-3xl font-bold text-ramadan-primary mb-2">
                      {calculateTotal()} L.E.
                    </div>
                    
                    {preferences.paymentMethod === 'vodafone' && (
                      <div className="text-sm text-ramadan-secondary font-medium mb-4 flex items-center gap-1">
                        <Info size={16} /> Includes +10 L.E. transfer fees
                      </div>
                    )}

                    {preferences.paymentMethod !== 'cash' ? (
                      <>
                        <p className="text-gray-600 mb-6">Scan QR code or click button to pay</p>
                        
                        {qrs[preferences.paymentMethod as keyof typeof qrs] ? (
                          <div className="bg-white p-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.1)] mb-6 animate-pulse-glow">
                            <img 
                              src={qrs[preferences.paymentMethod as keyof typeof qrs]} 
                              alt={`${preferences.paymentMethod} QR Code`} 
                              className="w-[200px] h-[200px] object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-[200px] h-[200px] bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-400 text-sm text-center p-4">
                            QR Code not uploaded by host yet. Please use the link below.
                          </div>
                        )}

                        <a 
                          href={PAYMENT_METHODS.find(m => m.id === preferences.paymentMethod)?.link || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-primary w-full max-w-xs"
                        >
                          Pay via {PAYMENT_METHODS.find(m => m.id === preferences.paymentMethod)?.label.split(' ')[0]}
                        </a>
                      </>
                    ) : (
                      <p className="text-gray-600 mt-2 text-lg">
                        Please bring the exact amount in cash to the event.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Confirm Button */}
        <AnimatePresence>
          {isAuthenticated && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 no-print"
            >
              <button 
                onClick={handleConfirm}
                className="w-full btn-primary text-lg py-4 shadow-[0_10px_30px_rgba(91,44,111,0.3)]"
              >
                ✅ Confirm Attendance & Preferences
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
                    <span className="font-semibold text-gray-900">{calculateTotal()} L.E. ({PAYMENT_METHODS.find(m => m.id === preferences.paymentMethod)?.label.split(' ')[0]})</span>
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
    </div>
  );
}
