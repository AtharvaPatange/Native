import { Tabs } from 'expo-router';
import { ChartBar as BarChart3, DollarSign, Receipt, Users, Wrench } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';

export default function TabLayout() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();

  const canViewDashboard = user?.role === 'globalAdmin' || user?.role === 'admin';
  const tabBarColor = selectedBranch?.color || '#1E40AF';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabBarColor,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {canViewDashboard && (
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => (
              <BarChart3 size={size} color={color} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ size, color }) => (
            <DollarSign size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ size, color }) => (
            <Receipt size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: 'Maintenance',
          tabBarIcon: ({ size, color }) => (
            <Wrench size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}