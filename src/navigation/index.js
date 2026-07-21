import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

import TodayScreen from '../screens/TodayScreen';
import HabitsScreen from '../screens/HabitsScreen';
import TasksScreen from '../screens/TasksScreen';
import StatsScreen from '../screens/StatsScreen';
import TimerScreen from '../screens/TimerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddEditHabitScreen from '../screens/AddEditHabitScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import NewTaskScreen from '../screens/NewTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import AboutScreen from '../screens/AboutScreen';
import ArchiveScreen from '../screens/ArchiveScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Today: 'checkmark-circle',
            Habits: 'list',
            Tasks: 'clipboard-outline',
            Stats: 'bar-chart',
            Timer: 'timer-outline',
            Settings: 'settings-sharp',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddEditHabit"
        component={AddEditHabitScreen}
        options={({ route }) => ({ title: route.params?.habitId ? 'Edit Habit' : 'New Habit', presentation: 'modal' })}
      />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} options={{ title: '' }} />
      <Stack.Screen
        name="NewTask"
        component={NewTaskScreen}
        options={({ route }) => ({ title: route.params?.taskId ? 'Edit Task' : 'New Task', presentation: 'modal' })}
      />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="Archive" component={ArchiveScreen} options={{ title: '' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
