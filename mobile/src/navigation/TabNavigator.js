import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Calendar, ShoppingBag, BookOpen, User, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import CampusConnectScreen from '../screens/CampusConnectScreen';
import PYQScreen from '../screens/PYQScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import SuperAdminDashboardScreen from '../screens/SuperAdminDashboardScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isSuperAdmin = user?.role === 'SuperAdmin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#0b0f17',
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Campus Hub',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ConnectTab"
        component={CampusConnectScreen}
        options={{
          tabBarLabel: 'Connect',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PYQTab"
        component={PYQScreen}
        options={{
          tabBarLabel: 'PYQs',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />

      {isAdmin && (
        <Tab.Screen
          name="AdminTab"
          component={AdminDashboardScreen}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size} />,
          }}
        />
      )}

      {isSuperAdmin && (
        <Tab.Screen
          name="SuperAdminTab"
          component={SuperAdminDashboardScreen}
          options={{
            tabBarLabel: 'SuperAdmin',
            tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}
