import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  MarketTabIcon,
  OffersTabIcon,
  ProfileTabIcon,
  SafeTabIcon,
  ShopTabIcon,
} from '../components/icons/TabIcons';
import { colors, fonts, shadow } from '../theme';
import { DukkanScreen } from '../screens/DukkanScreen';
import { KasamScreen } from '../screens/KasamScreen';
import { PazarlikScreen } from '../screens/PazarlikScreen';
import { PiyasaScreen } from '../screens/PiyasaScreen';
import { ProfilScreen } from '../screens/ProfilScreen';
import { TekliflerScreen } from '../screens/TekliflerScreen';
import type { RootStackParamList } from './types';

// Bölüm 4: Alt navigasyon — 5 sabit sekme, emoji yok, sade çizgi ikonlar.
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brass,
        tabBarInactiveTintColor: colors.inkMutedOnDark,
        tabBarStyle: {
          backgroundColor: colors.lcdBg,
          borderTopWidth: 0,
          ...shadow,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="Dükkân"
        component={DukkanScreen}
        options={{ tabBarIcon: ({ color }) => <ShopTabIcon color={color} /> }}
      />
      <Tab.Screen
        name="Piyasa"
        component={PiyasaScreen}
        options={{ tabBarIcon: ({ color }) => <MarketTabIcon color={color} /> }}
      />
      <Tab.Screen
        name="Kasam"
        component={KasamScreen}
        options={{ tabBarIcon: ({ color }) => <SafeTabIcon color={color} /> }}
      />
      <Tab.Screen
        name="Teklifler"
        component={TekliflerScreen}
        options={{ tabBarIcon: ({ color }) => <OffersTabIcon color={color} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ tabBarIcon: ({ color }) => <ProfileTabIcon color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Pazarlik"
          component={PazarlikScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
