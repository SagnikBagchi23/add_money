import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type Currency = 'INR' | 'USD';
type Theme = 'dark' | 'light';
type DeviceId = 'iphone6' | 'iphone15';
type IterationId = 'iter1' | 'iter2' | 'iter3';

// ─── Icons (Private Use Area — computed at runtime for encoding safety) ───────

const IC = {
  arrowLeft:   String.fromCharCode(0xEA1B),
  arrowUpDown: String.fromCharCode(0xEA24),
  infoCircle:  String.fromCharCode(0xEADB),
  arrowRight:  String.fromCharCode(0xEA1D),
  delete:      String.fromCharCode(0xEA8A),
};

// ─── Theme Colors ─────────────────────────────────────────────────────────────

type ColorSet = {
  bgPrimary: string;
  bgTertiary: string;
  bgDisabled: string;
  bgSurfaceZ1: string;
  bgSurfaceZ2: string;
  border: string;
  borderOnSurfaceZ1: string;
  contentPrimary: string;
  contentSecondary: string;
  contentAccent: string;
  contentNegative: string;
  contentDisabled: string;
  contentOnColour: string;
  numpadText: string;
  phoneBorder: string;
};

const THEME_COLORS: Record<Theme, ColorSet> = {
  dark: {
    bgPrimary:        '#060809',
    bgTertiary:       '#1E2224',
    bgDisabled:       '#151819',
    bgSurfaceZ1:      '#151819',
    bgSurfaceZ2:      '#1E2224',
    border:           '#252A2C',
    borderOnSurfaceZ1:'#2D3133',
    contentPrimary:   '#F2F5F7',
    contentSecondary: '#989EA0',
    contentAccent:    '#04B488',
    contentNegative:  '#F04B4B',
    contentDisabled:  '#44494B',
    contentOnColour:  '#F2F5F7',
    numpadText:       '#EAEFF1',
    phoneBorder:      'rgba(255,255,255,0.13)',
  },
  light: {
    bgPrimary:        '#FFFFFF',
    bgTertiary:       '#F2F5F7',
    bgDisabled:       '#F7F7F7',
    bgSurfaceZ1:      '#FFFFFF',
    bgSurfaceZ2:      '#FFFFFF',
    border:           '#DDE1E4',
    borderOnSurfaceZ1:'#E7E8E9',
    contentPrimary:   '#0D1216',
    contentSecondary: '#5D6668',
    contentAccent:    '#00A377',
    contentNegative:  '#D12C2C',
    contentDisabled:  '#BABBBC',
    contentOnColour:  '#FFFFFF',
    numpadText:       '#0D1216',
    phoneBorder:      'rgba(0,0,0,0.14)',
  },
};

const SHELL_BG: Record<Theme, string> = { dark: '#0B0D0F', light: '#D4D9DF' };

// ─── Device Configs ───────────────────────────────────────────────────────────

type DeviceConfig = {
  name: string;
  screenW: number;
  screenH: number;
  cornerRadius: number;
  hasDynamicIsland: boolean;
  hasNotch: boolean;
  statusBarH: number;
  homeIndicatorH: number;
  numpadPadV: number;
  numpadRowH: number;
  toggleMarginV: number;
  pillTopGap: number;
  ctaPaddingBottom: number;
  amountFontSize: number;
  amountLineHeight: number;
  lockupGap: number;
  lockupMarginTop: number;
  pillHeight: number;
  pillFontSize: number;
  pillPadH: number;
  iter3InputFontSize: number;
  iter3InputLineHeight: number;
  iter3OutputFontSize: number;
  iter3OutputLineHeight: number;
};

const DEVICES: Record<DeviceId, DeviceConfig> = {
  iphone6: {
    name: 'iPhone 6',
    screenW: 375,
    screenH: 667,
    cornerRadius: 16,
    hasDynamicIsland: false,
    hasNotch: false,
    statusBarH: 44,
    homeIndicatorH: 0,
    numpadPadV: 8,
    numpadRowH: 40,
    toggleMarginV: -4,
    pillTopGap: 8,
    ctaPaddingBottom: 8,
    amountFontSize: 32,
    amountLineHeight: 40,
    lockupGap: 12,
    lockupMarginTop: -24,
    pillHeight: 28,
    pillFontSize: 11,
    pillPadH: 10,
    iter3InputFontSize: 24,
    iter3InputLineHeight: 32,
    iter3OutputFontSize: 18,
    iter3OutputLineHeight: 24,
  },
  iphone15: {
    name: 'iPhone 15',
    screenW: 393,
    screenH: 852,
    cornerRadius: 47,
    hasDynamicIsland: true,
    hasNotch: false,
    statusBarH: 59,
    homeIndicatorH: 34,
    numpadPadV: 16,
    numpadRowH: 48,
    toggleMarginV: -8,
    pillTopGap: 4,
    ctaPaddingBottom: 0,
    amountFontSize: 40,
    amountLineHeight: 48,
    lockupGap: 24,
    lockupMarginTop: -40,
    pillHeight: 32,
    pillFontSize: 12,
    pillPadH: 12,
    iter3InputFontSize: 28,
    iter3InputLineHeight: 36,
    iter3OutputFontSize: 20,
    iter3OutputLineHeight: 28,
  },
};

// ─── Iterations ───────────────────────────────────────────────────────────────

const ITERATIONS: Record<IterationId, { name: string }> = {
  iter1: { name: 'Iteration 1' },
  iter2: { name: 'Iteration 2' },
  iter3: { name: 'Iteration 3' },
};

