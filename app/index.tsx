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

const EXCHANGE_RATE = 96.71; // 1 USD = 96.71 INR

const C = {
  bgPrimary: '#060809',
  bgTertiary: '#1E2224',
  border: '#252A2C',
  contentPrimary: '#F2F5F7',
  contentSecondary: '#989EA0',
  contentAccent: '#04B488',
  numpadText: '#EAEFF1',
} as const;

// Icon chars from groww-huge-standard font (Private Use Area — encoding-safe)
const IC = {
  arrowLeft:   String.fromCharCode(0xEA1B), // gh-standard-arrow-left-01
  arrowUpDown: String.fromCharCode(0xEA24), // gh-standard-arrow-up-down
  infoCircle:  String.fromCharCode(0xEADB), // gh-standard-information-circle
  arrowRight:  String.fromCharCode(0xEA1D), // gh-standard-arrow-right-01
  delete:      String.fromCharCode(0xEA89), // gh-standard-delete-01
};

type Currency = 'INR' | 'USD';

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
  const intFormatted = parseInt(intStr || '0', 10).toLocaleString('en-US');
  if (decStr !== undefined) return `${sym}${intFormatted}.${decStr}`;
  return `${sym}${intFormatted}`;
}

function buildConversion(raw: string, currency: Currency): string {
  const num = parseFloat(raw || '0');
  if (currency === 'INR') {
    const usd = (num / EXCHANGE_RATE).toFixed(2);
    return `You will get $${usd}`;
  }
  const inr = (num * EXCHANGE_RATE).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return `= ₹${inr}`;
}

const IS_WEB = Platform.OS === 'web';

