import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  InvestTabIcon,
  MarketTabIcon,
  OffersTabIcon,
  ProfileTabIcon,
  SafeTabIcon,
  ShopTabIcon,
} from '../components/icons/TabIcons';
import { colors, fonts, shadow } from '../theme';
import { DukkanScreen } from '../screens/DukkanScreen';
import { KasamScreen } from '../screens/KasamScreen';
import { PiyasaScreen } from '../screens/PiyasaScreen';
import { ProfilScreen } from '../screens/ProfilScreen';
import { TekliflerScreen } from '../screens/TekliflerScreen';
import { YatirimlarScreen } from '../screens/YatirimlarScreen';

// Bölüm 4: Alt navigasyon — 6 sabit sekme, emoji yok, sade çizgi ikonlar.
const Tab = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.inkMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
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
          name="Yatırımlar"
          component={YatirimlarScreen}
          options={{ tabBarIcon: ({ color }) => <InvestTabIcon color={color} /> }}
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
    </NavigationContainer>
  );
}