// ─── App Data ─────────────────────────────────────────────────────────────────

const EXCHANGE_RATE = 96.71;
const AVAILABLE_INR = 143250; // random value above 1L
const MIN_USD = 100;
const MIN_INR = Math.ceil(MIN_USD * EXCHANGE_RATE);

const NUMPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

const PILLS: Record<Currency, { label: string; value: string }[]> = {
  INR: [
    { label: '+₹10,000', value: '10000' },
    { label: '+₹20,000', value: '20000' },
    { label: '+₹50,000', value: '50000' },
  ],
  USD: [
    { label: '+$100', value: '100' },
    { label: '+$200', value: '200' },
    { label: '+$500', value: '500' },
  ],
};

function buildDisplayAmount(raw: string, currency: Currency): string {
  const sym = currency === 'INR' ? '₹' : '$';
  if (!raw) return sym;
  const [intStr, decStr] = raw.split('.');
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const intFormatted = parseInt(intStr || '0', 10).toLocaleString(locale);
  if (decStr !== undefined) return `${sym}${intFormatted}.${decStr}`;
  return `${sym}${intFormatted}`;
}

function buildConversionValue(raw: string, currency: Currency): string {
  const num = parseFloat(raw || '0');
  if (currency === 'INR') {
    return `$${(num / EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${(num * EXCHANGE_RATE).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function buildConversion(raw: string, currency: Currency): string {
  return `You will get ${buildConversionValue(raw, currency)}`;
}

function computeToggleRaw(raw: string, fromCurrency: Currency): string {
  if (!raw) return '';
  const num = parseFloat(raw);
  if (!num) return '';
  if (fromCurrency === 'INR') return String(Math.round(num / EXCHANGE_RATE));
  return String(Math.round(num * EXCHANGE_RATE));
}

// Fires when the user has committed their integer part (typed a decimal)
// OR paused for 2 seconds with a below-minimum value. Stays true until input is cleared.
function getValidationError(raw: string, currency: Currency, showValidation: boolean): string | null {
  if (!raw) return null;
  if (!showValidation) return null;
  const num = parseFloat(raw);
  if (!num) return null;
  const usdValue = currency === 'USD' ? num : num / EXCHANGE_RATE;
  if (usdValue < MIN_USD) {
    return currency === 'INR'
      ? `Minimum ₹${MIN_INR.toLocaleString('en-IN')}`
      : `Minimum $${MIN_USD}`;
  }
  return null;
}

// ─── Animated Amount Character (Emil Kowalski / number-flow style) ───────────
// Each character clips to its own lineHeight box; new characters slide up from
// below the clip edge (translateY: lineHeight → 0) with a simultaneous fade.
// Key = "${position}-${char}" so only genuinely new/changed chars remount+animate.

function AmountChar({ ch, color, fontSize, lineHeight }: {
  ch: string; color: string; fontSize: number; lineHeight: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(anim, {
      toValue: 1,
      duration: 80,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, []);
  return (
    <View style={{ overflow: 'hidden', height: lineHeight }}>
      <Animated.View style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [lineHeight * 0.5, 0] }) }],
      }}>
        <Text style={{ fontFamily: 'Sohne-Kraftig', fontSize, lineHeight, color }}>{ch}</Text>
      </Animated.View>
    </View>
  );
}

function getNewCharIndices(prev: string, curr: string): Set<number> {
  const freq = new Map<string, number>();
  for (const ch of prev) freq.set(ch, (freq.get(ch) || 0) + 1);
  const indices = new Set<number>();
  for (let i = 0; i < curr.length; i++) {
    const ch = curr[i];
    const rem = freq.get(ch) || 0;
    if (rem > 0) freq.set(ch, rem - 1);
    else indices.add(i);
  }
  return indices;
}

// ─── Pressable Pill (Emil-style spring scale + pressed fill) ─────────────────

function PressablePill({ label, onPress, borderColor, bgColor, pressedBgColor, textColor, height, fontSize, padH, disabled }: {
  label: string; onPress: () => void;
  borderColor: string; bgColor: string; pressedBgColor: string; textColor: string;
  height?: number; fontSize?: number; padH?: number; disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const pressIn = () => {
    if (disabled) return;
    setPressed(true);
    Animated.spring(scale, { toValue: 0.95, tension: 400, friction: 30, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    if (disabled) return;
    setPressed(false);
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 14, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.4 : 1 }}>
      <TouchableOpacity
        style={[s.pill, { borderColor, backgroundColor: pressed ? pressedBgColor : bgColor, height: height || 32, paddingHorizontal: padH || 12 }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        <Text style={[s.pillText, { color: textColor, fontSize: fontSize || 12 }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function PressableToggle({ onPress, disabled, toggleMarginV, colors }: {
  onPress: () => void; disabled: boolean; toggleMarginV: number;
  colors: ColorSet;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const pressIn = () => {
    setPressed(true);
    Animated.spring(scale, { toValue: 0.85, tension: 400, friction: 30, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    setPressed(false);
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 14, useNativeDriver: true }).start();
  };
  const bg = disabled ? colors.bgDisabled : pressed ? colors.bgTertiary : colors.bgTertiary;
  const fg = disabled ? colors.contentDisabled : colors.contentSecondary;
  return (
    <Animated.View style={{ transform: [{ scale }], marginVertical: toggleMarginV }}>
      <TouchableOpacity
        style={[s.toggleBtn, { backgroundColor: bg }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        <Text style={[s.toggleIcon, { color: fg }]}>{IC.arrowUpDown}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Status Bar Icon Sub-Components ──────────────────────────────────────────

function SignalBars({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 12, gap: 2 }}>
      {[4, 7, 10, 12].map((h, i) => (
        <View key={i} style={{ width: 3, height: h, backgroundColor: color, borderRadius: 0.75 }} />
      ))}
    </View>
  );
}

function BatteryIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: 24, height: 12, borderRadius: 3,
        borderWidth: 1.2, borderColor: color, padding: 2,
      }}>
        <View style={{ flex: 1, width: '78%', backgroundColor: color, borderRadius: 1 }} />
      </View>
      <View style={{ width: 1.5, height: 5, backgroundColor: color, opacity: 0.45, marginLeft: 1, borderRadius: 1 }} />
    </View>
  );
}

// ─── Phone Chrome Components ──────────────────────────────────────────────────

function PhoneStatusBar({
  device, iconColor, bgColor,
}: { device: DeviceConfig; iconColor: string; bgColor: string }) {
  if (device.hasDynamicIsland) {
    return (
      <View style={{
        height: device.statusBarH, backgroundColor: bgColor,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 14,
      }}>
        <Text style={{ fontFamily: 'GrowwSans-Medium', fontSize: 15, lineHeight: 20, color: iconColor, letterSpacing: 0.1 }}>
          9:41
        </Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{
            width: 126, height: 36, backgroundColor: '#000', borderRadius: 99,
            borderWidth: 1, borderColor: 'rgba(120,120,120,0.18)',
          }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SignalBars color={iconColor} />
          <BatteryIcon color={iconColor} />
        </View>
      </View>
    );
  }

  if (device.hasNotch) {
    // iPhone 14-style: notch centered, time on left, icons on right
    return (
      <View style={{
        height: device.statusBarH, backgroundColor: bgColor,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 14,
      }}>
        <Text style={{ fontFamily: 'GrowwSans-Medium', fontSize: 15, lineHeight: 20, color: iconColor, letterSpacing: 0.1 }}>
          9:41
        </Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {/* Notch */}
          <View style={{
            width: 130, height: 34, backgroundColor: '#000', borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
            marginTop: -14,
          }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SignalBars color={iconColor} />
          <BatteryIcon color={iconColor} />
        </View>
      </View>
    );
  }

  // iPhone SE: earpiece + traditional status bar
  return (
    <View style={{ height: device.statusBarH, backgroundColor: bgColor, paddingTop: 8 }}>
      <View style={{
        width: 96, height: 5, backgroundColor: '#000', opacity: 0.45,
        borderRadius: 3, alignSelf: 'center', marginBottom: 5,
      }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
        <Text style={{ fontFamily: 'GrowwSans-Medium', fontSize: 12, lineHeight: 16, color: iconColor }}>
          9:41
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <SignalBars color={iconColor} />
          <BatteryIcon color={iconColor} />
        </View>
      </View>
    </View>
  );
}

function PhoneHomeIndicator({ device, color, bgColor }: { device: DeviceConfig; color: string; bgColor?: string }) {
  if (device.homeIndicatorH === 0) return null;
  return (
    <View style={{ height: device.homeIndicatorH, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, backgroundColor: bgColor || 'transparent' }}>
      <View style={{ width: 134, height: 5, backgroundColor: color, opacity: 0.28, borderRadius: 99 }} />
    </View>
  );
}

// ─── Control Panel (web only) ─────────────────────────────────────────────────

function ControlPanel({
  theme, onTheme, deviceId, onDevice, iterationId, onIteration,
}: {
  theme: Theme; onTheme: (t: Theme) => void;
  deviceId: DeviceId; onDevice: (d: DeviceId) => void;
  iterationId: IterationId; onIteration: (i: IterationId) => void;
}) {
  return (
    <View style={cp.panel}>
      {/* Appearance */}
      <View style={cp.section}>
        <Text style={cp.sectionLabel}>APPEARANCE</Text>
        <View style={cp.segmentRow}>
          {(['dark', 'light'] as Theme[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[cp.segBtn, theme === t && cp.segBtnActive]}
              onPress={() => onTheme(t)}
              activeOpacity={0.7}
            >
              <Text style={cp.segBtnIcon}>
                {t === 'dark' ? '🌙' : '☀️'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Device */}
      <View style={cp.section}>
        <Text style={cp.sectionLabel}>DEVICE</Text>
        <View style={{ gap: 3 }}>
          {(Object.entries(DEVICES) as [DeviceId, DeviceConfig][]).map(([id, cfg]) => (
            <TouchableOpacity
              key={id}
              style={[cp.deviceBtn, deviceId === id && cp.deviceBtnActive]}
              onPress={() => onDevice(id)}
              activeOpacity={0.7}
            >
              <View style={[cp.phoneIcon, deviceId === id && cp.phoneIconActive]}>
                <View style={[cp.phoneIconHome, deviceId === id && cp.phoneIconHomeActive]} />
              </View>
              <View>
                <Text style={[cp.deviceName, deviceId === id && cp.deviceNameActive]}>
                  {cfg.name}
                </Text>
                <Text style={cp.deviceMeta}>
                  {cfg.screenW} × {cfg.screenH}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Iteration */}
      <View style={cp.section}>
        <Text style={cp.sectionLabel}>ITERATION</Text>
        <View style={{ gap: 3 }}>
          {(Object.entries(ITERATIONS) as [IterationId, { name: string }][]).map(([id, cfg]) => (
            <TouchableOpacity
              key={id}
              style={[cp.deviceBtn, iterationId === id && cp.deviceBtnActive]}
              onPress={() => onIteration(id)}
              activeOpacity={0.7}
            >
              <View style={[cp.iterDot, iterationId === id && cp.iterDotActive]} />
              <Text style={[cp.deviceName, iterationId === id && cp.deviceNameActive]}>
                {cfg.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const cp = StyleSheet.create({
  panel: {
    width: 188,
    backgroundColor: '#161A1C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 44,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: 'Sohne-Kraftig',
    fontSize: 10,
    lineHeight: 14,
    color: '#5D6668',
    letterSpacing: 0.9,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#0C0E0F',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segBtn: {
    flex: 1, height: 32, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  segBtnActive: { backgroundColor: '#2D3236' },
  segBtnIcon: { fontSize: 16, lineHeight: 22 },
  deviceBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10,
  },
  deviceBtnActive: { backgroundColor: '#252A2C' },
  phoneIcon: {
    width: 18, height: 28, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#3D4446',
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3,
  },
  phoneIconActive: { borderColor: '#989EA0' },
  phoneIconHome: {
    width: 8, height: 2, backgroundColor: '#3D4446', borderRadius: 1, opacity: 0.6,
  },
  phoneIconHomeActive: { backgroundColor: '#989EA0' },
  deviceName: { fontFamily: 'Sohne-Kraftig', fontSize: 12, lineHeight: 16, color: '#5D6668' },
  deviceNameActive: { color: '#F2F5F7' },
  deviceMeta: { fontFamily: 'Sohne-Kraftig', fontSize: 10, lineHeight: 14, color: '#3D4446' },
  iterDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#3D4446', marginHorizontal: 5,
  },
  iterDotActive: { backgroundColor: '#989EA0' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const IS_WEB = Platform.OS === 'web';

export default function AddMoneyScreen() {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [raw, setRaw] = useState('');
  const [theme, setTheme] = useState<Theme>('dark');
  const [deviceId, setDeviceId] = useState<DeviceId>('iphone15');
  const [iterationId, setIterationId] = useState<IterationId>('iter1');
  const [showValidation, setShowValidation] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [iter3ActiveField, setIter3ActiveField] = useState<'top' | 'bottom'>('bottom');
  const sheetOverlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;
  const prevDisplayRef = useRef('');
  const prevRawRef = useRef('');
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  const C = IS_WEB ? THEME_COLORS[theme] : THEME_COLORS.dark;
  const device = IS_WEB ? DEVICES[deviceId] : DEVICES.iphone15;
  const iconColor = (IS_WEB && theme === 'light') ? '#0D1216' : '#FFFFFF';

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    if (!raw) { setShowValidation(false); prevRawRef.current = raw; return; }
    if (showValidation) { prevRawRef.current = raw; return; }
    if (raw.includes('.')) { setShowValidation(true); prevRawRef.current = raw; return; }
    const isDeleting = raw.length < prevRawRef.current.length;
    prevRawRef.current = raw;
    if (isDeleting) { setShowValidation(true); return; }
    const t = setTimeout(() => setShowValidation(true), 1000);
    return () => clearTimeout(t);
  }, [raw, showValidation]);

  const onKey = useCallback(
    (key: string) => {
      if (key === 'back') { setRaw((p) => p.slice(0, -1)); return; }
      if (key === '.') {
        if (raw.includes('.')) return;
        setRaw((p) => (p === '' ? '0.' : p + '.'));
        return;
      }
      const [intPart, decPart] = raw.split('.');
      if (decPart !== undefined && decPart.length >= 2) return;
      if (!raw.includes('.') && intPart.length >= 8) return;
      setRaw((p) => p + key);
    },
    [raw]
  );

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetCurrency, setSheetCurrency] = useState<Currency>('INR');

  const openSheet = useCallback(() => {
    setSheetCurrency('INR');
    setSheetVisible(true);
    setShowSheet(true);
    sheetOverlayOpacity.setValue(0);
    sheetTranslateY.setValue(400);
    Animated.parallel([
      Animated.timing(sheetOverlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(sheetTranslateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetOverlayOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 400, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      setSheetVisible(false);
      setShowSheet(false);
    });
  }, []);

  const onToggle = () => {
    if (validationError) return;
    const newCurrency: Currency = currency === 'INR' ? 'USD' : 'INR';
    const newRaw = computeToggleRaw(raw, currency);
    setCurrency(newCurrency);
    setRaw(newRaw);
    setShowValidation(false);
  };

  const displayAmount = buildDisplayAmount(raw, currency);
  const conversionValue = buildConversionValue(raw, currency);
  const conversionText = buildConversion(raw, currency);
  const validationError = getValidationError(raw, currency, showValidation);
  const pills = PILLS[currency];

  const newCharIndices = getNewCharIndices(prevDisplayRef.current, displayAmount);
  useEffect(() => { prevDisplayRef.current = displayAmount; }, [displayAmount]);

  const numericValue = parseFloat(raw || '0');
  const usdEquivalent = currency === 'USD' ? numericValue : numericValue / EXCHANGE_RATE;
  const ctaEnabled = usdEquivalent >= MIN_USD;
  const maxValue = currency === 'INR' ? AVAILABLE_INR : Math.floor(AVAILABLE_INR / EXCHANGE_RATE);
  const isMaxed = raw === String(maxValue);

  const screenContent = (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.bgPrimary} />

      {/* Top App Bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.iconBtn}>
          <Text style={[s.iconText, { color: C.contentPrimary }]}>{IC.arrowLeft}</Text>
        </TouchableOpacity>
        <View style={s.topBarCenter}>
          <Text style={[s.topTitle, { color: C.contentPrimary }]}>Add money</Text>
          <Text style={[s.topSubtitle, { color: C.contentSecondary }]}>
            {currency === 'INR'
              ? `₹${AVAILABLE_INR.toLocaleString('en-IN')} available`
              : `$${(AVAILABLE_INR / EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available`}
          </Text>
        </View>
        <View style={s.iconBtn} />
      </View>

      {/* Amount Zone */}
      <View style={s.amountZone}>
        <View style={s.amountCenterWrap}>
          {iterationId === 'iter3' ? (
            <View style={[s.amountLockup, { gap: 8, marginTop: device.lockupMarginTop, width: '100%', paddingHorizontal: 16 }]}>
              {/* Top card */}
              {iter3ActiveField === 'top' ? (
                <View style={[s.fieldCard, { borderWidth: 1, borderColor: C.contentSecondary }]}>
                  <View style={s.fieldCardRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {displayAmount.split('').map((ch, i) =>
                        newCharIndices.has(i) ? (
                          <AmountChar key={`${i}-${ch}-a`} ch={ch} color={C.contentPrimary} fontSize={device.iter3InputFontSize} lineHeight={device.iter3InputLineHeight} />
                        ) : (
                          <Text key={`${i}-${ch}`} style={{ fontFamily: 'Sohne-Kraftig', fontSize: device.iter3InputFontSize, lineHeight: device.iter3InputLineHeight, color: C.contentPrimary }}>{ch}</Text>
                        )
                      )}
                      <Animated.View style={[s.cursor, { opacity: cursorOpacity, backgroundColor: C.contentAccent, height: device.iter3InputLineHeight }]} />
                    </View>
                    <TouchableOpacity style={[s.maxPill, { borderColor: C.border }]} onPress={() => { const maxVal = currency === 'INR' ? AVAILABLE_INR : Math.floor(AVAILABLE_INR / EXCHANGE_RATE); setRaw(String(maxVal)); }} activeOpacity={0.7}>
                      <Text style={{ fontFamily: 'GrowwSans-Medium', fontSize: 11, lineHeight: 16, color: C.contentSecondary }}>Max</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity activeOpacity={0.8} onPress={() => { onToggle(); setIter3ActiveField('top'); }}>
                  <View style={[s.fieldCard, { borderWidth: 1, borderColor: C.border }]}>
                    <View style={s.fieldCardRow}>
                      <Text style={{ fontFamily: 'Sohne-Kraftig', fontSize: device.iter3InputFontSize, lineHeight: device.iter3InputLineHeight, color: C.contentPrimary, flex: 1 }}>
                        {conversionValue || (currency === 'INR' ? '$0' : '₹0')}
                      </Text>
                      <TouchableOpacity onPress={openSheet} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ fontFamily: 'GrowwHugeStandard', fontSize: 16, lineHeight: 20, color: C.contentSecondary }}>{IC.infoCircle}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Bottom card */}
              {iter3ActiveField === 'bottom' ? (
                <View style={[s.fieldCard, { borderWidth: 1, borderColor: C.contentSecondary }]}>
                  <View style={s.fieldCardRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {displayAmount.split('').map((ch, i) =>
                        newCharIndices.has(i) ? (
                          <AmountChar key={`${i}-${ch}-a`} ch={ch} color={C.contentPrimary} fontSize={device.iter3InputFontSize} lineHeight={device.iter3InputLineHeight} />
                        ) : (
                          <Text key={`${i}-${ch}`} style={{ fontFamily: 'Sohne-Kraftig', fontSize: device.iter3InputFontSize, lineHeight: device.iter3InputLineHeight, color: C.contentPrimary }}>{ch}</Text>
                        )
                      )}
                      <Animated.View style={[s.cursor, { opacity: cursorOpacity, backgroundColor: C.contentAccent, height: device.iter3InputLineHeight }]} />
                    </View>
                    <TouchableOpacity style={[s.maxPill, { borderColor: C.border }]} onPress={() => { const maxVal = currency === 'INR' ? AVAILABLE_INR : Math.floor(AVAILABLE_INR / EXCHANGE_RATE); setRaw(String(maxVal)); }} activeOpacity={0.7}>
                      <Text style={{ fontFamily: 'GrowwSans-Medium', fontSize: 11, lineHeight: 16, color: C.contentSecondary }}>Max</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity activeOpacity={0.8} onPress={() => { onToggle(); setIter3ActiveField('bottom'); }}>
                  <View style={[s.fieldCard, { borderWidth: 1, borderColor: C.border }]}>
                    <View style={s.fieldCardRow}>
                      <Text style={{ fontFamily: 'Sohne-Kraftig', fontSize: device.iter3InputFontSize, lineHeight: device.iter3InputLineHeight, color: C.contentPrimary, flex: 1 }}>
                        {conversionValue || (currency === 'INR' ? '$0' : '₹0')}
                      </Text>
                      <TouchableOpacity onPress={openSheet} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ fontFamily: 'GrowwHugeStandard', fontSize: 16, lineHeight: 20, color: C.contentSecondary }}>{IC.infoCircle}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Validation error */}
              {validationError && (
                <View style={{ marginTop: 8, alignItems: 'center' }}>
                  <Text style={[s.conversionText, { color: C.contentNegative }]}>{validationError}</Text>
                </View>
              )}

              <View style={[s.pillRow, { marginTop: device.pillTopGap + 16 }]}>
                {pills.map(({ label, value }) => (
                  <PressablePill
                    key={label}
                    label={label}
                    borderColor={C.border}
                    bgColor={'transparent'}
                    pressedBgColor={C.bgTertiary}
                    textColor={C.contentPrimary}
                    height={device.pillHeight}
                    fontSize={device.pillFontSize}
                    padH={device.pillPadH}
                    disabled={isMaxed}
                    onPress={() => {
                      const [intStr = '0', decStr] = (raw || '0').split('.');
                      const newInt = parseInt(intStr, 10) + parseInt(value, 10);
                      setRaw(decStr !== undefined ? `${newInt}.${decStr}` : String(newInt));
                    }}
                  />
                ))}
              </View>
            </View>
          ) : (
          <View style={[s.amountLockup, { gap: device.lockupGap, marginTop: device.lockupMarginTop }]}>
            <View style={s.amountRow}>
              {displayAmount.split('').map((ch, i) =>
                newCharIndices.has(i) ? (
                  <AmountChar
                    key={`${i}-${ch}-a`}
                    ch={ch}
                    color={C.contentPrimary}
                    fontSize={device.amountFontSize}
                    lineHeight={device.amountLineHeight}
                  />
                ) : (
                  <Text key={`${i}-${ch}`} style={{ fontFamily: 'Sohne-Kraftig', fontSize: device.amountFontSize, lineHeight: device.amountLineHeight, color: C.contentPrimary }}>{ch}</Text>
                )
              )}
              <Animated.View style={[s.cursor, { opacity: cursorOpacity, backgroundColor: C.contentAccent, height: device.amountLineHeight }]} />
            </View>
            {iterationId === 'iter1' && (
              <PressableToggle
                onPress={onToggle}
                disabled={!!validationError}
                toggleMarginV={device.toggleMarginV}
                colors={C}
              />
            )}
            <View style={[s.conversionRow, { height: 32, marginTop: iterationId === 'iter2' ? device.toggleMarginV : 0 }]}>
              {validationError
                ? <Text style={[s.conversionText, { color: C.contentNegative }]}>{validationError}</Text>
                : iterationId === 'iter2'
                  ? <>
                      <PressableToggle
                        onPress={onToggle}
                        disabled={!!validationError}
                        toggleMarginV={0}
                        colors={C}
                      />
                      <Text style={[s.conversionText, { color: C.contentSecondary, marginLeft: 4 }]}>You will receive </Text>
                      <TouchableOpacity activeOpacity={0.7} disabled={!!validationError} onPress={openSheet}>
                        <View style={{ paddingBottom: 1, borderBottomWidth: 1, borderBottomColor: C.contentSecondary, borderStyle: 'dashed' }}>
                          <Text style={[s.conversionText, { color: C.contentSecondary }]}>{conversionValue}</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  : <>
                      <Text style={[s.conversionText, { color: C.contentSecondary }]}>{conversionText}</Text>
                      <TouchableOpacity onPress={openSheet} activeOpacity={0.7}>
                        <Text style={[s.infoIcon, { color: C.contentSecondary }]}>{IC.infoCircle}</Text>
                      </TouchableOpacity>
                    </>
              }
            </View>
            <View style={[s.pillRow, { marginTop: device.pillTopGap }]}>
              {pills.map(({ label, value }) => (
                <PressablePill
                  key={label}
                  label={label}
                  borderColor={C.border}
                  bgColor={C.bgPrimary}
                  pressedBgColor={C.bgTertiary}
                  textColor={C.contentPrimary}
                  height={device.pillHeight}
                  fontSize={device.pillFontSize}
                  padH={device.pillPadH}
                  onPress={() => {
                    const [intStr = '0', decStr] = (raw || '0').split('.');
                    const newInt = parseInt(intStr, 10) + parseInt(value, 10);
                    setRaw(decStr !== undefined ? `${newInt}.${decStr}` : String(newInt));
                  }}
                />
              ))}
            </View>
          </View>
          )}
        </View>
        <Text style={[s.receiveByText, { color: C.contentSecondary }]}>
          Receive money by 5:00 PM, 19 Jun
        </Text>
      </View>

      {/* Payment Method Row */}
      <View style={[s.paymentRow, { borderColor: C.border }]}>
        <View style={s.bankLogoWrap}>
          <Image source={require('../assets/hdfc-bank.png')} style={s.bankLogo} resizeMode="cover" />
        </View>
        <View style={s.paymentInfo}>
          <Text style={[s.paymentTitle, { color: C.contentPrimary }]}>Net Banking (Remittance)</Text>
          <Text style={[s.paymentSub, { color: C.contentSecondary }]}>HDFC Bank ••••7080</Text>
        </View>
        <Text style={[s.chevronIcon, { color: C.contentSecondary }]}>{IC.arrowRight}</Text>
      </View>

      {/* Numpad */}
      <View style={[s.numpad, { paddingVertical: device.numpadPadV }]}>
        {NUMPAD_ROWS.map((row, ri) => (
          <View key={ri} style={[s.numpadRow, { height: device.numpadRowH }]}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={s.numpadKey}
                onPress={() => onKey(key)}
                activeOpacity={0.6}
              >
                {key === 'back'
                  ? <Text style={[s.numpadIcon, { color: C.numpadText }]}>{IC.delete}</Text>
                  : <Text style={[s.numpadDigit, { color: C.numpadText }]}>{key}</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* CTA Dock */}
      <View style={[s.ctaDock, { paddingBottom: device.ctaPaddingBottom }]}>
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: ctaEnabled ? C.contentAccent : C.bgDisabled }]}
            activeOpacity={1}
            disabled={!ctaEnabled}
            onPressIn={() => {
              if (!ctaEnabled) return;
              Animated.spring(ctaScale, { toValue: 0.95, tension: 400, friction: 30, useNativeDriver: true }).start();
            }}
            onPressOut={() => {
              Animated.spring(ctaScale, { toValue: 1, tension: 200, friction: 14, useNativeDriver: true }).start();
            }}
          >
            <Text style={[s.ctaText, { color: ctaEnabled ? '#FFFFFF' : C.contentDisabled }]}>Add money</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

    </>
  );

  const sheetContent = sheetVisible ? (
    <View style={s.sheetOverlay}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', opacity: sheetOverlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSheet} />
      </Animated.View>
      <Animated.View style={[s.sheetContainer, { backgroundColor: C.bgSurfaceZ1, transform: [{ translateY: sheetTranslateY }] }]}>
        <TouchableOpacity activeOpacity={1}>
        <View style={s.sheetTitleFrame}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[s.sheetTitle, { color: C.contentPrimary }]}>How was this calculated?</Text>
            </View>
            {iterationId === 'iter2' && (
              <View style={{ flexDirection: 'row', backgroundColor: C.bgTertiary, borderRadius: 8, padding: 2, marginLeft: 12, marginTop: 2 }}>
                {(['INR', 'USD'] as Currency[]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                      backgroundColor: sheetCurrency === c ? C.bgSurfaceZ1 : 'transparent',
                    }}
                    onPress={() => setSheetCurrency(c)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontFamily: 'GrowwSans-Medium', fontSize: 12, lineHeight: 18, color: sheetCurrency === c ? C.contentPrimary : C.contentSecondary }}>
                      {c === 'INR' ? '₹' : '$'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <Text style={[s.sheetSubtitle, { color: C.contentSecondary }]}>
            $1 = ₹{EXCHANGE_RATE.toFixed(4)}. Rates will refresh in 29:49
          </Text>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
          <View style={[s.sheetCard, { backgroundColor: C.bgSurfaceZ2, borderColor: C.borderOnSurfaceZ1 }]}>
            {(() => {
              const inrVal = currency === 'INR' ? numericValue : numericValue * EXCHANGE_RATE;
              const usdVal = currency === 'USD' ? numericValue : numericValue / EXCHANGE_RATE;
              const showInr = iterationId === 'iter2' ? sheetCurrency === 'INR' : true;
              const transferringText = showInr
                ? `₹${inrVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                : `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              const chargesText = showInr ? '₹45' : `$${(45 / EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              const creditedInr = Math.max(0, inrVal - 45);
              const creditedUsd = Math.max(0, creditedInr / EXCHANGE_RATE);
              const creditedText = showInr
                ? `₹${creditedInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                : `$${creditedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              return (
                <>
                  <View style={s.sheetRow}>
                    <Text style={[s.sheetLabel, { color: C.contentSecondary }]}>You are transferring</Text>
                    <Text style={[s.sheetValue, { color: C.contentPrimary }]}>{transferringText}</Text>
                  </View>
                  <View style={s.sheetRow}>
                    <Text style={[s.sheetLabel, { color: C.contentSecondary }]}>Charges</Text>
                    <Text style={[s.sheetValue, { color: C.contentPrimary }]}>{chargesText}</Text>
                  </View>
                  <View style={[s.sheetDivider, { backgroundColor: C.borderOnSurfaceZ1 }]} />
                  <View style={s.sheetRow}>
                    <Text style={[s.sheetLabel, { color: C.contentSecondary }]}>Amount to be credited</Text>
                    {iterationId === 'iter1' ? (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[s.sheetValue, { color: C.contentPrimary }]}>
                          {`₹${creditedInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        </Text>
                        <Text style={{ fontFamily: 'GrowwSans-Regular', fontSize: 12, lineHeight: 18, color: C.contentSecondary }}>
                          {`$${creditedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[s.sheetValue, { color: C.contentPrimary }]}>{creditedText}</Text>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={[s.sheetDisclaimer, { color: C.contentSecondary }]}>
            GST and forex rate is indicative and can vary slightly once order is confirmed. TCS, if applicable, will be charged on the amount you are transferring.
          </Text>
        </View>
        <View style={[s.ctaDock, { paddingBottom: 16 }]}>
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: C.contentAccent }]}
            onPress={closeSheet}
            activeOpacity={0.8}
          >
            <Text style={[s.ctaText, { color: C.contentOnColour }]}>Okay</Text>
          </TouchableOpacity>
        </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  ) : null;

  // ── Web ────────────────────────────────────────────────────────────────────
  if (IS_WEB) {
    const artboardLabelColor = theme === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)';
    return (
      <View style={{ flex: 1, backgroundColor: SHELL_BG[theme] }}>
        {/* Phone + artboard label — centered on canvas */}
        <View style={s.webShell}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: device.screenW,
              height: device.screenH,
              backgroundColor: C.bgPrimary,
              borderRadius: device.cornerRadius,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: C.phoneBorder,
            }}>
              <PhoneStatusBar device={device} iconColor={iconColor} bgColor={C.bgPrimary} />
              <View style={{ flex: 1 }}>
                {screenContent}
              </View>
              <PhoneHomeIndicator device={device} color={iconColor} bgColor={sheetVisible ? C.bgSurfaceZ1 : undefined} />
              {sheetContent}
            </View>
            {/* Artboard label */}
            <Text style={{
              fontFamily: 'Sohne-Kraftig',
              fontSize: 11,
              lineHeight: 16,
              color: artboardLabelColor,
              marginTop: 10,
              letterSpacing: 0.2,
            }}>
              {ITERATIONS[iterationId].name}{'  ·  '}{device.name}
            </Text>
          </View>
        </View>

        {/* Control panel — fixed at extreme left of viewport */}
        <View style={{ position: 'absolute', left: 20, top: 0, bottom: 0, justifyContent: 'center' }}>
          <ControlPanel
            theme={theme}
            onTheme={setTheme}
            deviceId={deviceId}
            onDevice={setDeviceId}
            iterationId={iterationId}
            onIteration={setIterationId}
          />
        </View>
      </View>
    );
  }

  // ── Native ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: THEME_COLORS.dark.bgPrimary }]}>
      {screenContent}
      <View style={s.homeIndicator}>
        <View style={[s.homeHandle, { backgroundColor: THEME_COLORS.dark.contentSecondary }]} />
      </View>
      {sheetContent}
    </SafeAreaView>
  );
}

// ─── StyleSheet (layout — colors applied inline) ──────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1 },

  webShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topTitle: { fontFamily: 'GrowwSans-Medium', fontSize: 14, lineHeight: 20 },
  topSubtitle: { fontFamily: 'GrowwSans-Regular', fontSize: 12, lineHeight: 18 },
  iconText: { fontFamily: 'GrowwHugeStandard', fontSize: 20, lineHeight: 24 },

  amountZone: { flex: 1 },
  amountCenterWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  amountLockup: { alignItems: 'center', gap: 12, marginTop: -24 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountText: { fontFamily: 'Sohne-Kraftig', fontSize: 40, lineHeight: 48 },
  cursor: { width: 2, height: 48, marginLeft: 3 },
  toggleBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggleIcon: { fontFamily: 'GrowwHugeStandard', fontSize: 12, lineHeight: 14 },
  conversionRow: { flexDirection: 'row', alignItems: 'center' },
  conversionText: { fontFamily: 'GrowwSans-Regular', fontSize: 14, lineHeight: 20 },
  infoIcon: { fontFamily: 'GrowwHugeStandard', fontSize: 16, marginLeft: 4, lineHeight: 20 },
  pillRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: 99, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: 'GrowwSans-Medium', lineHeight: 18 },
  receiveByText: { fontFamily: 'GrowwSans-Regular', fontSize: 12, lineHeight: 16, textAlign: 'center', position: 'absolute', bottom: 12, left: 0, right: 0 },

  fieldCard: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, width: '100%' },
  fieldCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  maxPill: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },

  paymentRow: {
    height: 72, flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderBottomWidth: 1,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  bankLogoWrap: { width: 40, height: 40, borderRadius: 8, overflow: 'hidden' },
  bankLogo: { width: 40, height: 40 },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontFamily: 'GrowwSans-Medium', fontSize: 14, lineHeight: 20 },
  paymentSub: { fontFamily: 'GrowwSans-Regular', fontSize: 12, lineHeight: 18 },
  chevronIcon: { fontFamily: 'GrowwHugeStandard', fontSize: 20, lineHeight: 24 },

  numpad: { paddingHorizontal: 16, gap: 8 },
  numpadRow: { flexDirection: 'row', height: 48, gap: 8 },
  numpadKey: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  numpadDigit: { fontFamily: 'Sohne-Kraftig', fontSize: 28, lineHeight: 36, textAlign: 'center' },
  numpadIcon: { fontFamily: 'GrowwHugeStandard', fontSize: 26, lineHeight: 32 },

  ctaDock: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 },
  ctaBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: 'GrowwSans-Medium', fontSize: 16, lineHeight: 24 },

  homeIndicator: { height: 20, alignItems: 'center', justifyContent: 'center' },
  homeHandle: { width: 108, height: 2, borderRadius: 12 },

  sheetOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden',
  },
  sheetTitleFrame: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, gap: 2 },
  sheetTitle: { fontFamily: 'Sohne-Kraftig', fontSize: 18, lineHeight: 28 },
  sheetSubtitle: { fontFamily: 'GrowwSans-Regular', fontSize: 14, lineHeight: 20 },
  sheetCard: {
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, gap: 16,
  },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetLabel: { fontFamily: 'GrowwSans-Regular', fontSize: 14, lineHeight: 20 },
  sheetValue: { fontFamily: 'GrowwSans-Medium', fontSize: 14, lineHeight: 20 },
  sheetDivider: { height: 1, width: '100%' },
  sheetDisclaimer: { fontFamily: 'GrowwSans-Regular', fontSize: 12, lineHeight: 18 },
});
