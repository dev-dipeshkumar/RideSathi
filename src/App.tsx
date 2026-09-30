import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bike,
  CalendarDays,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleUserRound,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  Filter,
  Fuel,
  Gauge,
  Headphones,
  Home,
  ImagePlus,
  IndianRupee,
  Info,
  KeyRound,
  Landmark,
  LifeBuoy,
  ListFilter,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Timer,
  Trash2,
  Upload,
  UserCheck,
  Users,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';

// RideSathi is intentionally composed as a portrait mobile surface. The preview is a
// device-sized client so the same interaction model can be lifted into Expo/React Native.

type Role = 'traveler' | 'operator' | 'admin';
type Screen =
  | 'login'
  | 'explore'
  | 'map'
  | 'bookings'
  | 'active'
  | 'profile'
  | 'vehicle'
  | 'bookingFlow'
  | 'kyc'
  | 'payment'
  | 'confirmation'
  | 'bookingDetail'
  | 'feedback'
  | 'dashboard'
  | 'operatorBookings'
  | 'vehicles'
  | 'vehicleForm'
  | 'operatorBookingDetail'
  | 'handover'
  | 'activeRentals'
  | 'activeRentalDetail'
  | 'return'
  | 'alerts'
  | 'reviews'
  | 'approvals'
  | 'adminBookings'
  | 'adminBookingDetail'
  | 'adminKycReview'
  | 'adminKycDetail'
  | 'adminSOS'
  | 'sosDetail'
  | 'metrics';

type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'PENDING_INSPECTION' | 'MAINTENANCE' | 'BLOCKED';
type BookingStatus = 'PENDING_KYC' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'ACTIVE' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';

type Vehicle = {
  id: string;
  type: 'Scooter' | 'Bike' | 'Car' | 'Jeep';
  name: string;
  price: number;
  operator: string;
  rating: number;
  reviews: number;
  status: VehicleStatus;
  color: string;
  verified: boolean;
  seats: number;
  fuel: string;
  condition: string;
};

type Booking = {
  id: string;
  vehicleId: string;
  vehicleName: string;
  operator: string;
  start: string;
  end: string;
  amount: number;
  status: BookingStatus;
  payment: 'PENDING' | 'SUCCESS' | 'FAILED';
  token: string;
  kyc: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating?: number;
};

type SOSAlert = {
  id: string;
  traveler: string;
  vehicle: string;
  time: string;
  status: 'RAISED' | 'ACKNOWLEDGED' | 'RESOLVED';
  location: string;
};

type ReturnCondition = 'GOOD' | 'INSPECTION' | 'MAINTENANCE';

type ClosedRentalSummary = {
  bookingId: string;
  vehicleName: string;
  token: string;
  vehicleStatus: 'AVAILABLE' | 'PENDING_INSPECTION';
  condition: ReturnCondition;
  closedAt: string;
};

type KycReview = {
  id: string;
  traveler: string;
  bookingId: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  idType: string;
  maskedId: string;
  submitted: string;
  consent: string;
};

type HandoverTokenState = 'idle' | 'invalid' | 'expired' | 'already-used' | 'valid';

type GeoPoint = { lat: number; lng: number };

const mountAbuCenter: GeoPoint = { lat: 24.5926, lng: 72.7156 };
const mapRidePoints: GeoPoint[] = [
  { lat: 24.5926, lng: 72.7156 },
  { lat: 24.6001, lng: 72.7112 },
  { lat: 24.5867, lng: 72.7231 },
  { lat: 24.6061, lng: 72.7088 },
];

const colors = {
  green: '#1f684b',
  orange: '#e89532',
  ink: '#15342a',
  muted: '#73817a',
  red: '#e24e43',
};

const demoAccounts: Record<Role, { email: string; name: string; label: string }> = {
  traveler: { email: 'traveler@demo.com', name: 'Aarav Mehta', label: 'Traveler' },
  operator: { email: 'operator@demo.com', name: 'Abu Hill Rentals', label: 'Operator' },
  admin: { email: 'admin@demo.com', name: 'RideSathi Admin', label: 'Admin' },
};

const vehiclesSeed: Vehicle[] = [
  { id: 'v1', type: 'Scooter', name: 'Honda Activa 6G', price: 499, operator: 'Abu Hill Rentals', rating: 4.9, reviews: 86, status: 'AVAILABLE', color: '#d6ebe1', verified: true, seats: 2, fuel: 'Petrol', condition: 'Serviced this week · Helmet included' },
  { id: 'v2', type: 'Scooter', name: 'Suzuki Access 125', price: 549, operator: 'Mount Abu Riders', rating: 4.8, reviews: 54, status: 'RESERVED', color: '#e9e4d5', verified: true, seats: 2, fuel: 'Petrol', condition: 'Clean & well maintained · 2 helmets' },
  { id: 'v3', type: 'Bike', name: 'Bajaj Pulsar 150', price: 699, operator: 'Abu Hill Rentals', rating: 4.7, reviews: 38, status: 'AVAILABLE', color: '#dbe4eb', verified: true, seats: 2, fuel: 'Petrol', condition: 'City-ready · Top box available' },
  { id: 'v4', type: 'Bike', name: 'Royal Enfield Classic', price: 1199, operator: 'Mount Abu Riders', rating: 4.9, reviews: 31, status: 'AVAILABLE', color: '#efe0d4', verified: true, seats: 2, fuel: 'Petrol', condition: 'Mountain tuned · Riding kit included' },
  { id: 'v5', type: 'Car', name: 'Maruti WagonR', price: 1800, operator: 'Abu Hill Rentals', rating: 4.6, reviews: 24, status: 'AVAILABLE', color: '#e5e5eb', verified: true, seats: 5, fuel: 'Petrol', condition: 'AC working · Unlimited local miles' },
  { id: 'v6', type: 'Car', name: 'Hyundai i10', price: 2000, operator: 'Mount Abu Riders', rating: 4.8, reviews: 19, status: 'AVAILABLE', color: '#e0e8ee', verified: true, seats: 5, fuel: 'Petrol', condition: 'AC working · Clean interiors' },
  { id: 'v7', type: 'Jeep', name: 'Mahindra Thar', price: 3500, operator: 'Abu Hill Rentals', rating: 4.9, reviews: 15, status: 'AVAILABLE', color: '#e7eadc', verified: true, seats: 4, fuel: 'Diesel', condition: 'Hill drive ready · Soft top' },
  { id: 'v8', type: 'Scooter', name: 'Honda Dio', price: 479, operator: 'Mount Abu Riders', rating: 4.5, reviews: 8, status: 'PENDING_INSPECTION', color: '#ece1ea', verified: false, seats: 2, fuel: 'Petrol', condition: 'Awaiting verification' },
];

const bookingsSeed: Booking[] = [
  { id: 'RS-2048', vehicleId: 'v2', vehicleName: 'Suzuki Access 125', operator: 'Mount Abu Riders', start: '18 Oct · 9:00 AM', end: '19 Oct · 9:00 AM', amount: 549, status: 'CONFIRMED', payment: 'SUCCESS', token: 'RS-7K4M2', kyc: 'VERIFIED' },
  { id: 'RS-1932', vehicleId: 'v1', vehicleName: 'Honda Activa 6G', operator: 'Abu Hill Rentals', start: 'Today · 10:30 AM', end: 'Today · 7:30 PM', amount: 499, status: 'ACTIVE', payment: 'SUCCESS', token: 'RS-7392', kyc: 'VERIFIED' },
  { id: 'RS-1780', vehicleId: 'v3', vehicleName: 'Bajaj Pulsar 150', operator: 'Abu Hill Rentals', start: '10 Oct · 8:00 AM', end: '10 Oct · 8:00 PM', amount: 699, status: 'COMPLETED', payment: 'SUCCESS', token: 'RS-5QD81', kyc: 'VERIFIED', rating: 5 },
];

const alertsSeed: SOSAlert[] = [
  { id: 'SOS-09', traveler: 'Aarav Mehta', vehicle: 'Honda Activa 6G', time: 'Just now · 10:56 AM', status: 'RAISED', location: 'Near Nakki Lake · 24.5926, 72.7156' },
  { id: 'SOS-08', traveler: 'Priya Shah', vehicle: 'Royal Enfield Classic', time: 'Yesterday · 5:40 PM', status: 'RESOLVED', location: 'Sunset Point · 24.6061, 72.7088' },
];

const kycReviewsSeed: KycReview[] = [
  { id: 'KYC-104', traveler: 'Aarav Mehta', bookingId: 'RS-1932', status: 'PENDING', idType: 'Driving licence', maskedId: 'DL •••• 6218', submitted: 'Today · 10:12 AM', consent: 'Consent granted for verification' },
  { id: 'KYC-103', traveler: 'Priya Shah', bookingId: 'RS-2048', status: 'VERIFIED', idType: 'Aadhaar', maskedId: 'Aadhaar •••• 8842', submitted: 'Yesterday · 6:15 PM', consent: 'Consent granted for verification' },
  { id: 'KYC-099', traveler: 'Kabir Joshi', bookingId: 'RS-1780', status: 'REJECTED', idType: 'Passport', maskedId: 'Passport •••• 1904', submitted: '10 Oct · 4:40 PM', consent: 'Consent granted for verification' },
];

type AppNotification = {
  title: string;
  body: string;
  time: string;
  tone: 'green' | 'orange' | 'blue' | 'red';
  icon: 'check' | 'shield' | 'headphones' | 'bike' | 'alert' | 'file';
};

const notificationsByRole: Record<Role, AppNotification[]> = {
  traveler: [
    { title: 'Booking confirmed', body: 'Your Suzuki Access pickup is confirmed for 18 Oct.', time: '8 min ago', tone: 'green', icon: 'check' },
    { title: 'KYC verified', body: 'Your masked ID is ready for safer handover.', time: '22 min ago', tone: 'orange', icon: 'shield' },
    { title: 'Support is on standby', body: 'Live support is available throughout your active rental.', time: 'Yesterday', tone: 'blue', icon: 'headphones' },
  ],
  operator: [
    { title: 'New booking ready', body: 'Priya Shah is ready for token handover today.', time: '8 min ago', tone: 'green', icon: 'bike' },
    { title: 'SOS alert raised', body: 'Aarav Mehta needs support near Nakki Lake.', time: 'Just now', tone: 'red', icon: 'alert' },
    { title: 'Return closure update', body: 'A completed rental is ready for traveler feedback.', time: 'Yesterday', tone: 'blue', icon: 'check' },
  ],
  admin: [
    { title: 'Operator approval pending', body: 'Sharma Rides has submitted documents for review.', time: '2 hours ago', tone: 'orange', icon: 'file' },
    { title: 'Vehicle approval pending', body: 'Honda Dio is ready for inspection.', time: '3 hours ago', tone: 'green', icon: 'bike' },
    { title: 'SOS alert raised', body: 'One safety incident needs attention now.', time: 'Just now', tone: 'red', icon: 'alert' },
  ],
};

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

