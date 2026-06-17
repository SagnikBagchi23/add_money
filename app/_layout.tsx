import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  const [loaded] = useFonts({
    'Sohne-Kraftig': require('../assets/fonts/Sohne-Kraftig.otf'),
    'GrowwSans-Regular': require('../assets/fonts/GrowwSans-Regular.otf'),
    'GrowwSans-Medium': require('../assets/fonts/GrowwSans-Medium.otf'),
    'GrowwHugeStandard': require('../assets/fonts/groww-huge-standard.otf'),
  });

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: '#060809' }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#060809' },
        animation: 'none',
      }}
    />
  );
}