export default function AddMoneyScreen() {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [raw, setRaw] = useState('');
  const cursorOpacity = useRef(new Animated.Value(1)).current;

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
      if (key === 'back') {
        setRaw((p) => p.slice(0, -1));
        return;
      }
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

  const onToggle = () => {
    setCurrency((p) => (p === 'INR' ? 'USD' : 'INR'));
    setRaw('');
  };

  const displayAmount = buildDisplayAmount(raw, currency);
  const conversionText = buildConversion(raw, currency);
  const pills = PILLS[currency];

  const screenContent = (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.bgPrimary} />

      {/* ─── Top App Bar ─── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.iconBtn}>
          <Text style={s.iconText}>{IC.arrowLeft}</Text>
        </TouchableOpacity>
        <View style={s.topBarCenter}>
          <Text style={s.topTitle}>Add money</Text>
          <Text style={s.topSubtitle}>₹0.00 available</Text>
        </View>
        {/* spacer to balance back button */}
        <View style={s.iconBtn} />
      </View>

      {/* ─── Amount Input Zone ─── */}
      <View style={s.amountZone}>
        {/* centered lockup */}
        <View style={s.amountCenterWrap}>
          <View style={s.amountLockup}>
            {/* Amount + blinking cursor */}
            <View style={s.amountRow}>
              <Text style={s.amountText}>{displayAmount}</Text>
              <Animated.View style={[s.cursor, { opacity: cursorOpacity }]} />
            </View>

            {/* Currency toggle button */}
            <TouchableOpacity style={s.toggleBtn} onPress={onToggle} activeOpacity={0.7}>
              <Text style={s.toggleIcon}>{IC.arrowUpDown}</Text>
            </TouchableOpacity>

            {/* Conversion text + info icon */}
            <View style={s.conversionRow}>
              <Text style={s.conversionText}>{conversionText}</Text>
              <Text style={s.infoIcon}>{IC.infoCircle}</Text>
            </View>

            {/* Quick-add pills */}
            <View style={s.pillRow}>
              {pills.map(({ label, value }) => (
                <TouchableOpacity key={label} style={s.pill} onPress={() => setRaw(value)} activeOpacity={0.7}>
                  <Text style={s.pillText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Receive-by text — pinned to bottom of zone */}
        <Text style={s.receiveByText}>Receive money by 5:00 PM, 19 Jun</Text>
      </View>

      {/* ─── Payment Method Row ─── */}
      <View style={s.paymentRow}>
        <View style={s.bankLogoWrap}>
          <Image
            source={require('../assets/hdfc-bank.png')}
            style={s.bankLogo}
            resizeMode="cover"
          />
        </View>
        <View style={s.paymentInfo}>
          <Text style={s.paymentTitle}>Net Banking (Remittance)</Text>
          <Text style={s.paymentSub}>HDFC Bank ••••7080</Text>
        </View>
        <Text style={s.chevronIcon}>{IC.arrowRight}</Text>
      </View>

      {/* ─── Numpad ─── */}
      <View style={s.numpad}>
        {NUMPAD_ROWS.map((row, ri) => (
          <View key={ri} style={s.numpadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={s.numpadKey}
                onPress={() => onKey(key)}
                activeOpacity={0.6}
              >
                {key === 'back' ? (
                  <Text style={s.numpadIcon}>{IC.delete}</Text>
                ) : (
                  <Text style={s.numpadDigit}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* ─── CTA Button Dock ─── */}
      <View style={s.ctaDock}>
        <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85}>
          <Text style={s.ctaText}>Add money</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Home Indicator ─── */}
      <View style={s.homeIndicator}>
        <View style={s.homeHandle} />
      </View>
    </>
  );

  if (IS_WEB) {
    return (
      <View style={s.webShell}>
        <View style={s.phoneMockup}>{screenContent}</View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>{screenContent}</SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bgPrimary },

  // Web phone shell
  webShell: {
    flex: 1,
    backgroundColor: '#111417',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMockup: {
    width: 360,
    height: 780,
    backgroundColor: C.bgPrimary,
    borderRadius: 40,
    overflow: 'hidden',
  },

  // ─── Top Bar ───
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  iconBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topTitle: {
    fontFamily: 'GrowwSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: C.contentPrimary,
  },
  topSubtitle: {
    fontFamily: 'GrowwSans-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: C.contentSecondary,
  },
  iconText: {
    fontFamily: 'GrowwHugeStandard',
    fontSize: 20,
    color: C.contentPrimary,
    lineHeight: 24,
  },

  // ─── Amount Zone ───
  amountZone: {
    flex: 1,
    paddingBottom: 12,
  },
  amountCenterWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLockup: {
    alignItems: 'center',
    gap: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontFamily: 'Sohne-Kraftig',
    fontSize: 40,
    lineHeight: 48,
    color: C.contentPrimary,
  },
  cursor: {
    width: 2,
    height: 48,
    backgroundColor: C.contentAccent,
    marginLeft: 3,
  },
  toggleBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIcon: {
    fontFamily: 'GrowwHugeStandard',
    fontSize: 12,
    color: C.contentSecondary,
    lineHeight: 14,
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversionText: {
    fontFamily: 'GrowwSans-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.contentSecondary,
  },
  infoIcon: {
    fontFamily: 'GrowwHugeStandard',
    fontSize: 16,
    color: C.contentSecondary,
    marginLeft: 4,
    lineHeight: 20,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: 'GrowwSans-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: C.contentPrimary,
  },
  receiveByText: {
    fontFamily: 'GrowwSans-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: C.contentSecondary,
    textAlign: 'center',
  },

  // ─── Payment Row ───
  paymentRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  bankLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bankLogo: { width: 40, height: 40 },
  paymentInfo: { flex: 1 },
  paymentTitle: {
    fontFamily: 'GrowwSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: C.contentPrimary,
  },
  paymentSub: {
    fontFamily: 'GrowwSans-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: C.contentSecondary,
  },
  chevronIcon: {
    fontFamily: 'GrowwHugeStandard',
    fontSize: 20,
    color: C.contentSecondary,
    lineHeight: 24,
  },

  // ─── Numpad ───
  numpad: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  numpadRow: {
    flexDirection: 'row',
    height: 48,
    gap: 8,
  },
  numpadKey: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  numpadDigit: {
    fontFamily: 'Sohne-Kraftig',
    fontSize: 28,
    lineHeight: 36,
    color: C.numpadText,
    textAlign: 'center',
  },
  numpadIcon: {
    fontFamily: 'GrowwHugeStandard',
    fontSize: 26,
    color: C.numpadText,
    lineHeight: 32,
  },

  // ─── CTA Dock ───
  ctaDock: {
    backgroundColor: C.bgPrimary,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ctaBtn: {
    height: 48,
    backgroundColor: C.contentAccent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'GrowwSans-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },

  // ─── Home Indicator ───
  homeIndicator: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bgPrimary,
  },
  homeHandle: {
    width: 108,
    height: 2,
    backgroundColor: C.contentSecondary,
    borderRadius: 12,
  },
});