function vehicleArt(type: Vehicle['type'], color: string, compact = false) {
  const isCar = type === 'Car' || type === 'Jeep';
  const isBike = type === 'Bike';
  const body = isCar ? '#406d5b' : isBike ? '#e89532' : '#2e8a64';
  const vehicle = isCar
    ? `<path d="M33 100h166l-12-31H55L33 100Z" fill="${body}"/><path d="m55 69 16-29h66l27 29" fill="${body}"/><path d="M82 47h51l14 20H70l12-20Z" fill="#e8f0ec"/><circle cx="66" cy="105" r="17" fill="#17362c"/><circle cx="168" cy="105" r="17" fill="#17362c"/><circle cx="66" cy="105" r="7" fill="#b3c9be"/><circle cx="168" cy="105" r="7" fill="#b3c9be"/>`
    : `<circle cx="67" cy="113" r="17" fill="#17362c"/><circle cx="166" cy="113" r="17" fill="#17362c"/><circle cx="67" cy="113" r="7" fill="#b3c9be"/><circle cx="166" cy="113" r="7" fill="#b3c9be"/><path d="M67 98 91 58l42 2 33 38h-25l-20-19-19 20H67Z" fill="${body}"/><path d="m100 50 12-23h22l-12 25" fill="${body}"/><path d="m129 28 13 4 16 29" stroke="#17362c" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150"><rect width="240" height="150" rx="24" fill="${color}"/><circle cx="205" cy="27" r="45" fill="#ffffff" opacity=".22"/><path d="M0 128c35-19 72-4 110-17 37-13 78-17 130 1v38H0Z" fill="#ffffff" opacity=".38"/>${vehicle}<text x="18" y="25" font-family="Arial" font-size="11" font-weight="700" fill="#315146" opacity=".7">MOUNT ABU · VERIFIED</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const vehiclePhotos: Record<string, string> = {
  v1: '/honda-activa.jpg',
  v2: '/suzuki-access.jpg',
  v3: '/bajaj-pulsar.jpg',
  v4: '/royal-enfield.jpg',
  v5: '/wagonr.jpg',
  v6: '/hyundai-i10.jpg',
  v7: '/thar.jpg',
  v8: '/honda-dio.jpg',
};

function vehiclePhoto(vehicle: Vehicle) {
  return vehiclePhotos[vehicle.id] ?? '/honda-activa.jpg';
}

function Icon({ icon: I, size = 18, strokeWidth = 1.9, className = '' }: { icon: LucideIcon; size?: number; strokeWidth?: number; className?: string }) {
  return <I size={size} strokeWidth={strokeWidth} className={className} />;
}


function LoaderOverlay({ visible, label = 'Loading RideSathi' }: { visible: boolean; label?: string }) {
  if (!visible) return null;
  return <div className="loader-overlay" role="status" aria-live="polite">
    <div className="loader-card">
      <div className="loader-logo-wrap"><img src="/ridesathi-icon.png" alt="RideSathi" /><span className="loader-orbit" /></div>
      <strong>{label}</strong>
      <span>Mount Abu pilot</span>
      <div className="loader-progress"><i /></div>
    </div>
  </div>;
}

function DesktopMapScene() {
  return <div className="desktop-map-scene" aria-hidden="true">
    <div className="desktop-scene-header"><div className="scene-brand"><img src="/ridesathi-icon.png" alt="" /><strong>RideSathi</strong></div><span><span className="live-scene-dot" /> Mount Abu live network</span></div>
    <div className="scene-copy scene-copy-left"><span className="eyebrow">LIVE PILOT AREA</span><strong>Every ride<br /><em>has a route.</em></strong><span>Verified local mobility across<br />the hills of Mount Abu.</span></div>
    <div className="scene-copy scene-copy-right"><span className="scene-stat-number">24</span><span>rides moving now</span><i className="scene-stat-line" /></div>
    <div className="scene-map-grid"><span className="scene-road scene-road-a" /><span className="scene-road scene-road-b" /><span className="scene-road scene-road-c" /><span className="scene-road scene-road-d" /><span className="scene-road scene-road-e" /><span className="scene-route route-one" /><span className="scene-route route-two" /><span className="scene-pin scene-pin-a"><MapPin size={23} fill={colors.orange} /></span><span className="scene-pin scene-pin-b"><MapPin size={19} fill={colors.green} /></span><span className="scene-landmark landmark-lake">Nakki Lake</span><span className="scene-landmark landmark-point">Sunset Point</span><span className="scene-vehicle vehicle-one"><Bike size={20} fill={colors.green} /><b>RS 2048</b></span><span className="scene-vehicle vehicle-two"><Car size={20} fill={colors.orange} /><b>RS 1180</b></span></div>
    <div className="scene-bottom"><span><span className="scene-key green-key" /> active rental</span><span><span className="scene-key orange-key" /> pickup nearby</span><span className="scene-coordinates">24.5926° N · 72.7156° E</span></div>
  </div>;
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>('traveler');
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('traveler@demo.com');
  const [password, setPassword] = useState('demo123');
  const [vehicles, setVehicles] = useState<Vehicle[]>(vehiclesSeed);
  const [bookings, setBookings] = useState<Booking[]>(bookingsSeed);
  const [alerts, setAlerts] = useState<SOSAlert[]>(alertsSeed);
  const [kycReviews, setKycReviews] = useState<KycReview[]>(kycReviewsSeed);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(vehiclesSeed[0]);
  const [selectedBooking, setSelectedBooking] = useState<Booking>(bookingsSeed[0]);
  const [selectedKyc, setSelectedKyc] = useState<KycReview>(kycReviewsSeed[0]);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert>(alertsSeed[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<'filters' | 'sos' | 'cancel' | 'logout' | 'start' | 'end' | 'return' | 'adminActions' | null>(null);
  const [activeRental, setActiveRental] = useState(true);
  const [locationConsent, setLocationConsent] = useState(false);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [sosRaised, setSosRaised] = useState(false);
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'success' | 'failed'>('idle');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [filterType, setFilterType] = useState('All');
  const [pickupTime, setPickupTime] = useState('9:00 AM');
  const [returnTime, setReturnTime] = useState('9:00 AM');
  const [adminTab, setAdminTab] = useState<'operators' | 'vehicles'>('operators');
  const [adminBookingTab, setAdminBookingTab] = useState<'all' | 'active' | 'completed'>('all');
  const [operatorTab, setOperatorTab] = useState<'all' | 'upcoming' | 'active'>('all');
  const [travelerBookingTab, setTravelerBookingTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [formVehicle, setFormVehicle] = useState({ type: 'Scooter', make: '', model: '', reg: '', price: '', fuel: 'Petrol', seats: '2', notes: '' });
  const [vehiclePhotoName, setVehiclePhotoName] = useState('');
  const [returnToken, setReturnToken] = useState('');
  const [returnVerified, setReturnVerified] = useState(false);
  const [returnError, setReturnError] = useState(false);
  const [returnCondition, setReturnCondition] = useState<ReturnCondition>('GOOD');
  const [returnNotes, setReturnNotes] = useState('');
  const [lastClosedRental, setLastClosedRental] = useState<ClosedRentalSummary | null>(null);
  const [operatorActiveVehicleId, setOperatorActiveVehicleId] = useState('v1');
  const [handoverToken, setHandoverToken] = useState('');
  const [handoverTokenState, setHandoverTokenState] = useState<HandoverTokenState>('idle');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingLabel, setLoadingLabel] = useState('Starting RideSathi');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsReadByRole, setNotificationsReadByRole] = useState<Record<Role, boolean>>(() => {
    try {
      const stored = window.localStorage.getItem('ridesathi-notifications-read');
      return stored ? { traveler: false, operator: false, admin: false, ...JSON.parse(stored) } : { traveler: false, operator: false, admin: false };
    } catch {
      return { traveler: false, operator: false, admin: false };
    }
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('ridesathi-notifications-read', JSON.stringify(notificationsReadByRole));
  }, [notificationsReadByRole]);

  const notificationsRead = notificationsReadByRole[role];
  const currentUser = demoAccounts[role];
  const liveVehicle = vehicles.find((v) => v.id === 'v1') ?? vehicles[0];

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const requestLocationAccess = () => {
    if (!navigator.geolocation) {
      notify('Location is not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocationConsent(true);
        notify('Location shared for safer rides');
      },
      () => {
        setLocationConsent(false);
        notify('Location permission was not granted');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const requestCameraAccess = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. You can enter the token manually.');
      setCameraOpen(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      setCameraError(null);
      setCameraStream(stream);
      setCameraOpen(true);
    } catch {
      setCameraError('Camera permission was denied. Allow camera access or enter the token manually.');
      setCameraStream(null);
      setCameraOpen(true);
    }
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setCameraOpen(false);
    setCameraError(null);
  };

  const openNotifications = () => setNotificationsOpen(true);

  const markNotificationsRead = () => {
    setNotificationsReadByRole((current) => ({ ...current, [role]: true }));
  };

  const quickLogin = (nextRole: Role) => {
    const account = demoAccounts[nextRole];
    setLoginError(null);
    setLoginLoading(true);
    setLoadingLabel(`Opening ${account.label} workspace`);
    setIsLoading(true);
    window.setTimeout(() => {
      setRole(nextRole);
      setEmail(account.email);
      setPassword('demo123');
      setAuthenticated(true);
      setScreen(nextRole === 'traveler' ? 'explore' : nextRole === 'operator' ? 'dashboard' : 'approvals');
      setLoginLoading(false);
      setIsLoading(false);
      notify(`Welcome back, ${account.name.split(' ')[0]}`);
    }, 480);
  };

  const handleLogin = () => {
    const matchedRole = (Object.keys(demoAccounts) as Role[]).find((key) => demoAccounts[key].email === email.trim().toLowerCase());
    if (!matchedRole || password.length < 4) {
      setLoginError('Enter a valid RideSathi demo email and a password with at least 4 characters.');
      setLoginLoading(false);
      return;
    }
    setLoginError(null);
    quickLogin(matchedRole);
  };

  const signOut = () => {
    setAuthenticated(false);
    setScreen('login');
    setModal(null);
  };

  const navigate = (next: Screen) => {
    if (next === screen) return;
    setLoadingLabel('Loading your RideSathi screen');
    setIsLoading(true);
    window.setTimeout(() => {
      setScreen(next);
      setIsLoading(false);
    }, 320);
  };

  const updateBooking = (id: string, patch: Partial<Booking>) => {
    setBookings((all) => all.map((booking) => (booking.id === id ? { ...booking, ...patch } : booking)));
  };

  const confirmBookingFlow = () => {
    setSelectedBooking({ id: 'RS-2216', vehicleId: selectedVehicle.id, vehicleName: selectedVehicle.name, operator: selectedVehicle.operator, start: `21 Oct · ${pickupTime}`, end: `22 Oct · ${returnTime}`, amount: selectedVehicle.price, status: 'PENDING_KYC', payment: 'PENDING', token: '—', kyc: 'PENDING' });
    setKycSubmitted(false);
    setPaymentState('idle');
    navigate('kyc');
  };

  const submitKyc = () => {
    setKycSubmitted(true);
    setSelectedBooking((booking) => ({ ...booking, kyc: 'VERIFIED', status: 'PENDING_PAYMENT' }));
    notify('KYC submitted securely · masked ID saved');
    window.setTimeout(() => navigate('payment'), 400);
  };

  const payNow = (shouldFail = false) => {
    if (shouldFail) {
      setPaymentState('failed');
      return;
    }
    const token = `RS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const paidBooking = { ...selectedBooking, status: 'CONFIRMED' as BookingStatus, payment: 'SUCCESS' as const, token };
    setSelectedBooking(paidBooking);
    setBookings((all) => [paidBooking, ...all.filter((booking) => booking.id !== paidBooking.id)]);
    setPaymentState('success');
    navigate('confirmation');
  };

  const raiseSos = () => {
    if (!activeRental) {
      notify('SOS is available only during an active rental');
      setModal(null);
      return;
    }
    setSosRaised(true);
    setAlerts((all) => [{ id: `SOS-${all.length + 2}`, traveler: 'Aarav Mehta', vehicle: liveVehicle.name, time: 'Just now · 10:56 AM', status: 'RAISED', location: locationConsent ? 'Live location shared · Mount Abu' : 'Location unavailable', }, ...all]);
    setModal(null);
    notify('SOS sent to operator & RideSathi support');
  };

  const openSosDetail = (alert: SOSAlert) => {
    setSelectedAlert(alert);
    navigate('sosDetail');
  };

  const updateAlertStatus = (id: string, status: SOSAlert['status']) => {
    setAlerts((all) => all.map((alert) => alert.id === id ? { ...alert, status } : alert));
    setSelectedAlert((alert) => alert.id === id ? { ...alert, status } : alert);
    notify(status === 'ACKNOWLEDGED' ? 'Alert acknowledged' : 'Alert marked resolved');
  };

  const startRental = () => {
    setActiveRental(true);
    setLastClosedRental(null);
    setReturnToken('');
    setReturnVerified(false);
    setReturnError(false);
    setReturnCondition('GOOD');
    setReturnNotes('');
    setHandoverToken('');
    setHandoverTokenState('idle');
    setSelectedBooking((booking) => ({ ...booking, status: 'ACTIVE' }));
    updateBooking(selectedBooking.id, { status: 'ACTIVE' });
    setOperatorActiveVehicleId(selectedBooking.vehicleId);
    setVehicles((all) => all.map((v) => (v.id === selectedBooking.vehicleId ? { ...v, status: 'RENTED' } : v)));
    setModal(null);
    notify('Rental started · vehicle is now RENTED');
    navigate(role === 'operator' ? 'activeRentals' : 'active');
  };

  const closeRental = () => {
    if (!returnVerified) {
      notify('Verify the return token first');
      setModal(null);
      return;
    }

    const nextVehicleStatus: ClosedRentalSummary['vehicleStatus'] = returnCondition === 'GOOD' ? 'AVAILABLE' : 'PENDING_INSPECTION';
    const closedBooking: Booking = { ...selectedBooking, status: 'COMPLETED' };
    const closedSummary: ClosedRentalSummary = {
      bookingId: closedBooking.id,
      vehicleName: closedBooking.vehicleName,
      token: closedBooking.token,
      vehicleStatus: nextVehicleStatus,
      condition: returnCondition,
      closedAt: 'Just now',
    };

    setActiveRental(false);
    setLocationConsent(false);
    setSelectedBooking(closedBooking);
    setLastClosedRental(closedSummary);
    updateBooking(closedBooking.id, { status: 'COMPLETED' });
    setVehicles((all) => all.map((v) => (v.id === closedBooking.vehicleId ? { ...v, status: nextVehicleStatus } : v)));
    setReturnToken('');
    setReturnVerified(false);
    setReturnError(false);
    setReturnCondition('GOOD');
    setReturnNotes('');
    setModal(null);
    notify(`Rental closed · vehicle ${nextVehicleStatus === 'AVAILABLE' ? 'marked available' : 'sent for inspection'}`);
    navigate(role === 'operator' ? 'activeRentals' : 'bookings');
  };

  const approve = (label: string) => notify(`${label} approved and now visible in the network`);
  const reject = (label: string) => notify(`${label} sent back for review`);

  if (!authenticated) return <div className="preview-shell"><DesktopMapScene /><LoginScreen email={email} password={password} setEmail={(value) => { setEmail(value); setLoginError(null); }} setPassword={(value) => { setPassword(value); setLoginError(null); }} role={role} setRole={(nextRole) => { setRole(nextRole); setLoginError(null); }} onLogin={handleLogin} onDemo={quickLogin} error={loginError} loading={loginLoading} /><LoaderOverlay visible={isLoading} label={loadingLabel} /></div>;

  return (
    <div className="preview-shell">
      <DesktopMapScene />
      <div className="mobile-app">
      {role === 'traveler' && <TravelerApp />}
      {role === 'operator' && <OperatorApp />}
      {role === 'admin' && <AdminApp />}
      {toast && <div className="toast"><CheckCircle2 size={17} /> {toast}</div>}
      {notificationsOpen && <NotificationPopover role={role} onClose={() => setNotificationsOpen(false)} onMarkRead={markNotificationsRead} notificationsRead={notificationsRead} />}
      {modal === 'filters' && <FilterSheet onClose={() => setModal(null)} />}
      {modal === 'sos' && <ConfirmModal danger title="Send SOS alert?" text={locationConsent ? 'Your live location will be shared with the operator and RideSathi support.' : 'Location sharing is off. We will send the alert without your location.'} confirm="Send SOS" onConfirm={raiseSos} onClose={() => setModal(null)} />}
      {modal === 'cancel' && <ConfirmModal title="Cancel this booking?" text="Cancellation policy applies. Your refund status will be shown after confirmation." confirm="Cancel booking" onConfirm={() => { updateBooking(selectedBooking.id, { status: 'CANCELLED' }); setModal(null); navigate('bookings'); notify('Booking cancelled'); }} onClose={() => setModal(null)} />}
      {modal === 'logout' && <ConfirmModal title="Switch account?" text="You will return to the role-based login screen." confirm="Log out" onConfirm={signOut} onClose={() => setModal(null)} />}
      {modal === 'start' && <ConfirmModal title="Start this rental?" text="Token verified. Confirm handover only when the vehicle and documents are checked." confirm="Start rental" onConfirm={startRental} onClose={() => setModal(null)} />}
      {modal === 'end' && <ConfirmModal title="End active rental?" text="The vehicle will move to the return check and location sharing will stop." confirm="Continue to return" onConfirm={() => { setModal(null); navigate('return'); }} onClose={() => setModal(null)} />}
      {modal === 'return' && <ConfirmModal title="Close this rental?" text="Confirm the vehicle is returned and the return notes are complete." confirm="Close rental" onConfirm={closeRental} onClose={() => setModal(null)} />}
      {modal === 'adminActions' && <AdminBookingActionSheet booking={selectedBooking} onClose={() => setModal(null)} onAction={(message) => { setModal(null); notify(message); }} />}
      {cameraOpen && <CameraScannerSheet stream={cameraStream} error={cameraError} onClose={closeCamera} onDetected={(token) => { setHandoverToken(token); setHandoverTokenState('idle'); closeCamera(); notify('QR token captured'); }} onUseDemo={() => { setHandoverToken(selectedBooking.token); setHandoverTokenState('idle'); closeCamera(); notify('Demo scanner filled the token'); }} />}
      <LoaderOverlay visible={isLoading} label={loadingLabel} />
      </div>
    </div>
  );

  function TravelerApp() {
    const tabs = [
      { key: 'explore' as Screen, label: 'Explore', icon: Home },
      { key: 'bookings' as Screen, label: 'Bookings', icon: ReceiptText },
      { key: 'active' as Screen, label: 'Active', icon: Navigation },
      { key: 'profile' as Screen, label: 'Profile', icon: CircleUserRound },
    ];
    const isHome = ['explore', 'bookings', 'active', 'profile'].includes(screen);
    return <>
      {screen === 'explore' && <TravelerExplore />}
      {screen === 'map' && <TravelerMap />}
      {screen === 'bookings' && <TravelerBookings />}
      {screen === 'active' && <TravelerActive />}
      {screen === 'profile' && <TravelerProfile />}
      {screen === 'vehicle' && <VehicleDetail />}
      {screen === 'bookingFlow' && <BookingFlow />}
      {screen === 'kyc' && <KycScreen />}
      {screen === 'payment' && <PaymentScreen />}
      {screen === 'confirmation' && <ConfirmationScreen />}
      {screen === 'bookingDetail' && <BookingDetail />}
      {screen === 'feedback' && <FeedbackScreen onBack={() => navigate('bookings')} onSubmit={() => { setFeedbackSubmitted(true); notify('Thank you for your feedback'); navigate('bookings'); }} />}
      {isHome && <BottomTabs tabs={tabs} active={screen} onChange={navigate} />}
    </>;
  }

  function TravelerExplore() {
    const visibleVehicles = vehicles.filter((vehicle) => (filterType === 'All' ? true : vehicle.type === filterType) && vehicle.verified && vehicle.status !== 'PENDING_INSPECTION');
    return <div className="screen scroll-screen">
      <div className="topbar explore-topbar"><div><div className="eyebrow"><MapPin size={13} fill={colors.orange} /> PILOT DESTINATION</div><h1>Mount Abu <ChevronDown size={18} /></h1></div><button className="icon-btn notification" onClick={openNotifications}><Bell size={19} />{!notificationsRead && <span />}</button></div>
      <div className="welcome-line"><span>Good morning, Aarav</span><Sparkles size={14} color={colors.orange} /></div>
      <button className="search-control" onClick={() => setModal('filters')}><Search size={19} /><span>Where will you ride today?</span><span className="filter-circle"><SlidersHorizontal size={16} /></span></button>
      <div className="mini-map"><div className="map-copy"><span className="map-kicker">EXPLORE THE HILLS</span><strong>Your next view is<br />around the corner.</strong><button onClick={() => setModal('filters')}>See nearby rides <ArrowRight size={14} /></button></div><div className="map-lines"><span /><span /><span /><i className="map-pin pin-a"><MapPin size={21} fill={colors.orange} /></i><i className="map-pin pin-b"><MapPin size={18} fill={colors.green} /></i><small>NAKKI LAKE</small></div></div>
      <div className="section-head"><div><h2>Available near you</h2><p>{visibleVehicles.length} verified rides in Mount Abu</p></div><button className="text-btn" onClick={() => setModal('filters')}><Filter size={15} /> Filters</button></div>
      <div className="filter-row"><FilterChip label="All rides" active={filterType === 'All'} onClick={() => setFilterType('All')} /><FilterChip label="Scooters" active={filterType === 'Scooter'} onClick={() => setFilterType('Scooter')} /><FilterChip label="Bikes" active={filterType === 'Bike'} onClick={() => setFilterType('Bike')} /><FilterChip label="Cars" active={filterType === 'Car'} onClick={() => setFilterType('Car')} /></div>
      <div className="vehicle-list">{visibleVehicles.slice(0, 5).map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onClick={() => { setSelectedVehicle(vehicle); navigate('vehicle'); }} />)}</div>
      <button className="view-map-btn" onClick={() => navigate('map')}><MapPin size={17} /> View all on map</button>
    </div>;
  }

  function VehicleCard({ vehicle, onClick }: { vehicle: Vehicle; onClick: () => void }) {
    return <button className="vehicle-card" onClick={onClick}><img src={vehiclePhoto(vehicle)} alt="" /><div className="vehicle-card-body"><div className="card-title-row"><div><h3>{vehicle.name}</h3><p>{vehicle.type} · {vehicle.seats} seats · {vehicle.fuel}</p></div><span className="verified-pill"><ShieldCheck size={13} /> Verified</span></div><div className="card-meta"><span className="rating"><Star size={14} fill="currentColor" /> {vehicle.rating} <em>({vehicle.reviews})</em></span><span className="dot-separator">·</span><span>{vehicle.operator}</span></div><div className="price-row"><div><strong>{formatCurrency(vehicle.price)}</strong><small>/ day</small></div><StatusBadge status={vehicle.status === 'AVAILABLE' ? 'Available' : 'Reserved'} /><ChevronRight size={18} className="card-arrow" /></div></div></button>;
  }

  function VehicleDetail() {
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Vehicle details" onBack={() => navigate('explore')} />
      <img className="detail-hero" src={vehiclePhoto(selectedVehicle)} alt="" />
      <div className="detail-content"><div className="detail-title-row"><div><div className="eyebrow green-text"><ShieldCheck size={14} /> VERIFIED RIDE</div><h1>{selectedVehicle.name}</h1><p>{selectedVehicle.type} · {selectedVehicle.seats} seats · {selectedVehicle.fuel}</p></div><div className="rating-box"><Star size={16} fill="currentColor" /> <strong>{selectedVehicle.rating}</strong><small>{selectedVehicle.reviews} rides</small></div></div><div className="operator-line"><div className="avatar avatar-green">AH</div><div><strong>{selectedVehicle.operator}</strong><span><ShieldCheck size={13} /> Verified operator · 4.8 rating</span></div><ChevronRight size={17} /></div><div className="info-grid"><InfoTile icon={IndianRupee} label="Rate" value={`${formatCurrency(selectedVehicle.price)} / day`} /><InfoTile icon={Fuel} label="Fuel" value={selectedVehicle.fuel} /><InfoTile icon={Gauge} label="Condition" value="Excellent" /><InfoTile icon={CalendarDays} label="Availability" value="Available now" /></div><section className="content-section"><h3>What you should know</h3><div className="note-row"><CheckCircle2 size={17} color={colors.green} /><span>{selectedVehicle.condition}</span></div><div className="note-row"><CheckCircle2 size={17} color={colors.green} /><span>RC, insurance & rental permit verified</span></div><div className="note-row"><CheckCircle2 size={17} color={colors.green} /><span>Free cancellation up to 24 hours before pickup</span></div></section><section className="content-section"><h3>Pickup & documents</h3><div className="pickup-card"><MapPin size={18} color={colors.orange} /><div><strong>Abu Hill Rentals office</strong><span>Near Nakki Lake · 2.1 km away</span></div><ChevronRight size={17} /></div><p className="helper-copy">Bring your original driving licence. A masked ID and a live selfie are required at KYC.</p></section></div><div className="sticky-cta"><div><small>From</small><strong>{formatCurrency(selectedVehicle.price)} <em>/ day</em></strong></div><button className="primary-btn" onClick={() => navigate('bookingFlow')}>Book now <ArrowRight size={17} /></button></div>
    </div>;
  }

  function BookingFlow() {
    const [selectedDay, setSelectedDay] = useState('21');
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Plan your ride" step="1 of 3" onBack={() => navigate('vehicle')} /><div className="stepper"><span className="active" /><span /><span /></div><div className="flow-content"><div className="flow-heading"><div className="mini-vehicle"><img src={vehiclePhoto(selectedVehicle)} alt="" /></div><div><h2>{selectedVehicle.name}</h2><p>{selectedVehicle.operator} · {formatCurrency(selectedVehicle.price)}/day</p></div></div><section className="form-section"><div className="section-title"><h3>When do you need it?</h3><button className="text-btn" onClick={() => notify('Choose a pickup day from the date strip')}><CalendarDays size={15} /> Calendar</button></div><div className="date-strip">{['20', '21', '22', '23'].map((day, index) => <button key={day} className={selectedDay === day ? 'date-card active' : 'date-card'} onClick={() => setSelectedDay(day)}><small>{['SUN', 'MON', 'TUE', 'WED'][index]}</small><strong>{day}</strong><i /></button>)}</div><div className="time-row"><label><span>Pickup</span><div className="time-select-wrap"><select className="time-select" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)}><option>8:00 AM</option><option>9:00 AM</option><option>10:30 AM</option><option>12:00 PM</option></select><ChevronDown size={15} /></div></label><ArrowRight size={16} color="#a1aaa5" /><label><span>Return</span><div className="time-select-wrap"><select className="time-select" value={returnTime} onChange={(event) => setReturnTime(event.target.value)}><option>5:00 PM</option><option>7:30 PM</option><option>9:00 AM</option><option>10:00 PM</option></select><ChevronDown size={15} /></div></label></div></section><section className="summary-card"><div className="summary-line"><span>1 day × {formatCurrency(selectedVehicle.price)}</span><strong>{formatCurrency(selectedVehicle.price)}</strong></div><div className="summary-line muted-line"><span>RideSathi service fee</span><strong>{formatCurrency(Math.round(selectedVehicle.price * .1))}</strong></div><div className="summary-total"><span>You'll pay</span><strong>{formatCurrency(Math.round(selectedVehicle.price * 1.1))}</strong></div><p><ShieldCheck size={15} /> Secure mock payment · commission included</p></section><div className="policy-line"><LockKeyhole size={16} /><span>Free cancellation up to 24 hours before pickup.</span><ChevronRight size={15} /></div></div><div className="sticky-cta"><div><small>Total</small><strong>{formatCurrency(Math.round(selectedVehicle.price * 1.1))}</strong></div><button className="primary-btn" onClick={confirmBookingFlow}>Continue to KYC <ArrowRight size={17} /></button></div></div>;
  }

  function KycScreen() {
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Verify your identity" step="2 of 3" onBack={() => navigate('bookingFlow')} /><div className="stepper"><span className="active" /><span className="active" /><span /></div><div className="kyc-intro"><div className="secure-icon"><ShieldCheck size={23} /></div><div><h2>Quick KYC, safer rides</h2><p>Your documents are encrypted. We only keep a masked ID number.</p></div></div><div className="form-content"><Field label="Full name" value="Aarav Mehta" icon={UserCheck} /><Field label="Phone number" value="+91 98765 43210" icon={Smartphone} /><Field label="Driving licence number" value="RJ14 2024 008621" icon={CreditCard} /><SelectField label="ID type" value="Aadhaar" icon={FileText} /><Field label="ID number (masked)" value="•••• •••• 6218" icon={LockKeyhole} helper="Only the last 4 digits are stored." /><UploadField label="Driving licence" /><UploadField label="ID document" /><label className="consent-check"><input type="checkbox" defaultChecked /><span className="check-box"><Check size={13} /></span><span>I consent to RideSathi verifying these documents for this booking.</span></label></div><div className="sticky-cta"><div><small>Privacy-first</small><strong>Masked ID only</strong></div><button className="primary-btn" onClick={submitKyc}>{kycSubmitted ? 'Submitted' : 'Submit KYC'} <ArrowRight size={17} /></button></div></div>;
  }

  function PaymentScreen() {
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Complete payment" step="3 of 3" onBack={() => navigate('kyc')} /><div className="stepper"><span className="active" /><span className="active" /><span className="active" /></div><div className="payment-content"><div className="payment-lock"><div className="lock-orbit"><LockKeyhole size={28} /></div><span>MOCK PAYMENT</span><h2>Ready when you are.</h2><p>Secure your Mount Abu ride with a quick demo payment.</p></div><div className="pay-card"><div className="payment-vehicle"><div className="mini-vehicle"><img src={vehiclePhoto(selectedVehicle)} alt="" /></div><div><strong>{selectedVehicle.name}</strong><span>{selectedBooking.start} → {selectedBooking.end}</span></div></div><div className="amount-line"><span>Booking amount</span><strong>{formatCurrency(selectedBooking.amount)}</strong></div><div className="amount-line fee"><span>Platform commission <small>10% internally recorded</small></span><strong>{formatCurrency(Math.round(selectedBooking.amount * .1))}</strong></div><div className="amount-total"><span>Total payable</span><strong>{formatCurrency(Math.round(selectedBooking.amount * 1.1))}</strong></div></div>{paymentState === 'failed' && <div className="error-banner"><CircleAlert size={18} /><div><strong>Payment failed</strong><span>Nothing was charged. Try the mock payment again.</span></div></div>}<div className="mock-note"><CreditCard size={17} /><span>Mock payment only · no real money is charged</span></div><button className="failure-link" onClick={() => payNow(true)}>Simulate payment failure</button></div><div className="sticky-cta"><div><small>Total</small><strong>{formatCurrency(Math.round(selectedBooking.amount * 1.1))}</strong></div><button className="primary-btn" onClick={() => payNow(false)}><LockKeyhole size={16} /> Pay securely</button></div></div>;
  }

  function ConfirmationScreen() {
    return <div className="screen scroll-screen confirmation-screen"><DetailHeader title="Booking confirmed" onBack={() => navigate('bookings')} /><div className="success-hero"><div className="success-orbit"><Check size={32} /></div><span>YOU'RE ALL SET</span><h1>Ride booked.</h1><p>Show this token at the rental office for a fast pickup.</p></div><div className="token-card"><div className="token-top"><span>BOOKING TOKEN</span><strong>{selectedBooking.token}</strong></div><FakeQR token={selectedBooking.token} /><div className="qr-caption"><QrCode size={16} /> Scan at handover</div></div><div className="confirmation-details"><div className="confirm-ride"><img src={vehiclePhoto(selectedVehicle)} alt="" /><div><strong>{selectedBooking.vehicleName}</strong><span>{selectedBooking.operator}</span></div><StatusBadge status="Confirmed" /></div><div className="confirm-grid"><div><small>Pickup</small><strong>{selectedBooking.start}</strong></div><div><small>Return</small><strong>{selectedBooking.end}</strong></div><div><small>Paid</small><strong>{formatCurrency(Math.round(selectedBooking.amount * 1.1))}</strong></div><div><small>Booking ID</small><strong>{selectedBooking.id}</strong></div></div></div><div className="instruction-card"><Info size={17} /><span>Bring your original driving licence and arrive 10 minutes before pickup.</span></div><button className="primary-btn full-btn" onClick={() => navigate('bookings')}>View my bookings <ArrowRight size={17} /></button><button className="secondary-btn full-btn" onClick={() => navigate('explore')}>Keep exploring</button></div>;
  }

  function TravelerMap() {
    const mapVehicles = vehicles.filter((vehicle) => vehicle.verified && vehicle.status !== 'PENDING_INSPECTION').slice(0, 4);
    const [zoom, setZoom] = useState(1);
    return <div className="screen map-screen"><DetailHeader title="Mount Abu rides" onBack={() => navigate('explore')} /><div className="traveler-map-wrap"><div className="traveler-map-zoom" style={{ transform: `scale(${zoom})` }}><MapCanvas markerCount={mapVehicles.length} userLocation={userLocation} /></div><div className="map-screen-topline"><span><span className="pulse-dot" /> Live availability</span><button onClick={() => { setZoom(1); requestLocationAccess(); }}><Navigation size={15} /> Recenter</button></div><div className="map-screen-controls"><button onClick={() => setZoom((value) => Math.min(1.5, Number((value + .12).toFixed(2))))}><Plus size={17} /></button><button onClick={() => setZoom((value) => Math.max(1, Number((value - .12).toFixed(2))))}><span className="minus-icon">−</span></button></div></div><div className="map-ride-sheet"><div className="sheet-grabber" /><div className="section-head"><div><h2>Rides around you</h2><p>{mapVehicles.length} verified vehicles nearby</p></div><button className="text-btn" onClick={() => setModal('filters')}><SlidersHorizontal size={14} /> Filter</button></div>{mapVehicles.slice(0, 3).map((vehicle) => <button key={vehicle.id} className="map-ride-row" onClick={() => { setSelectedVehicle(vehicle); navigate('vehicle'); }}><img src={vehiclePhoto(vehicle)} alt="" /><div><strong>{vehicle.name}</strong><span>{vehicle.operator} · {formatCurrency(vehicle.price)}/day</span></div><span className="rating"><Star size={13} fill="currentColor" /> {vehicle.rating}</span><ChevronRight size={17} /></button>)}</div></div>;
  }

  function TravelerBookings() {
    const filteredBookings = bookings.filter((booking) => travelerBookingTab === 'all' || (travelerBookingTab === 'upcoming' ? ['CONFIRMED', 'PENDING_KYC', 'PENDING_PAYMENT'].includes(booking.status) : ['COMPLETED', 'RETURNED', 'CANCELLED'].includes(booking.status)));
    return <div className="screen scroll-screen"><AppHeader title="My bookings" subtitle="Your rides, all in one place" action={<button className="icon-btn" onClick={openNotifications}><Bell size={19} /></button>} /><div className="segmented"><button className={travelerBookingTab === 'all' ? 'active' : ''} onClick={() => setTravelerBookingTab('all')}>All <span>{bookings.length}</span></button><button className={travelerBookingTab === 'upcoming' ? 'active' : ''} onClick={() => setTravelerBookingTab('upcoming')}>Upcoming <span>{bookings.filter((booking) => ['CONFIRMED', 'PENDING_KYC', 'PENDING_PAYMENT'].includes(booking.status)).length}</span></button><button className={travelerBookingTab === 'past' ? 'active' : ''} onClick={() => setTravelerBookingTab('past')}>Past <span>{bookings.filter((booking) => ['COMPLETED', 'RETURNED', 'CANCELLED'].includes(booking.status)).length}</span></button></div>{filteredBookings.length > 0 ? <div className="booking-stack">{filteredBookings.map((booking) => <BookingCard key={booking.id} booking={booking} onClick={() => { setSelectedBooking(booking); const vehicle = vehicles.find((v) => v.id === booking.vehicleId); if (vehicle) setSelectedVehicle(vehicle); navigate('bookingDetail'); }} />)}</div> : <EmptyHint icon={CalendarDays} title={travelerBookingTab === 'upcoming' ? 'No upcoming rides' : 'No past rides yet'} text="Verified scooters, bikes and cars are waiting in Mount Abu." action="Explore vehicles" onClick={() => navigate('explore')} />}</div>;
  }

  function BookingCard({ booking, onClick }: { booking: Booking; onClick: () => void }) {
    const vehicle = vehicles.find((v) => v.id === booking.vehicleId) ?? vehicles[0];
    return <button className="booking-card" onClick={onClick}><div className="booking-card-top"><span className="booking-id">{booking.id}</span><StatusBadge status={booking.status === 'CONFIRMED' ? 'Confirmed' : booking.status === 'ACTIVE' ? 'Active' : booking.status === 'COMPLETED' ? 'Completed' : booking.status === 'CANCELLED' ? 'Cancelled' : booking.status} /></div><div className="booking-vehicle"><img src={vehiclePhoto(vehicle)} alt="" /><div><h3>{booking.vehicleName}</h3><p>{booking.operator}</p></div><ChevronRight size={18} /></div><div className="booking-times"><div><CalendarDays size={14} /><span>{booking.start}</span></div><ArrowRight size={14} color="#adb5b0" /><div><Clock3 size={14} /><span>{booking.end}</span></div></div>{booking.status === 'COMPLETED' && <div className="review-line"><span>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} fill={i <= (booking.rating ?? 0) ? colors.orange : 'none'} color={colors.orange} />)}</span><small>Thank you for riding with us</small></div>}</button>;
  }

  function BookingDetail() {
    const isCompleted = selectedBooking.status === 'COMPLETED';
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Booking details" onBack={() => navigate('bookings')} /><div className="detail-booking-hero"><div className="booking-card-top"><span className="booking-id">{selectedBooking.id}</span><StatusBadge status={selectedBooking.status === 'ACTIVE' ? 'Active' : selectedBooking.status === 'CONFIRMED' ? 'Confirmed' : selectedBooking.status} /></div><img src={vehiclePhoto(selectedVehicle)} alt="" /><h1>{selectedBooking.vehicleName}</h1><p>{selectedBooking.operator} · Mount Abu</p></div><div className="detail-content"><section className="timeline-section"><h3>Booking timeline</h3><Timeline status={selectedBooking.status} /></section><section className="booking-info-card"><InfoLine icon={CalendarDays} label="Rental time" value={`${selectedBooking.start} – ${selectedBooking.end}`} /><InfoLine icon={WalletCards} label="Payment" value={selectedBooking.payment === 'SUCCESS' ? 'Paid · mock payment' : selectedBooking.payment} green /><InfoLine icon={FileCheck2} label="KYC" value={selectedBooking.kyc === 'VERIFIED' ? 'Verified · masked ID' : selectedBooking.kyc} green /></section>{selectedBooking.token !== '—' && <div className="token-inline"><div><span>Pickup token</span><strong>{selectedBooking.token}</strong><small>Show token or QR at handover</small></div><FakeQR token={selectedBooking.token} small /></div>}{isCompleted && !feedbackSubmitted && <button className="feedback-prompt" onClick={() => navigate('feedback')}><div className="prompt-icon"><Star size={18} /></div><div><strong>How was your ride?</strong><span>Leave a review for {selectedBooking.vehicleName}</span></div><ChevronRight size={18} /></button>}</div>{selectedBooking.status === 'CONFIRMED' && <div className="sticky-cta"><button className="secondary-btn" onClick={() => setModal('cancel')}>Cancel booking</button><button className="primary-btn" onClick={() => notify('Reminder saved for pickup')}>Add reminder <Bell size={16} /></button></div>}{selectedBooking.status === 'ACTIVE' && <div className="sticky-cta"><button className="primary-btn full-btn" onClick={() => navigate('active')}>Open active rental <Navigation size={16} /></button></div>}</div>;
  }

  function TravelerActive() {
    return <div className="screen scroll-screen active-screen"><AppHeader title="Active rental" subtitle={activeRental ? 'Live support is on standby' : 'No active rental'} action={<button className="icon-btn" onClick={() => notify('RideSathi support is on standby')}><Headphones size={19} /></button>} />{activeRental ? <><div className="active-status"><span className="pulse-dot" /> RENTAL ACTIVE <span className="active-time">Started 10:30 AM</span></div><div className="active-vehicle-card"><img src={vehiclePhoto(liveVehicle)} alt="" /><div className="active-vehicle-info"><div><h2>{liveVehicle.name}</h2><p><ShieldCheck size={13} /> Verified by RideSathi</p></div><span className="plate">RJ 38 AB 2048</span></div></div><MapCard consent={locationConsent} onConsent={requestLocationAccess} onLocate={() => requestLocationAccess()} userLocation={userLocation} /><div className="location-banner"><div className="location-icon"><Navigation size={17} /></div><div><strong>{locationConsent ? 'Location sharing is on' : 'Share your location for safer rides'}</strong><span>{locationConsent ? 'Operator can see your location during this rental.' : 'Only active rental support can access it.'}</span></div>{!locationConsent && <button onClick={requestLocationAccess}>Allow</button>}</div><button className="simulate-location" onClick={() => { const simulated = { lat: 24.5929, lng: 72.7161 }; setUserLocation(simulated); setLocationConsent(true); notify('Location simulated around Mount Abu · 24.5929, 72.7161'); }}><RefreshCw size={13} /> Simulate location around Mount Abu</button><div className="active-details-grid"><InfoTile icon={Clock3} label="Started" value="Today, 10:30 AM" /><InfoTile icon={MapPin} label="Pickup" value="Nakki Lake office" /></div><section className="support-card"><div className="support-icon"><Headphones size={19} /></div><div><strong>Need a hand?</strong><span>RideSathi support is available 24/7</span></div><button className="icon-btn light" onClick={() => notify('Support call simulation started')}><Phone size={17} /></button></section><button className="return-instructions" onClick={() => notify('Return instructions opened')}><div><PackageCheck size={18} color={colors.green} /><span><strong>Return instructions</strong><small>See where and how to return your vehicle</small></span></div><ChevronRight size={18} /></button><button className="sos-button" onClick={() => setModal('sos')}><div className="sos-symbol"><ShieldAlert size={22} /></div><div><strong>Emergency SOS</strong><span>{sosRaised ? 'Alert sent · support is responding' : 'Tap only in an emergency'}</span></div><ChevronRight size={19} /></button></> : <EmptyHint icon={Navigation} title="No active rental" text="When your operator verifies the token, your live rental will appear here." action="View my bookings" onClick={() => navigate('bookings')} />}</div>;
  }

  function TravelerProfile() {
    return <div className="screen scroll-screen"><AppHeader title="Profile" subtitle="Your RideSathi account" action={<button className="icon-btn" onClick={() => setModal('logout')}><MoreHorizontal size={20} /></button>} /><div className="profile-card"><div className="profile-avatar">AM</div><div><h2>Aarav Mehta</h2><p>traveler@demo.com</p><span className="profile-verified"><ShieldCheck size={14} /> KYC verified</span></div><button className="icon-btn light" onClick={() => notify('Personal details editor opened')}><Pencil size={16} /></button></div><div className="profile-stats"><div><strong>3</strong><span>Rides</span></div><div><strong>4.9</strong><span>My rating</span></div><div><strong>Since '24</strong><span>Member</span></div></div><section className="profile-section"><h3>Account</h3><ProfileRow icon={UserCheck} title="Personal details" subtitle="Name, phone & emergency contact" onClick={() => notify('Personal details editor opened')} /><ProfileRow icon={ShieldCheck} title="KYC & documents" subtitle="Verified · masked ID •••• 6218" onClick={() => navigate('kyc')} /><ProfileRow icon={Bell} title="Notifications" subtitle="In-app alerts enabled" onClick={openNotifications} /></section><section className="profile-section"><h3>Safety & support</h3><ProfileRow icon={LifeBuoy} title="Safety centre" subtitle="SOS, policies & ride safety" onClick={() => notify('Safety centre opened')} /><ProfileRow icon={MessageCircle} title="Help & support" subtitle="We are here 24/7" onClick={() => notify('Support chat opened')} /></section><button className="logout-btn" onClick={() => setModal('logout')}><LogOut size={17} /> Switch demo account</button><p className="app-version">RideSathi MVP · Mount Abu pilot</p></div>;
  }

  function OperatorApp() {
    const tabs = [
      { key: 'dashboard' as Screen, label: 'Dashboard', icon: Home },
      { key: 'operatorBookings' as Screen, label: 'Bookings', icon: ReceiptText },
      { key: 'vehicles' as Screen, label: 'Vehicles', icon: Bike },
      { key: 'activeRentals' as Screen, label: 'Active', icon: Navigation },
      { key: 'alerts' as Screen, label: 'Alerts', icon: ShieldAlert },
    ];
    const isHome = ['dashboard', 'operatorBookings', 'vehicles', 'activeRentals', 'alerts'].includes(screen);
    return <>{screen === 'dashboard' && <OperatorDashboard />}{screen === 'operatorBookings' && <OperatorBookings />}{screen === 'vehicles' && <OperatorVehicles />}{screen === 'vehicleForm' && <VehicleForm />}{screen === 'operatorBookingDetail' && <OperatorBookingDetail />}{screen === 'handover' && <HandoverScreen />}{screen === 'activeRentals' && <OperatorActiveRentals />}{screen === 'activeRentalDetail' && <OperatorActiveRentalDetail />}{screen === 'return' && <ReturnScreen />}{screen === 'alerts' && <OperatorAlerts />}{screen === 'sosDetail' && <SosDetail />}{screen === 'reviews' && <ReviewsScreen />}{isHome && <BottomTabs tabs={tabs} active={screen} onChange={navigate} />}</>;
  }

  function OperatorDashboard() {
    return <div className="screen scroll-screen"><AppHeader title="Good morning, Raj" subtitle="Abu Hill Rentals · Mount Abu" action={<div className="header-actions"><button className="icon-btn notification" onClick={openNotifications}><Bell size={19} />{!notificationsRead && <span />}</button><button className="icon-btn" onClick={() => setModal('logout')}><MoreHorizontal size={20} /></button></div>} /><div className="operator-status"><span className="pulse-dot" /> Operator account active <ChevronRight size={15} /></div><div className="metric-grid"><MetricTile label="Vehicles" value="7" trend="6 active" icon={Bike} /><MetricTile label="Active rentals" value="1" trend="Live now" icon={Navigation} blue /><MetricTile label="Upcoming" value="4" trend="This week" icon={CalendarDays} orange /><MetricTile label="Avg. rating" value="4.8" trend="76 reviews" icon={Star} /></div><div className="section-head"><div><h2>Quick actions</h2><p>Keep your fleet moving</p></div></div><div className="quick-actions"><QuickAction icon={Plus} label="Add vehicle" onClick={() => navigate('vehicleForm')} /><QuickAction icon={ReceiptText} label="Bookings" onClick={() => navigate('operatorBookings')} /><QuickAction icon={Navigation} label="Live rentals" onClick={() => navigate('activeRentals')} /><QuickAction icon={MessageCircle} label="Reviews" onClick={() => navigate('reviews')} /></div><div className="section-head"><div><h2>Needs your attention</h2><p>Stay on top of today's handovers</p></div><button className="text-btn" onClick={() => navigate('operatorBookings')}>See all <ArrowRight size={14} /></button></div><button className="operator-booking-highlight" onClick={() => { setSelectedBooking(bookings[0]); navigate('operatorBookingDetail'); }}><div className="attention-label"><span className="orange-dot" /> NEXT HANDOVER <span>Today · 9:00 AM</span></div><div className="operator-highlight-main"><div className="operator-booking-avatar">PS</div><div><h3>Priya Shah</h3><p>Suzuki Access 125 · {bookings[0].id}</p></div><ChevronRight size={19} /></div><div className="attention-footer"><span><ShieldCheck size={14} /> KYC verified</span><span><WalletCards size={14} /> Paid</span><strong>Verify token</strong></div></button><button className="alert-banner" onClick={() => navigate('alerts')}><div className="alert-icon"><ShieldAlert size={18} /></div><div><strong>1 SOS alert needs attention</strong><span>Aarav Mehta · Honda Activa 6G · just now</span></div><ChevronRight size={17} /></button></div>;
  }

  function OperatorBookings() {
    const filtered = operatorTab === 'active' ? bookings.filter((b) => b.status === 'ACTIVE') : operatorTab === 'upcoming' ? bookings.filter((b) => b.status === 'CONFIRMED') : bookings;
    return <div className="screen scroll-screen"><AppHeader title="Bookings" subtitle="Manage every handover" action={<button className="icon-btn" onClick={() => notify('Booking search is ready')}><Search size={19} /></button>} /><div className="segmented"><button className={operatorTab === 'all' ? 'active' : ''} onClick={() => setOperatorTab('all')}>All <span>{bookings.length}</span></button><button className={operatorTab === 'upcoming' ? 'active' : ''} onClick={() => setOperatorTab('upcoming')}>Upcoming</button><button className={operatorTab === 'active' ? 'active' : ''} onClick={() => setOperatorTab('active')}>Active</button></div><div className="operator-list">{filtered.map((booking) => <OperatorBookingRow key={booking.id} booking={booking} onClick={() => { setSelectedBooking(booking); navigate('operatorBookingDetail'); }} />)}</div></div>;
  }

  function OperatorBookingRow({ booking, onClick }: { booking: Booking; onClick: () => void }) {
    const vehicle = vehicles.find((v) => v.id === booking.vehicleId) ?? vehicles[0];
    return <button className="operator-booking-row" onClick={onClick}><div className="row-avatar">{booking.id.slice(-2)}</div><div className="operator-row-copy"><div className="row-title"><strong>{booking.id}</strong><StatusBadge status={booking.status === 'ACTIVE' ? 'Active' : booking.status === 'CONFIRMED' ? 'Confirmed' : booking.status} /></div><h3>{booking.vehicleName}</h3><p>{booking.start} → {booking.end}</p><div className="row-tags"><span><UserCheck size={12} /> {booking.kyc === 'VERIFIED' ? 'KYC verified' : 'KYC pending'}</span><span><WalletCards size={12} /> {booking.payment === 'SUCCESS' ? 'Paid' : 'Payment pending'}</span></div></div><ChevronRight size={18} /></button>;
  }

  function OperatorBookingDetail() {
    const isActiveBooking = selectedBooking.status === 'ACTIVE';
    const isClosedBooking = ['COMPLETED', 'RETURNED'].includes(selectedBooking.status);
    const closedVehicleStatus = lastClosedRental?.bookingId === selectedBooking.id ? lastClosedRental.vehicleStatus : vehicles.find((vehicle) => vehicle.id === selectedBooking.vehicleId)?.status;
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Booking review" onBack={() => navigate('operatorBookings')} /><div className="operator-detail-header"><div className="big-avatar">PS</div><div><span className="booking-id">{selectedBooking.id}</span><h1>Priya Shah</h1><p>+91 98••• 43210</p></div><StatusBadge status={isActiveBooking ? 'Active' : isClosedBooking ? 'Completed' : 'Confirmed'} /></div><div className="operator-detail-body"><section className="booking-info-card"><InfoLine icon={Bike} label="Vehicle" value={selectedBooking.vehicleName} /><InfoLine icon={CalendarDays} label="Rental time" value={`${selectedBooking.start} – ${selectedBooking.end}`} /><InfoLine icon={WalletCards} label="Payment" value="Paid · mock payment" green /><InfoLine icon={FileCheck2} label="KYC status" value="Verified · masked ID •••• 6218" green /></section><div className="token-operator-card"><div><span>BOOKING TOKEN</span><strong>{selectedBooking.token}</strong><small>{isClosedBooking ? 'Return token verified' : 'Ask traveler to show this token or QR'}</small></div><FakeQR token={selectedBooking.token} small /></div><div className="operator-note"><ShieldCheck size={17} /><span>{isClosedBooking ? `Rental closed · vehicle ${closedVehicleStatus === 'PENDING_INSPECTION' ? 'sent for inspection' : 'marked available'}.` : 'Both vehicle documents are verified. Check original driving licence at pickup.'}</span></div>{isClosedBooking && <div className="closure-feedback"><Star size={17} fill={colors.orange} color={colors.orange} /><div><strong>Feedback requested</strong><span>The traveler can now review this ride.</span></div><CheckCircle2 size={16} /></div>}</div>{!isActiveBooking && !isClosedBooking ? <div className="sticky-cta"><button className="secondary-btn" onClick={() => notify('Booking rejected · traveler notified')}>Reject</button><button className="primary-btn" onClick={() => navigate('handover')}>Start handover <ArrowRight size={17} /></button></div> : isActiveBooking ? <div className="sticky-cta"><button className="primary-btn full-btn" onClick={() => setModal('end')}>End rental <PackageCheck size={16} /></button></div> : null}</div>;
  }

  function HandoverScreen() {
    const validate = () => {
      const normalizedToken = handoverToken.replace(/\s/g, '').toUpperCase();
      if (normalizedToken === 'EXPIRED') {
        setHandoverTokenState('expired');
        return;
      }
      if (normalizedToken === 'USED' || normalizedToken === 'ALREADY-USED') {
        setHandoverTokenState('already-used');
        return;
      }
      if (normalizedToken !== selectedBooking.token.replace(/\s/g, '').toUpperCase()) {
        setHandoverTokenState('invalid');
        return;
      }
      setHandoverTokenState('valid');
      setModal('start');
    };
    const tokenError = handoverTokenState !== 'idle' && handoverTokenState !== 'valid';
    const tokenErrorMessage = handoverTokenState === 'expired' ? 'Token expired. Ask the traveler to refresh the booking.' : handoverTokenState === 'already-used' ? 'Token already used. Do not start a duplicate handover.' : 'Token invalid or already used. Try again.';
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Token handover" onBack={() => navigate('operatorBookingDetail')} /><div className="handover-hero"><div className="scan-orbit"><QrCode size={31} /></div><h1>Verify before pickup</h1><p>Ask the traveler to show their booking QR or token.</p></div><button className="scanner-box" onClick={requestCameraAccess}><div className="scan-corners"><i /><i /><i /><i /></div><Camera size={23} /><strong>Scan booking QR</strong><span>Camera access is used only for this handover</span></button><div className="or-divider"><span>or enter manually</span></div><div className="manual-token"><label>Booking token</label><div className={tokenError ? 'token-input error' : handoverTokenState === 'valid' ? 'token-input valid' : 'token-input'}><KeyRound size={18} /><input value={handoverToken} onChange={(e) => { setHandoverToken(e.target.value.toUpperCase()); setHandoverTokenState('idle'); }} placeholder="e.g. RS-7K4M2" /><button onClick={() => { setHandoverToken(selectedBooking.token); setHandoverTokenState('idle'); }}><PasteIcon /></button></div>{tokenError && <span className="field-error"><CircleAlert size={14} /> {tokenErrorMessage}</span>}</div><div className="handover-checks"><div><CheckCircle2 size={17} /> Booking is confirmed</div><div><CheckCircle2 size={17} /> Payment received</div><div><CheckCircle2 size={17} /> KYC is verified</div></div><div className="token-state-hint"><span>Demo checks:</span> invalid · EXPIRED · USED · valid token</div><button className="primary-btn full-btn" onClick={validate}>Validate token <ArrowRight size={17} /></button></div>;
  }

  function OperatorVehicles() {
    return <div className="screen scroll-screen"><AppHeader title="My vehicles" subtitle="7 vehicles · 6 active" action={<button className="icon-btn" onClick={() => navigate('vehicleForm')}><Plus size={20} /></button>} /><div className="vehicle-list operator-vehicle-list">{vehicles.map((vehicle) => <div key={vehicle.id} className="operator-vehicle-card"><img src={vehiclePhoto(vehicle)} alt="" /><div className="operator-vehicle-copy"><div className="card-title-row"><div><h3>{vehicle.name}</h3><p>{vehicle.type} · {vehicle.id === 'v8' ? 'Submitted today' : 'RJ 38 AB 2048'}</p></div><StatusBadge status={vehicle.status === 'AVAILABLE' ? 'Available' : vehicle.status === 'RENTED' ? 'Rented' : vehicle.status === 'PENDING_INSPECTION' ? 'Pending inspection' : 'Reserved'} /></div><div className="operator-vehicle-bottom"><strong>{formatCurrency(vehicle.price)} <small>/ day</small></strong><button className="edit-link" onClick={() => { setFormVehicle({ type: vehicle.type, make: vehicle.name.split(' ')[0], model: vehicle.name.split(' ').slice(1).join(' '), reg: 'RJ 38 AB 2048', price: String(vehicle.price), fuel: vehicle.fuel, seats: String(vehicle.seats), notes: vehicle.condition }); navigate('vehicleForm'); }}><Pencil size={14} /> Edit</button><label className="toggle"><input type="checkbox" defaultChecked={vehicle.status !== 'BLOCKED'} /><span /></label></div></div></div>)}</div><button className="outline-dashed" onClick={() => navigate('vehicleForm')}><Plus size={18} /> Add another vehicle</button></div>;
  }

  function VehicleForm() {
    return <div className="screen scroll-screen detail-screen"><DetailHeader title={formVehicle.make ? 'Edit vehicle' : 'Add a vehicle'} onBack={() => navigate('vehicles')} /><div className="form-content vehicle-form"><div className="upload-photo"><div><ImagePlus size={23} /><span>{vehiclePhotoName || 'Add vehicle photos'}</span><small>{vehiclePhotoName ? 'Photo ready to attach · tap Upload to replace' : 'Clear photos help travelers choose'}</small></div><label className="photo-upload-btn"><input className="visually-hidden-input" type="file" accept="image/*" onChange={(event) => setVehiclePhotoName(event.target.files?.[0]?.name ?? '')} /><Upload size={16} /> Upload</label></div><div className="form-section"><h3>Vehicle details</h3><label className="field-label">Vehicle type<div className="select-pill"><Bike size={17} /><select value={formVehicle.type} onChange={(e) => setFormVehicle({ ...formVehicle, type: e.target.value })}><option>Scooter</option><option>Bike</option><option>Car</option><option>Jeep</option></select><ChevronDown size={15} /></div></label><div className="field-row"><Field label="Make" value={formVehicle.make} onChange={(v) => setFormVehicle({ ...formVehicle, make: v })} placeholder="e.g. Honda" /><Field label="Model" value={formVehicle.model} onChange={(v) => setFormVehicle({ ...formVehicle, model: v })} placeholder="e.g. Activa 6G" /></div><Field label="Registration number" value={formVehicle.reg} onChange={(v) => setFormVehicle({ ...formVehicle, reg: v })} placeholder="RJ 38 AB 0000" /><div className="field-row"><Field label="Price per day" value={formVehicle.price} onChange={(v) => setFormVehicle({ ...formVehicle, price: v })} placeholder="₹ 499" /><Field label="Seats" value={formVehicle.seats} onChange={(v) => setFormVehicle({ ...formVehicle, seats: v })} /></div><label className="field-label">Fuel type<div className="select-pill"><Fuel size={17} /><select value={formVehicle.fuel} onChange={(e) => setFormVehicle({ ...formVehicle, fuel: e.target.value })}><option>Petrol</option><option>Diesel</option><option>Electric</option></select><ChevronDown size={15} /></div></label><label className="field-label">Condition notes<textarea value={formVehicle.notes} onChange={(e) => setFormVehicle({ ...formVehicle, notes: e.target.value })} placeholder="Tell travelers about the condition, included items…" /></label></div><div className="form-section"><h3>Documents</h3><CheckRow label="RC available" /><CheckRow label="Insurance available" /><CheckRow label="Rental permit / eligibility available" /></div><div className="verification-note"><ShieldCheck size={18} /><div><strong>Verification before listing</strong><span>Our admin team checks documents within 24 hours.</span></div></div></div><div className="sticky-cta"><button className="primary-btn full-btn" onClick={() => { notify('Vehicle submitted for admin verification'); navigate('vehicles'); }}>Submit for verification <ArrowRight size={17} /></button></div></div>;
  }

  function OperatorActiveRentals() {
    const activeBooking = bookings.find((booking) => booking.status === 'ACTIVE');
    const activeVehicle = activeBooking ? vehicles.find((vehicle) => vehicle.id === activeBooking.vehicleId) ?? vehicles[0] : liveVehicle;
    const openActiveRental = () => {
      if (!activeBooking) return;
      setSelectedBooking(activeBooking);
      setSelectedVehicle(activeVehicle);
      setOperatorActiveVehicleId(activeBooking.vehicleId);
      navigate('activeRentalDetail');
    };
    return <div className="screen scroll-screen"><AppHeader title="Active rentals" subtitle="1 rental live right now" action={<button className="icon-btn" onClick={() => notify('Filters are ready for this list')}><ListFilter size={19} /></button>} /><div className="operator-map"><MapCanvas markerCount={1} /><div className="map-overlay-chip"><span className="pulse-dot" /> {activeBooking ? '1 live location' : 'No live locations'}</div></div><div className="section-head"><div><h2>On the road</h2><p>Live location is consent-based</p></div><button className="text-btn" onClick={() => notify('Locations refreshed')}><RefreshCw size={14} /> Refresh</button></div>{activeRental && activeBooking ? <button className="active-rental-row" onClick={openActiveRental}><div className="active-rental-thumb"><img src={vehiclePhoto(activeVehicle)} alt="" /><span className="pulse-dot" /></div><div><div className="row-title"><strong>Aarav Mehta</strong><StatusBadge status="Active" /></div><h3>{activeVehicle.name}</h3><p><Clock3 size={13} /> Started today at 10:30 AM</p><span className="live-copy"><Navigation size={12} /> Location shared · 42 sec ago</span></div><ChevronRight size={18} /></button> : lastClosedRental ? <div className="closure-card"><div className="closure-card-head"><div className="closure-icon"><CheckCircle2 size={20} /></div><div><span className="eyebrow">RETURN COMPLETE</span><h3>Rental closed</h3><p>{lastClosedRental.vehicleName} · {lastClosedRental.bookingId}</p></div><StatusBadge status={lastClosedRental.vehicleStatus === 'AVAILABLE' ? 'Available' : 'Pending inspection'} /></div><div className="closure-feedback"><Star size={17} fill={colors.orange} color={colors.orange} /><div><strong>Feedback requested</strong><span>The traveler can now review this ride.</span></div><CheckCircle2 size={16} /></div></div> : <EmptyHint icon={Navigation} title="No active rentals" text="Started rentals will appear here with consent-based location." action="View bookings" onClick={() => navigate('operatorBookings')} />}</div>;
  }

  function OperatorActiveRentalDetail() {
    const rentalVehicle = vehicles.find((vehicle) => vehicle.id === selectedBooking.vehicleId) ?? liveVehicle;
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Live rental" onBack={() => navigate('activeRentals')} /><div className="live-status-head"><span className="pulse-dot" /> LIVE LOCATION <span>42 sec ago</span></div><MapCard consent onConsent={() => notify('Location refreshed')} onLocate={() => notify('Active rental location centered')} userLocation={userLocation} /><div className="detail-content"><div className="renter-card"><div className="big-avatar">AM</div><div><h2>Aarav Mehta</h2><p><Phone size={13} /> +91 98••• 43210</p></div><button className="icon-btn light" onClick={() => notify('Traveler contact simulation started')}><Phone size={17} /></button></div><section className="booking-info-card"><InfoLine icon={Bike} label="Vehicle" value={`${rentalVehicle.name} · RJ 38 AB 2048`} /><InfoLine icon={KeyRound} label="Token" value={selectedBooking.token} /><InfoLine icon={Clock3} label="Started" value={selectedBooking.start} /><InfoLine icon={ShieldAlert} label="SOS status" value={sosRaised ? 'Raised · responding' : 'No active alert'} green={!sosRaised} /></section><button className="sos-mini-banner" onClick={() => navigate('alerts')}><ShieldAlert size={17} /><span><strong>{sosRaised ? 'SOS alert raised' : 'Safety alerts'}</strong><small>{sosRaised ? 'Aarav needs support now' : 'Monitor alerts for this rental'}</small></span><ChevronRight size={17} /></button></div><div className="sticky-cta"><button className="primary-btn full-btn" onClick={() => setModal('end')}>End rental & inspect <PackageCheck size={17} /></button></div></div>;
  }

  function ReturnScreen() {
    const expectedReturnToken = selectedBooking.token === '—' ? 'RS-7392' : selectedBooking.token;
    const verifyReturnToken = () => {
      if (returnToken.replace(/\s/g, '').toUpperCase() !== expectedReturnToken.replace(/\s/g, '').toUpperCase()) {
        setReturnError(true);
        setReturnVerified(false);
        return;
      }
      setReturnError(false);
      setReturnVerified(true);
      notify('Return token verified');
    };
    const chooseReturnCondition = (condition: ReturnCondition) => {
      setReturnCondition(condition);
    };
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Close rental" onBack={() => navigate('activeRentalDetail')} /><div className="return-intro"><div className="return-icon"><PackageCheck size={25} /></div><div><h1>Complete the return</h1><p>Inspect the vehicle, add notes, then close this rental.</p></div></div><div className={`return-token ${returnError ? 'has-error' : ''}`}><div><span>BOOKING TOKEN</span><div className="return-token-entry"><KeyRound size={14} /><input value={returnToken} onChange={(e) => { setReturnToken(e.target.value.toUpperCase()); setReturnVerified(false); setReturnError(false); }} placeholder={expectedReturnToken} /></div></div><button onClick={() => { setReturnToken(expectedReturnToken); setReturnVerified(false); setReturnError(false); notify('Demo scanner filled the token'); }}><Camera size={15} /> Scan QR</button><button className={returnVerified ? 'verified-return' : ''} onClick={verifyReturnToken}>{returnVerified ? <CheckCircle2 size={15} /> : <Check size={15} />} {returnVerified ? 'Verified' : 'Verify'}</button></div>{returnError && <span className="field-error return-error"><CircleAlert size={14} /> Token invalid or already used.</span>}<div className="form-content"><label className="field-label">Return notes<textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Any scratches, fuel level or other notes…" /></label><h3 className="form-subtitle">Vehicle condition</h3><div className="condition-options"><button className={returnCondition === 'GOOD' ? 'active' : ''} onClick={() => chooseReturnCondition('GOOD')}><CheckCircle2 size={16} /> Good condition</button><button className={returnCondition === 'INSPECTION' ? 'active' : ''} onClick={() => chooseReturnCondition('INSPECTION')}><CircleAlert size={16} /> Needs inspection</button><button className={returnCondition === 'MAINTENANCE' ? 'active' : ''} onClick={() => chooseReturnCondition('MAINTENANCE')}><WrenchIcon /> Maintenance needed</button></div><UploadField label="Add return photos (optional)" /></div><div className="sticky-cta"><button className="primary-btn full-btn" disabled={!returnVerified} onClick={() => { if (returnVerified) setModal('return'); }}>Close rental <CheckCircle2 size={17} /></button></div></div>;
  }

  function OperatorAlerts() {
    return <div className="screen scroll-screen"><AppHeader title="SOS alerts" subtitle="Keep every rider safe" action={<button className="icon-btn notification" onClick={openNotifications}><Bell size={19} />{!notificationsRead && <span />}</button>} /><div className="sos-summary"><div className="sos-summary-icon"><ShieldAlert size={21} /></div><div><strong>{alerts.filter((a) => a.status === 'RAISED').length} open alert</strong><span>Respond quickly to keep riders safe</span></div></div><div className="alert-list">{alerts.map((alert) => <div key={alert.id} className={`sos-alert-card ${alert.status === 'RAISED' ? 'urgent' : ''}`}><button className="alert-card-click" onClick={() => openSosDetail(alert)}><div className="alert-card-top"><span className="alert-id">{alert.id}</span><SOSBadge status={alert.status} /><MoreHorizontal size={17} /></div><div className="alert-person"><div className="big-avatar red-avatar">{alert.traveler.split(' ').map((n) => n[0]).join('')}</div><div><h3>{alert.traveler}</h3><p>{alert.vehicle} · {alert.time}</p></div></div><div className="alert-location"><MapPin size={15} /><span>{alert.location}</span><span className="view-map-link">View map <ChevronRight size={14} /></span></div></button>{alert.status === 'RAISED' && <div className="alert-actions"><button className="secondary-btn" onClick={() => updateAlertStatus(alert.id, 'ACKNOWLEDGED')}>Acknowledge</button><button className="primary-btn" onClick={() => updateAlertStatus(alert.id, 'RESOLVED')}>Resolve</button></div>}</div>)}</div></div>;
  }

  function ReviewsScreen() {
    return <div className="screen scroll-screen"><AppHeader title="Reviews" subtitle="What riders say about you" action={<button className="icon-btn" onClick={() => notify('Filters are ready for this list')}><ListFilter size={19} /></button>} /><div className="rating-overview"><div><strong>4.8</strong><div className="stars">★★★★★</div><span>76 reviews</span></div><div className="rating-bars"><RatingBar label="5" value="88%" /><RatingBar label="4" value="8%" /><RatingBar label="3" value="3%" /><RatingBar label="2" value="1%" /></div></div><div className="review-list"><ReviewCard initials="RK" name="Rohan Kapoor" rating={5} date="12 Oct 2024" vehicle="Honda Activa 6G" text="Super smooth pickup and very helpful team. The QR handover saved a lot of time." /><ReviewCard initials="NS" name="Nisha Shah" rating={5} date="08 Oct 2024" vehicle="Bajaj Pulsar 150" text="Bike was clean and ready exactly on time. Loved exploring the sunset point." /><ReviewCard initials="AT" name="Aditi T." rating={4} date="28 Sep 2024" vehicle="Maruti WagonR" text="Good car for the hills, would rent again." /></div></div>;
  }

  function AdminApp() {
    const tabs = [
      { key: 'approvals' as Screen, label: 'Approvals', icon: FileCheck2 },
      { key: 'adminBookings' as Screen, label: 'Bookings', icon: ReceiptText },
      { key: 'adminSOS' as Screen, label: 'SOS alerts', icon: ShieldAlert },
      { key: 'metrics' as Screen, label: 'Metrics', icon: Gauge },
    ];
    const isHome = ['approvals', 'adminBookings', 'adminSOS', 'metrics'].includes(screen);
    return <>{screen === 'approvals' && <AdminApprovals />}{screen === 'adminBookings' && <AdminBookings />}{screen === 'adminBookingDetail' && <AdminBookingDetail />}{screen === 'adminKycReview' && <AdminKycReview />}{screen === 'adminKycDetail' && <AdminKycDetail />}{screen === 'adminSOS' && <AdminSOS />}{screen === 'sosDetail' && <SosDetail />}{screen === 'metrics' && <AdminMetrics />}{isHome && <BottomTabs tabs={tabs} active={screen} onChange={navigate} />}</>;
  }

  function AdminApprovals() {
    return <div className="screen scroll-screen"><AppHeader title="Good morning, Admin" subtitle="RideSathi control centre" action={<div className="header-actions"><button className="icon-btn notification" onClick={openNotifications}><Bell size={19} />{!notificationsRead && <span />}</button><button className="icon-btn" onClick={() => setModal('logout')}><MoreHorizontal size={20} /></button></div>} /><div className="admin-banner"><div className="admin-shield"><ShieldCheck size={21} /></div><div><strong>Network health is good</strong><span>Mount Abu pilot · Last synced just now</span></div><RefreshCw size={16} /></div><div className="approval-counts"><div><strong>3</strong><span>Pending actions</span></div><div><strong>12</strong><span>Approved operators</span></div><div><strong>48</strong><span>Active vehicles</span></div></div><div className="section-head"><div><h2>Review queue</h2><p>Approve partners and vehicles</p></div><div className="admin-queue-actions"><button className="text-btn" onClick={() => navigate('adminKycReview')}><FileCheck2 size={14} /> Review KYC</button><button className="text-btn" onClick={() => notify('Queue refreshed')}><RefreshCw size={14} /></button></div></div><div className="admin-tabs"><button className={adminTab === 'operators' ? 'active' : ''} onClick={() => setAdminTab('operators')}>Operators <span>2</span></button><button className={adminTab === 'vehicles' ? 'active' : ''} onClick={() => setAdminTab('vehicles')}>Vehicles <span>1</span></button></div>{adminTab === 'operators' ? <div className="approval-list"><ApprovalCard initials="SR" title="Sharma Rides" subtitle="Nakki Lake Road · Submitted 2h ago" type="Operator" approve={() => approve('Sharma Rides')} reject={() => reject('Sharma Rides')} /><ApprovalCard initials="RD" title="Rajasthan Drive Co." subtitle="Delwara Road · Submitted yesterday" type="Operator" approve={() => approve('Rajasthan Drive Co.')} reject={() => reject('Rajasthan Drive Co.')} /></div> : <div className="approval-list"><ApprovalCard initials="HD" title="Honda Dio" subtitle="Mount Abu Riders · ₹479/day" type="Vehicle · Documents uploaded" approve={() => approve('Honda Dio')} reject={() => reject('Honda Dio')} /></div>}<button className="alert-banner" onClick={() => navigate('adminSOS')}><div className="alert-icon"><ShieldAlert size={18} /></div><div><strong>1 SOS alert is open</strong><span>Review the active safety incident</span></div><ChevronRight size={17} /></button></div>;
  }

  function AdminKycReview() {
    const pendingCount = kycReviews.filter((record) => record.status === 'PENDING').length;
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="KYC review" step={`${pendingCount} pending`} onBack={() => navigate('approvals')} /><div className="kyc-review-intro"><div className="secure-icon"><ShieldCheck size={20} /></div><div><h1>Verify traveler documents</h1><p>Review masked IDs and consent before handover.</p></div></div><div className="kyc-review-summary"><div><strong>{pendingCount}</strong><span>Pending review</span></div><div><strong>{kycReviews.filter((record) => record.status === 'VERIFIED').length}</strong><span>Verified</span></div><div><strong>{kycReviews.filter((record) => record.status === 'REJECTED').length}</strong><span>Rejected</span></div></div><div className="section-head"><div><h2>Traveler queue</h2><p>Documents are shown with masked IDs only.</p></div><span className="eyebrow">{kycReviews.length} records</span></div><div className="kyc-review-list">{kycReviews.map((record) => <button key={record.id} className="kyc-review-card" onClick={() => { setSelectedKyc(record); navigate('adminKycDetail'); }}><div className="kyc-card-head"><div className="big-avatar">{record.traveler.split(' ').map((name) => name[0]).join('')}</div><div><span className="booking-id">{record.id} · {record.bookingId}</span><h3>{record.traveler}</h3><p>{record.idType} · Submitted {record.submitted}</p></div><KycStatusBadge status={record.status} /></div><div className="kyc-card-meta"><span><FileCheck2 size={14} /> {record.maskedId}</span><span><ShieldCheck size={14} /> Consent captured</span><ChevronRight size={17} /></div></button>)}</div></div>;
  }

  function AdminKycDetail() {
    const updateKycStatus = (status: KycReview['status']) => {
      setKycReviews((records) => records.map((record) => record.id === selectedKyc.id ? { ...record, status } : record));
      setSelectedKyc((record) => ({ ...record, status }));
      notify(status === 'VERIFIED' ? 'KYC verified · traveler notified' : 'KYC rejected · traveler notified');
      navigate('adminKycReview');
    };
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="KYC record" step={selectedKyc.id} onBack={() => navigate('adminKycReview')} /><div className="kyc-detail-hero"><div className="big-avatar">{selectedKyc.traveler.split(' ').map((name) => name[0]).join('')}</div><div><span className="booking-id">{selectedKyc.bookingId}</span><h1>{selectedKyc.traveler}</h1><p>Submitted {selectedKyc.submitted}</p></div><KycStatusBadge status={selectedKyc.status} /></div><div className="kyc-detail-content"><section className="booking-info-card"><InfoLine icon={FileText} label="Document type" value={selectedKyc.idType} /><InfoLine icon={LockKeyhole} label="Masked ID" value={selectedKyc.maskedId} green /><InfoLine icon={ShieldCheck} label="Consent" value={selectedKyc.consent} green /><InfoLine icon={CalendarDays} label="Booking" value={selectedKyc.bookingId} /></section><section className="document-preview-section"><div className="section-head"><div><h2>Uploaded documents</h2><p>Preview placeholders keep identity data protected.</p></div><LockKeyhole size={17} color={colors.green} /></div><div className="document-thumbnails"><div><FileText size={25} /><span>Front side</span><small>{selectedKyc.maskedId}</small></div><div><FileCheck2 size={25} /><span>Back side</span><small>Uploaded securely</small></div></div></section><div className="verification-note"><ShieldCheck size={18} /><div><strong>Privacy-safe review</strong><span>Only masked identifiers are displayed in the Admin workspace.</span></div></div></div>{selectedKyc.status === 'PENDING' ? <div className="sticky-cta"><button className="secondary-btn" onClick={() => updateKycStatus('REJECTED')}>Reject</button><button className="primary-btn" onClick={() => updateKycStatus('VERIFIED')}>Verify <Check size={16} /></button></div> : <div className="sticky-cta"><button className="primary-btn full-btn" onClick={() => navigate('adminKycReview')}>Back to KYC queue <ArrowRight size={16} /></button></div>}</div>;
  }

  function AdminBookings() {
    const filteredBookings = adminBookingTab === 'active' ? bookings.filter((booking) => booking.status === 'ACTIVE') : adminBookingTab === 'completed' ? bookings.filter((booking) => ['COMPLETED', 'RETURNED'].includes(booking.status)) : bookings;
    return <div className="screen scroll-screen"><AppHeader title="All bookings" subtitle="Live network activity" action={<button className="icon-btn" onClick={() => notify('Filters are ready for this list')}><ListFilter size={19} /></button>} /><div className="admin-booking-metrics"><MetricTile label="Today" value="18" trend="+12% vs yesterday" icon={CalendarDays} /><MetricTile label="Active now" value="6" trend="Across Mount Abu" icon={Navigation} blue /></div><div className="segmented"><button className={adminBookingTab === 'all' ? 'active' : ''} onClick={() => setAdminBookingTab('all')}>All <span>{bookings.length}</span></button><button className={adminBookingTab === 'active' ? 'active' : ''} onClick={() => setAdminBookingTab('active')}>Active <span>{bookings.filter((booking) => booking.status === 'ACTIVE').length}</span></button><button className={adminBookingTab === 'completed' ? 'active' : ''} onClick={() => setAdminBookingTab('completed')}>Completed <span>{bookings.filter((booking) => ['COMPLETED', 'RETURNED'].includes(booking.status)).length}</span></button></div><div className="booking-stack admin-booking-stack">{filteredBookings.map((booking) => <BookingCard key={booking.id} booking={booking} onClick={() => { setSelectedBooking(booking); const vehicle = vehicles.find((item) => item.id === booking.vehicleId); if (vehicle) setSelectedVehicle(vehicle); navigate('adminBookingDetail'); }} />)}</div></div>;
  }

  function AdminBookingDetail() {
    const commission = Math.round(selectedBooking.amount * 0.1);
    const traveler = selectedBooking.id === 'RS-2048' ? 'Priya Shah' : selectedBooking.id === 'RS-1932' ? 'Aarav Mehta' : 'Kabir Joshi';
    const vehicle = vehicles.find((item) => item.id === selectedBooking.vehicleId) ?? selectedVehicle;
    const hasSos = alerts.some((alert) => alert.vehicle === selectedBooking.vehicleName && alert.status !== 'RESOLVED');
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="Booking detail" step={selectedBooking.id} onBack={() => navigate('adminBookings')} /><div className="admin-booking-detail-hero"><div className="booking-card-top"><span className="booking-id">{selectedBooking.id}</span><StatusBadge status={selectedBooking.status === 'ACTIVE' ? 'Active' : selectedBooking.status === 'COMPLETED' ? 'Completed' : selectedBooking.status === 'CONFIRMED' ? 'Confirmed' : selectedBooking.status} /></div><img src={vehiclePhoto(vehicle)} alt="" /><h1>{selectedBooking.vehicleName}</h1><p>{selectedBooking.operator} · Mount Abu</p></div><div className="detail-content"><section className="booking-info-card"><InfoLine icon={CircleUserRound} label="Traveler" value={traveler} /><InfoLine icon={Bike} label="Vehicle" value={selectedBooking.vehicleName} /><InfoLine icon={Users} label="Operator" value={selectedBooking.operator} /><InfoLine icon={CalendarDays} label="Rental time" value={`${selectedBooking.start} – ${selectedBooking.end}`} /></section><section className="booking-info-card"><InfoLine icon={WalletCards} label="Amount paid" value={formatCurrency(selectedBooking.amount)} green /><InfoLine icon={IndianRupee} label="RideSathi commission" value={`${formatCurrency(commission)} · 10%`} /><InfoLine icon={CreditCard} label="Payment" value={selectedBooking.payment === 'SUCCESS' ? 'Paid · mock payment' : selectedBooking.payment} green /><InfoLine icon={FileCheck2} label="KYC" value={selectedBooking.kyc === 'VERIFIED' ? 'Verified · masked ID' : selectedBooking.kyc} green /></section><div className="token-inline"><div><span>Token / QR reference</span><strong>{selectedBooking.token}</strong><small>Handover reference · never expose full IDs</small></div><FakeQR token={selectedBooking.token} small /></div><section className="timeline-section"><h3>Booking timeline</h3><Timeline status={selectedBooking.status} /></section><div className={`admin-sos-link ${hasSos ? 'urgent' : ''}`}><ShieldAlert size={17} /><div><strong>{hasSos ? 'SOS linked to this rental' : 'No open SOS linked'}</strong><span>{hasSos ? 'Open the safety incident for location and response history.' : 'Safety status is clear for this booking.'}</span></div>{hasSos && <button onClick={() => { const alert = alerts.find((item) => item.vehicle === selectedBooking.vehicleName && item.status !== 'RESOLVED'); if (alert) openSosDetail(alert); }}><ChevronRight size={17} /></button>}</div></div><div className="sticky-cta"><button className="secondary-btn" onClick={() => setModal('adminActions')}>More actions <MoreHorizontal size={16} /></button><button className="primary-btn" onClick={() => notify('Booking timeline refreshed')}>Refresh <RefreshCw size={16} /></button></div></div>;
  }

  function AdminSOS() {
    return <div className="screen scroll-screen"><AppHeader title="SOS alerts" subtitle="Safety response centre" action={<div className="header-actions"><button className="icon-btn notification" onClick={openNotifications}><Bell size={19} />{!notificationsRead && <span />}</button><button className="icon-btn" onClick={() => notify('SOS queue refreshed')}><RefreshCw size={19} /></button></div>} /><div className="admin-sos-hero"><div className="sos-summary-icon"><ShieldAlert size={22} /></div><div><strong>{alerts.filter((alert) => alert.status === 'RAISED').length} needs attention</strong><span>Operators and support are notified immediately.</span></div></div><div className="alert-list">{alerts.map((alert) => <div key={alert.id} className={`sos-alert-card ${alert.status === 'RAISED' ? 'urgent' : ''}`}><div className="alert-card-top"><span className="alert-id">{alert.id}</span><SOSBadge status={alert.status} /><span className="admin-time">{alert.time}</span></div><div className="alert-person"><div className="big-avatar red-avatar">{alert.traveler.split(' ').map((n) => n[0]).join('')}</div><div><h3>{alert.traveler}</h3><p>{alert.vehicle}</p></div></div><div className="alert-location"><MapPin size={15} /><span>{alert.location}</span></div><div className="map-preview" role="button" tabIndex={0} onClick={() => openSosDetail(alert)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openSosDetail(alert); }}><MapCanvas markerCount={1} /><span><Navigation size={14} /> Open SOS detail & map</span></div></div>)}</div></div>;
  }

  function SosDetail() {
    const currentAlert = alerts.find((alert) => alert.id === selectedAlert.id) ?? selectedAlert;
    const backScreen: Screen = role === 'admin' ? 'adminSOS' : 'alerts';
    return <div className="screen scroll-screen detail-screen"><DetailHeader title="SOS detail" step={currentAlert.id} onBack={() => navigate(backScreen)} /><div className="sos-detail-hero"><div className="sos-summary-icon"><ShieldAlert size={24} /></div><div><span className="eyebrow">SAFETY INCIDENT</span><h1>{currentAlert.status === 'RESOLVED' ? 'Incident resolved' : 'Immediate response'}</h1><p>{currentAlert.traveler} · {currentAlert.vehicle}</p></div><SOSBadge status={currentAlert.status} /></div><div className="detail-content"><div className="sos-detail-map"><MapCanvas markerCount={1} userLocation={userLocation} /><div className="map-detail-chip"><MapPin size={14} /> {currentAlert.location}</div><button onClick={() => notify('Map recentered on the shared location')}><Navigation size={16} /></button></div><section className="booking-info-card"><InfoLine icon={CircleUserRound} label="Traveler" value={currentAlert.traveler} /><InfoLine icon={Bike} label="Vehicle" value={currentAlert.vehicle} /><InfoLine icon={Clock3} label="Raised" value={currentAlert.time} /><InfoLine icon={MapPin} label="Coordinates" value={currentAlert.location.split('·').pop()?.trim() ?? '24.5926, 72.7156'} /></section><div className="location-consent-card"><Navigation size={18} /><div><strong>Location consent</strong><span>{currentAlert.location.includes('Live location') || currentAlert.location.includes('Near') ? 'Traveler location is shared with the response team.' : 'Location unavailable; contact support for assistance.'}</span></div><CheckCircle2 size={17} /></div><section className="sos-history"><div className="section-head"><div><h2>Response history</h2><p>Every action is recorded.</p></div><Clock3 size={17} color={colors.green} /></div><div className="sos-history-row"><span className="history-dot raised" /><div><strong>SOS {currentAlert.status === 'RESOLVED' ? 'raised and resolved' : 'raised'}</strong><span>{currentAlert.time}</span></div></div>{currentAlert.status !== 'RAISED' && <div className="sos-history-row"><span className="history-dot acknowledged" /><div><strong>Operator acknowledged</strong><span>Response team notified</span></div></div>}{currentAlert.status === 'RESOLVED' && <div className="sos-history-row"><span className="history-dot resolved" /><div><strong>Incident resolved</strong><span>Safety team closed the alert</span></div></div>}</section><div className="sos-contact-actions"><button className="secondary-btn" onClick={() => notify('Support call simulation started')}><Phone size={16} /> Call support</button><button className="secondary-btn" onClick={() => notify('Traveler contact simulation started')}><MessageCircle size={16} /> Contact traveler</button></div></div>{currentAlert.status === 'RAISED' && <div className="sticky-cta"><button className="secondary-btn" onClick={() => updateAlertStatus(currentAlert.id, 'ACKNOWLEDGED')}>Acknowledge</button><button className="danger-btn" onClick={() => updateAlertStatus(currentAlert.id, 'RESOLVED')}>Resolve SOS</button></div>}</div>;
  }

  function AdminMetrics() {
    return <div className="screen scroll-screen"><AppHeader title="Network metrics" subtitle="Mount Abu · 30 day overview" action={<button className="icon-btn" onClick={() => notify('More metrics actions are coming soon')}><MoreHorizontal size={20} /></button>} /><div className="metrics-hero"><div><span>Gross booking value</span><strong>₹3,84,920</strong><small><span className="up-arrow">↗</span> 18.4% this month</small></div><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /></div></div><div className="admin-stat-grid"><MetricTile label="Operators" value="14" trend="12 approved" icon={Users} /><MetricTile label="Vehicles" value="56" trend="48 active" icon={Bike} /><MetricTile label="Bookings" value="184" trend="+18.4%" icon={ReceiptText} /><MetricTile label="Completed" value="162" trend="88% success" icon={CheckCircle2} /><MetricTile label="SOS raised" value="4" trend="3 resolved" icon={ShieldAlert} red /><MetricTile label="Avg. rating" value="4.8" trend="1,240 rides" icon={Star} /></div><section className="metrics-section"><div className="section-head"><div><h2>Booking activity</h2><p>Last 7 days</p></div><span className="legend-dot">Confirmed</span></div><div className="bar-chart"><i style={{ height: '42%' }} /><i style={{ height: '58%' }} /><i style={{ height: '52%' }} /><i style={{ height: '76%' }} /><i style={{ height: '64%' }} /><i style={{ height: '92%' }} /><i style={{ height: '70%' }} /></div><div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></section></div>;
  }
}

