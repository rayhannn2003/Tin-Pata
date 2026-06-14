import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useTranslation } from '@/i18n/useTranslation';
import { Colors } from '@/constants/theme';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { useColorScheme } from '@/hooks/useColorScheme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color }: { name: IconName; color: ColorValue }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { t } = useTranslation();
  const { visible, loading, complete, skip } = useOnboarding();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          header: () => null,
          title: '',
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarLabel: t('tabs.home'),
            tabBarIcon: ({ color }) => <TabIcon name="home-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            headerShown: false,
            tabBarLabel: t('tabs.library'),
            tabBarIcon: ({ color }) => <TabIcon name="library-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            headerShown: false,
            tabBarLabel: t('tabs.stats'),
            tabBarIcon: ({ color }) => <TabIcon name="bar-chart-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            tabBarLabel: t('tabs.settings'),
            tabBarIcon: ({ color }) => <TabIcon name="settings-outline" color={color} />,
          }}
        />
      </Tabs>

      {!loading ? (
        <OnboardingModal
          visible={visible}
          onComplete={() => {
            void complete();
            router.push('/library');
          }}
          onSkip={() => {
            void skip();
          }}
        />
      ) : null}
    </>
  );
}
