import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  OffersTabIcon,
  ProfileTabIcon,
  SafeTabIcon,
  ShopTabIcon,
  SkillTabIcon,
} from '../components/icons/TabIcons';
import { colors, fonts, shadow } from '../theme';
import { DukkanScreen } from '../screens/DukkanScreen';
import { KasamScreen } from '../screens/KasamScreen';
import { ProfilScreen } from '../screens/ProfilScreen';
import { TekliflerScreen } from '../screens/TekliflerScreen';
import { YeteneklerScreen } from '../screens/YeteneklerScreen';

// Mockup birleşimi: Dükkân artık gelen müşteriyle pazarlığı doğrudan
// kendi içinde gösteriyor (bkz. NegotiationPanel), bu yüzden ayrı bir
// Pazarlık modalı/Stack.Navigator'a gerek kalmadı — tek seviyeli, 5
// sekmeli navigasyon: Dükkân / Müşteriler / Stok / Yetenekler / Profil.
const Tab = createBottomTabNavigator();

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
        name="Müşteriler"
        component={TekliflerScreen}
        options={{ tabBarIcon: ({ color }) => <OffersTabIcon color={color} /> }}
      />
      <Tab.Screen
        name="Stok"
        component={KasamScreen}
        options={{ tabBarIcon: ({ color }) => <SafeTabIcon color={color} /> }}
      />
      <Tab.Screen
        name="Yetenekler"
        component={YeteneklerScreen}
        options={{ tabBarIcon: ({ color }) => <SkillTabIcon color={color} /> }}
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
      <MainTabs />
    </NavigationContainer>
  );
}