function NotificationPopover({ role, onClose, onMarkRead, notificationsRead }: { role: Role; onClose: () => void; onMarkRead: () => void; notificationsRead: boolean }) {
  const items = notificationsByRole[role];
  const iconFor = (icon: AppNotification['icon']) => icon === 'check' ? CheckCircle2 : icon === 'shield' ? ShieldCheck : icon === 'headphones' ? Headphones : icon === 'bike' ? Bike : icon === 'alert' ? ShieldAlert : FileCheck2;
  return <div className="notification-layer" onClick={onClose}><div className="notification-popover" onClick={(event) => event.stopPropagation()}><div className="notification-header"><div><span className="eyebrow">RIDESATHI INBOX · {demoAccounts[role].label.toUpperCase()}</span><h2>Notifications</h2></div><button className="icon-btn light" onClick={onClose}><X size={17} /></button></div><div className="notification-list">{items.map((item, index) => { const ItemIcon = iconFor(item.icon); const isUnread = !notificationsRead && index < 2; return <div className={`notification-item ${isUnread ? 'unread' : ''}`} key={`${role}-${item.title}`}><div className={`notification-item-icon ${item.tone}`}><ItemIcon size={17} /></div><div><strong>{item.title}</strong><span>{item.body}</span><small>{item.time}</small></div>{isUnread && <i />}</div>; })}</div><button className="notification-footer" onClick={onMarkRead}>{notificationsRead ? 'All notifications read' : 'Mark all as read'} <Check size={14} /></button></div></div>;
}

