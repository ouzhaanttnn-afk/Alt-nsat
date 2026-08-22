import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { colors, fonts } from '../theme';
import { DukkanScreen } from '../screens/DukkanScreen';
import { KasamScreen } from '../screens/KasamScreen';
import { PiyasaScreen } from '../screens/PiyasaScreen';
import { ProfilScreen } from '../screens/ProfilScreen';
import { TekliflerScreen } from '../screens/TekliflerScreen';
import { YatirimlarScreen } from '../screens/YatirimlarScreen';

// Bölüm 4: Alt navigasyon — 6 sabit sekme.
// İkonlar henüz eklenmedi (emoji YOK kuralı gereği SVG ikonlar sonraki adımda gelecek).
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
            backgroundColor: colors.paper,
            borderTopColor: colors.border,
            borderTopWidth: 1.5,
          },
          tabBarLabelStyle: {
            fontFamily: fonts.bodyMedium,
            fontSize: 11,
          },
        }}
      >
        <Tab.Screen name="Dükkân" component={DukkanScreen} />
        <Tab.Screen name="Piyasa" component={PiyasaScreen} />
        <Tab.Screen name="Kasam" component={KasamScreen} />
        <Tab.Screen name="Yatırımlar" component={YatirimlarScreen} />
        <Tab.Screen name="Teklifler" component={TekliflerScreen} />
        <Tab.Screen name="Profil" component={ProfilScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
