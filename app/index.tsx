import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type Currency = 'INR' | 'USD';
type Theme = 'dark' | 'light';
type DeviceId = 'se' | 'iphone6' | 'iphone15';
type IterationId = 'iter1';

// ─── Icons (Private Use Area — computed at runtime for encoding safety) ───────

const IC = {
  arrowLeft:   String.fromCharCode(0xEA1B),
  arrowUpDown: String.fromCharCode(0xEA24),
  infoCircle:  String.fromCharCode(0xEADB),
  arrowRight:  String.fromCharCode(0xEA1D),
  delete:      String.fromCharCode(0xEA89),
};

// ─── Theme Colors ─────────────────────────────────────────────────────────────

type ColorSet = {
  bgPrimary: string;
  bgTertiary: string;
  border: string;
  contentPrimary: string;
  contentSecondary: string;
  contentAccent: string;
  numpadText: string;
  phoneBorder: string;
};

const THEME_COLORS: Record<Theme, ColorSet> = {
  dark: {
    bgPrimary:       '#060809',
    bgTertiary:      '#1E2224',
    border:          '#252A2C',
    contentPrimary:  '#F2F5F7',
    contentSecondary:'#989EA0',
    contentAccent:   '#04B488',
    numpadText:      '#EAEFF1',
    phoneBorder:     'rgba(255,255,255,0.13)',
  },
  light: {
    bgPrimary:       '#FFFFFF',
    bgTertiary:      '#F2F5F7',
    border:          '#DDE1E4',
    contentPrimary:  '#0D1216',
    contentSecondary:'#5D6668',
    contentAccent:   '#00A377',
    numpadText:      '#0D1216',
    phoneBorder:     'rgba(0,0,0,0.14)',
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
  amountFontSize: number;
  amountLineHeight: number;
  lockupGap: number;
};

const DEVICES: Record<DeviceId, DeviceConfig> = {
  se: {
    name: 'iPhone SE',
    screenW: 375,
    screenH: 667,
    cornerRadius: 22,
    hasDynamicIsland: false,
    hasNotch: false,
    statusBarH: 44,
    homeIndicatorH: 0,
    numpadPadV: 8,
    amountFontSize: 32,
    amountLineHeight: 40,
    lockupGap: 12,
  },
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
    amountFontSize: 32,
    amountLineHeight: 40,
    lockupGap: 12,
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
    amountFontSize: 40,
    amountLineHeight: 48,
    lockupGap: 24,
  },
};

// ─── Iterations ───────────────────────────────────────────────────────────────

const ITERATIONS: Record<IterationId, { name: string }> = {
  iter1: { name: 'Iteration 1' },
};

// ─── App Data ─────────────────────────────────────────────────────────────────

const EXCHANGE_RATE = 96.71;

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

function buildConversion(raw: string, currency: Currency): string {
  const num = parseFloat(raw || '0');
  if (currency === 'INR') {
    return `You will get $${(num / EXCHANGE_RATE).toFixed(2)}`;
  }
  return `You will get ₹${(num * EXCHANGE_RATE).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
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

function PhoneHomeIndicator({ device, color }: { device: DeviceConfig; color: string }) {
  if (device.homeIndicatorH === 0) return null;
  return (
    <View style={{ height: device.homeIndicatorH, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 }}>
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
    gap: 22,
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
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  const C = IS_WEB ? THEME_COLORS[theme] : THEME_COLORS.dark;
  const device = IS_WEB ? DEVICES[deviceId] : DEVICES.pro17;
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

  const onToggle = () => { setCurrency((p) => (p === 'INR' ? 'USD' : 'INR')); setRaw(''); };

  const displayAmount = buildDisplayAmount(raw, currency);
  const conversionText = buildConversion(raw, currency);
  const pills = PILLS[currency];

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
          <Text style={[s.topSubtitle, { color: C.contentSecondary }]}>₹0.00 available</Text>
        </View>
        <View style={s.iconBtn} />
      </View>

      {/* Amount Zone */}
      <View style={s.amountZone}>
        <View style={s.amountCenterWrap}>
          <View style={[s.amountLockup, { gap: device.lockupGap }]}>
            <View style={s.amountRow}>
              <Text style={[s.amountText, { color: C.contentPrimary, fontSize: device.amountFontSize, lineHeight: device.amountLineHeight }]}>{displayAmount}</Text>
              <Animated.View style={[s.cursor, { opacity: cursorOpacity, backgroundColor: C.contentAccent, height: device.amountLineHeight }]} />
            </View>
            <TouchableOpacity
              style={[s.toggleBtn, { backgroundColor: C.bgTertiary }]}
              onPress={onToggle}
              activeOpacity={0.7}
            >
              <Text style={[s.toggleIcon, { color: C.contentSecondary }]}>{IC.arrowUpDown}</Text>
            </TouchableOpacity>
            <View style={s.conversionRow}>
              <Text style={[s.conversionText, { color: C.contentSecondary }]}>{conversionText}</Text>
              <Text style={[s.infoIcon, { color: C.contentSecondary }]}>{IC.infoCircle}</Text>
            </View>
            <View style={s.pillRow}>
              {pills.map(({ label, value }) => (
                <TouchableOpacity
                  key={label}
                  style={[s.pill, { borderColor: C.border, backgroundColor: C.bgPrimary }]}
                  onPress={() => setRaw(value)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.pillText, { color: C.contentPrimary }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
          <View key={ri} style={s.numpadRow}>
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
      <View style={[s.ctaDock, { backgroundColor: C.bgPrimary, borderColor: C.border }]}>
        <TouchableOpacity style={[s.ctaBtn, { backgroundColor: C.contentAccent }]} activeOpacity={0.85}>
          <Text style={s.ctaText}>Add money</Text>
        </TouchableOpacity>
      </View>
    </>
  );

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
              <PhoneHomeIndicator device={device} color={iconColor} />
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

  amountZone: { flex: 1, paddingBottom: 12 },
  amountCenterWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  amountLockup: { alignItems: 'center', gap: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountText: { fontFamily: 'Sohne-Kraftig', fontSize: 40, lineHeight: 48 },
  cursor: { width: 2, height: 48, marginLeft: 3 },
  toggleBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginVertical: -4 },
  toggleIcon: { fontFamily: 'GrowwHugeStandard', fontSize: 12, lineHeight: 14 },
  conversionRow: { flexDirection: 'row', alignItems: 'center' },
  conversionText: { fontFamily: 'GrowwSans-Regular', fontSize: 14, lineHeight: 20 },
  infoIcon: { fontFamily: 'GrowwHugeStandard', fontSize: 16, marginLeft: 4, lineHeight: 20 },
  pillRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 32, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: 'GrowwSans-Medium', fontSize: 12, lineHeight: 18 },
  receiveByText: { fontFamily: 'GrowwSans-Regular', fontSize: 12, lineHeight: 16, textAlign: 'center' },

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

  ctaDock: { borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16 },
  ctaBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: 'GrowwSans-Medium', fontSize: 16, lineHeight: 24, color: '#FFFFFF' },

  homeIndicator: { height: 20, alignItems: 'center', justifyContent: 'center' },
  homeHandle: { width: 108, height: 2, borderRadius: 12 },
});