function LoginScreen({ email, password, setEmail, setPassword, role, setRole, onLogin, onDemo, error, loading }: { email: string; password: string; setEmail: (v: string) => void; setPassword: (v: string) => void; role: Role; setRole: (r: Role) => void; onLogin: () => void; onDemo: (r: Role) => void; error: string | null; loading: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  return <div className="login-screen"><div className="login-brand"><div className="logo-mark"><Navigation size={21} fill="white" /></div><span>Ride<span>Sathi</span></span><small>VERIFIED LOCAL RIDES</small></div><div className="login-hero"><div className="login-map"><div className="login-road road-one" /><div className="login-road road-two" /><div className="login-road road-three" /><span className="login-map-pin"><MapPin size={27} fill={colors.orange} /></span><span className="login-map-dot dot-one" /><span className="login-map-dot dot-two" /></div><div className="login-hero-copy"><span className="eyebrow">YOUR RIDE, YOUR SATHI</span><h1>See Mount Abu<br /><em>your way.</em></h1><p>Verified rentals for unhurried hill days.</p></div></div><div className="login-card"><div className="role-selector"><button className={role === 'traveler' ? 'active' : ''} onClick={() => { setRole('traveler'); setEmail('traveler@demo.com'); }}>Traveler</button><button className={role === 'operator' ? 'active' : ''} onClick={() => { setRole('operator'); setEmail('operator@demo.com'); }}>Operator</button><button className={role === 'admin' ? 'active' : ''} onClick={() => { setRole('admin'); setEmail('admin@demo.com'); }}>Admin</button></div><div className="login-fields"><label><span>Email address</span><div className="input-wrap"><Smartphone size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error)} /></div></label><label><span>Password</span><div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(error)} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}><EyeIcon /></button></div></label></div>{error && <div className="login-error" role="alert"><CircleAlert size={16} /><div><strong>We couldn't sign you in</strong><span>{error}</span></div></div>}<button className="primary-btn login-btn" onClick={onLogin} disabled={loading}>{loading ? <><RefreshCw size={16} className="spin" /> Signing you in…</> : <>Continue to RideSathi <ArrowRight size={17} /></>}</button><div className="demo-helper"><span>DEMO ACCESS</span><p>Tap a role to explore the full experience</p><div className="demo-links"><button onClick={() => onDemo('traveler')}><CircleUserRound size={14} /> Traveler <ArrowRight size={13} /></button><button onClick={() => onDemo('operator')}><Bike size={14} /> Operator <ArrowRight size={13} /></button><button onClick={() => onDemo('admin')}><ShieldCheck size={14} /> Admin <ArrowRight size={13} /></button></div></div></div><p className="login-footer"><ShieldCheck size={13} /> Safe, verified rentals · Mount Abu pilot</p></div>;
}

function BottomTabs({ tabs, active, onChange }: { tabs: { key: Screen; label: string; icon: LucideIcon }[]; active: Screen; onChange: (key: Screen) => void }) {
  return <nav className="bottom-tabs">{tabs.map((tab) => <button key={tab.key} className={active === tab.key ? 'active' : ''} onClick={() => onChange(tab.key)}><Icon icon={tab.icon} size={20} /><span>{tab.label}</span>{tab.key === 'alerts' && <b className="tab-alert">1</b>}</button>)}</nav>;
}

function AppHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <header className="app-header"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</header>;
}

function DetailHeader({ title, step, onBack, onMenu }: { title: string; step?: string; onBack?: () => void; onMenu?: () => void }) {
  return <header className="detail-header"><button className="icon-btn" onClick={onBack ?? (() => window.history.back())}><ArrowLeft size={20} /></button><div><strong>{title}</strong>{step && <span>{step}</span>}</div>{onMenu ? <button className="icon-btn" onClick={onMenu}><MoreHorizontal size={19} /></button> : <span className="detail-header-spacer" />}</header>;
}

function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return <button className={active ? 'filter-chip active' : 'filter-chip'} onClick={onClick}>{label}{active && <Check size={13} />}</button>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${status.toLowerCase().replace(/ /g, '-')}`}><i />{status}</span>;
}
function KycStatusBadge({ status }: { status: KycReview['status'] }) {
  return <span className={`kyc-status ${status.toLowerCase()}`}><i />{status}</span>;
}
function SOSBadge({ status }: { status: string }) {
  return <span className={`sos-badge ${status.toLowerCase()}`}><i />{status}</span>;
}

function InfoTile({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="info-tile"><Icon icon={icon} size={17} /><span>{label}</span><strong>{value}</strong></div>;
}
function InfoLine({ icon, label, value, green }: { icon: LucideIcon; label: string; value: string; green?: boolean }) {
  return <div className="info-line"><Icon icon={icon} size={17} /><span>{label}</span><strong className={green ? 'green-text' : ''}>{value}</strong></div>;
}
function ProfileRow({ icon, title, subtitle, onClick }: { icon: LucideIcon; title: string; subtitle: string; onClick?: () => void }) {
  return <button className="profile-row" onClick={onClick}><div className="profile-row-icon"><Icon icon={icon} size={17} /></div><div><strong>{title}</strong><span>{subtitle}</span></div><ChevronRight size={17} /></button>;
}
function QuickAction({ icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return <button className="quick-action" onClick={onClick}><div><Icon icon={icon} size={20} /></div><span>{label}</span></button>;
}
function MetricTile({ label, value, trend, icon, blue, orange, red }: { label: string; value: string; trend: string; icon: LucideIcon; blue?: boolean; orange?: boolean; red?: boolean }) {
  return <div className={`metric-tile ${blue ? 'blue' : ''} ${orange ? 'orange' : ''} ${red ? 'red' : ''}`}><div className="metric-icon"><Icon icon={icon} size={16} /></div><span>{label}</span><strong>{value}</strong><small>{trend}</small></div>;
}
function EmptyHint({ icon, title, text, action, onClick }: { icon: LucideIcon; title: string; text: string; action: string; onClick: () => void }) {
  return <div className="empty-hint"><div className="empty-icon"><Icon icon={icon} size={24} /></div><h3>{title}</h3><p>{text}</p><button className="text-btn" onClick={onClick}>{action} <ArrowRight size={14} /></button></div>;
}
function Field({ label, value, icon, helper, onChange, placeholder }: { label: string; value?: string; icon?: LucideIcon; helper?: string; onChange?: (value: string) => void; placeholder?: string }) {
  return <label className="field-label">{label}<div className="field-input">{icon && <Icon icon={icon} size={17} />}<input value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} /></div>{helper && <small className="field-helper">{helper}</small>}</label>;
}
function SelectField({ label, value, icon }: { label: string; value: string; icon: LucideIcon }) {
  return <label className="field-label">{label}<div className="field-input select-input"><Icon icon={icon} size={17} /><select defaultValue={value}><option>Aadhaar</option><option>Passport</option><option>Voter ID</option><option>Other</option></select><ChevronDown size={15} /></div></label>;
}
function UploadField({ label, accept = 'image/*,.pdf' }: { label: string; accept?: string }) {
  const [fileName, setFileName] = useState('');
  return <label className="upload-field"><input className="visually-hidden-input" type="file" accept={accept} onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} /><div className="upload-icon"><Upload size={17} /></div><div><strong>{fileName || label}</strong><span>{fileName ? 'Ready to attach · tap to replace' : 'JPG or PDF · max 5 MB'}</span></div><Plus size={17} /></label>;
}
function CheckRow({ label }: { label: string }) {
  return <label className="check-row"><input type="checkbox" defaultChecked /><span className="check-box"><Check size={13} /></span><span>{label}</span><CheckCircle2 size={17} color={colors.green} /></label>;
}
function FakeQR({ token, small = false }: { token: string; small?: boolean }) {
  const cells = useMemo(() => Array.from({ length: 225 }, (_, index) => { const x = index % 15; const y = Math.floor(index / 15); const finder = (x < 5 && y < 5) || (x > 9 && y < 5) || (x < 5 && y > 9); const border = finder && (x === 0 || x === 4 || y === 0 || y === 4 || (x > 9 && (x === 10 || x === 14 || y === 0 || y === 4)) || (x < 5 && (y === 10 || y === 14))); const inner = finder && ((x === 2 && y === 2) || (x === 12 && y === 2) || (x === 2 && y === 12)); return finder ? border || inner : ((x * 13 + y * 7 + token.length) % 5 < 2); }), [token]);
  return <div className={small ? 'fake-qr small' : 'fake-qr'}>{cells.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div>;
}
function MapAutoCenter({ center }: { center: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [center, map]);
  return null;
}

function MapCanvas({ markerCount = 1, userLocation }: { markerCount?: number; userLocation?: GeoPoint | null }) {
  const mapCenter: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [mountAbuCenter.lat, mountAbuCenter.lng];
  return <div className="map-canvas-shell"><MapContainer center={mapCenter} zoom={14} minZoom={11} maxZoom={18} scrollWheelZoom className="leaflet-map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapAutoCenter center={userLocation ?? null} />{mapRidePoints.slice(0, Math.max(markerCount, 1)).map((point, index) => <CircleMarker key={`${point.lat}-${point.lng}`} center={[point.lat, point.lng]} radius={index === 0 ? 8 : 6} pathOptions={{ color: index === 0 ? colors.green : colors.orange, fillColor: index === 0 ? colors.green : colors.orange, fillOpacity: .78, weight: 3 }}><Popup><strong>{index === 0 ? 'Honda Activa 6G' : 'Verified ride nearby'}</strong><br />Mount Abu · live availability</Popup></CircleMarker>)}{userLocation && <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8} pathOptions={{ color: '#2b86b5', fillColor: '#56acd1', fillOpacity: .95, weight: 3 }}><Popup>Your shared location</Popup></CircleMarker>}</MapContainer></div>;
}
function MapCard({ consent, onConsent, onLocate, userLocation }: { consent: boolean; onConsent: () => void; onLocate?: () => void; userLocation?: GeoPoint | null }) {
  return <div className="map-card"><MapCanvas userLocation={userLocation} /><div className="map-card-label"><MapPin size={14} fill={colors.orange} /> Mount Abu pilot area</div><button className="locate-btn" onClick={() => { if (consent) onLocate?.(); else onConsent(); }}><Navigation size={16} /></button></div>;
}
function Timeline({ status }: { status: string }) {
  const active = status === 'ACTIVE';
  const steps = active ? [['Booked', '10 Oct · 8:20 AM'], ['Confirmed', '10 Oct · 8:21 AM'], ['Active rental', 'Today · 10:30 AM']] : [['Booked', '18 Oct · 6:14 PM'], ['KYC verified', '18 Oct · 6:15 PM'], ['Confirmed', '18 Oct · 6:16 PM']];
  return <div className="timeline">{steps.map(([name, date], i) => <div className="timeline-row" key={name}><div className={`timeline-dot ${i === steps.length - 1 ? 'current' : ''}`}><Check size={12} /></div><div><strong>{name}</strong><span>{date}</span></div>{i < steps.length - 1 && <i />}</div>)}</div>;
}
function CameraScannerSheet({ stream, error, onClose, onDetected, onUseDemo }: { stream: MediaStream | null; error: string | null; onClose: () => void; onDetected: (token: string) => void; onUseDemo: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    void videoRef.current.play();
    const BarcodeDetectorCtor = (window as Window & { BarcodeDetector?: new (options?: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
    if (!BarcodeDetectorCtor) return;
    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
    const timer = window.setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        const token = codes[0]?.rawValue?.trim();
        if (token) onDetected(token);
      } catch {
        // Keep the manual/demo path available when browser QR detection is unavailable.
      }
    }, 700);
    return () => window.clearInterval(timer);
  }, [stream, onDetected]);
  return <div className="sheet-backdrop" onClick={onClose}><div className="camera-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><div className="sheet-header"><div><span className="eyebrow">SECURE HANDOVER</span><h2>Scan booking QR</h2></div><button className="icon-btn light" onClick={onClose}><X size={18} /></button></div>{stream ? <div className="camera-preview"><video ref={videoRef} playsInline muted /><div className="camera-frame"><i /><i /><i /><i /></div><span>Point the camera at the traveler QR</span></div> : <div className="camera-error"><Camera size={28} /><strong>Camera permission needed</strong><p>{error ?? 'Allow camera access to scan the booking QR.'}</p></div>}<button className="primary-btn full-btn" onClick={onUseDemo}>Use demo token <QrCode size={16} /></button><button className="secondary-btn full-btn" onClick={onClose}>Enter token manually</button></div></div>;
}

function AdminBookingActionSheet({ booking, onClose, onAction }: { booking: Booking; onClose: () => void; onAction: (message: string) => void }) {
  return <div className="sheet-backdrop" onClick={onClose}><div className="action-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><div className="sheet-header"><div><span className="eyebrow">ADMIN ACTIONS</span><h2>{booking.id}</h2></div><button className="icon-btn light" onClick={onClose}><X size={18} /></button></div><button className="action-sheet-row" onClick={() => onAction('Booking flagged for review')}><ShieldAlert size={18} /><span><strong>Flag booking</strong><small>Send this booking to the safety queue.</small></span><ChevronRight size={16} /></button><button className="action-sheet-row" onClick={() => onAction('Traveler contact note added')}><MessageCircle size={18} /><span><strong>Add support note</strong><small>Record an internal admin follow-up.</small></span><ChevronRight size={16} /></button><button className="action-sheet-row danger-row" onClick={() => onAction('Booking cancellation review started')}><Trash2 size={18} /><span><strong>Start cancellation review</strong><small>Keep the booking state unchanged until approved.</small></span><ChevronRight size={16} /></button></div></div>;
}

function ConfirmModal({ title, text, confirm, onConfirm, onClose, danger }: { title: string; text: string; confirm: string; onConfirm: () => void; onClose: () => void; danger?: boolean }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="confirm-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><div className={danger ? 'modal-icon danger' : 'modal-icon'}>{danger ? <ShieldAlert size={24} /> : <Info size={23} />}</div><h2>{title}</h2><p>{text}</p><div className="modal-actions"><button className="secondary-btn" onClick={onClose}>Not now</button><button className={danger ? 'danger-btn' : 'primary-btn'} onClick={onConfirm}>{confirm}</button></div></div></div>;
}
function FilterSheet({ onClose }: { onClose: () => void }) {
  const [vehicleType, setVehicleType] = useState('All types');
  const [priceMax, setPriceMax] = useState(3500);
  const [minRating, setMinRating] = useState('Any rating');
  const [availableOnly, setAvailableOnly] = useState(true);
  const showCount = vehicleType === 'Bike' ? 2 : vehicleType === 'Jeep' ? 1 : availableOnly ? 7 : 8;
  return <div className="sheet-backdrop" onClick={onClose}><div className="filter-sheet" onClick={(e) => e.stopPropagation()}><div className="sheet-handle" /><div className="sheet-header"><div><span className="eyebrow">REFINE SEARCH</span><h2>Find your ride</h2></div><button className="icon-btn light" onClick={onClose}><X size={18} /></button></div><div className="sheet-section"><h3>Vehicle type</h3><div className="sheet-chips">{['All types', 'Scooter', 'Bike', 'Car', 'Jeep'].map((type) => <FilterChip key={type} label={type} active={vehicleType === type} onClick={() => setVehicleType(type)} />)}</div></div><div className="sheet-section"><h3>Price per day <span>₹400 – {formatCurrency(priceMax)}</span></h3><input className="range-input" type="range" min="400" max="3500" step="50" value={priceMax} onChange={(event) => setPriceMax(Number(event.target.value))} /></div><div className="sheet-section"><h3>Minimum rating</h3><div className="sheet-chips">{['Any rating', '4.0+', '4.5+', '4.8+'].map((rating) => <FilterChip key={rating} label={rating} active={minRating === rating} onClick={() => setMinRating(rating)} />)}</div></div><div className="sheet-section"><h3>Availability</h3><label className="switch-row"><span>Available for my dates</span><label className="toggle"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /><span /></label></label></div><button className="primary-btn full-btn" onClick={onClose}>Show {showCount} rides <ArrowRight size={17} /></button></div></div>;
}
function FeedbackScreen({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const feedbackTags = ['Clean vehicle', 'Easy pickup', 'Friendly operator'];
  const toggleTag = (tag: string) => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  return <div className="screen scroll-screen detail-screen"><DetailHeader title="Share your experience" onBack={onBack} /><div className="feedback-hero"><div className="feedback-orbit"><Star size={26} fill="currentColor" /></div><h1>How was your ride?</h1><p>Your review helps other travelers ride with confidence.</p></div><div className="feedback-form"><div className="rating-question"><span>Rate the vehicle</span><div className="large-stars">{[1, 2, 3, 4, 5].map((i) => <button key={i} onClick={() => setRating(i)}><Star size={33} fill={i <= rating ? colors.orange : 'none'} color={i <= rating ? colors.orange : '#cbd3ce'} /></button>)}</div><small>{rating === 5 ? 'Loved it' : 'Thanks for your honesty'}</small></div><label className="field-label">Tell us more<textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What made your trip better?" /></label><div className="feedback-tags">{feedbackTags.map((tag) => <button key={tag} className={selectedTags.includes(tag) ? 'active' : ''} onClick={() => toggleTag(tag)}>{tag}{selectedTags.includes(tag) && <Check size={12} />}</button>)}</div></div><button className="primary-btn full-btn" onClick={onSubmit}>Submit review <Send size={16} /></button></div>;
}
function ApprovalCard({ initials, title, subtitle, type, approve, reject }: { initials: string; title: string; subtitle: string; type: string; approve: () => void; reject: () => void }) {
  return <div className="approval-card"><div className="approval-main"><div className="big-avatar">{initials}</div><div><span className="approval-type">{type}</span><h3>{title}</h3><p>{subtitle}</p></div><MoreHorizontal size={18} /></div><div className="document-row"><span><FileCheck2 size={14} /> Documents uploaded</span><span><Clock3 size={14} /> Needs review</span></div><div className="approval-actions"><button className="secondary-btn" onClick={reject}>Reject</button><button className="primary-btn" onClick={approve}>Approve <Check size={16} /></button></div></div>;
}
function RatingBar({ label, value }: { label: string; value: string }) { return <div className="rating-bar"><span>{label}</span><i><b style={{ width: value }} /></i><small>{value}</small></div>; }
function ReviewCard({ initials, name, rating, date, vehicle, text }: { initials: string; name: string; rating: number; date: string; vehicle: string; text: string }) { return <div className="review-card"><div className="review-head"><div className="row-avatar">{initials}</div><div><strong>{name}</strong><span>{date} · {vehicle}</span></div><div className="review-stars">{'★'.repeat(rating)}</div></div><p>“{text}”</p></div>; }
function EyeIcon() { return <span className="eye-icon">◉</span>; }
function PasteIcon() { return <span className="paste-icon">⌁</span>; }
function WrenchIcon() { return <span className="wrench-icon">⌁</span>; }

export default App;
