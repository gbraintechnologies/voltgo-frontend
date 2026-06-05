import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivitiesScreen from '../screens/activities/ActivitiesScreen';
import PastActivityDetailScreen from '../screens/activities/PastActivityDetailScreen';

const Stack = createNativeStackNavigator();

export default function ActivitiesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Activities" component={ActivitiesScreen} />
      <Stack.Screen name="ActivityDetail" component={PastActivityDetailScreen} />
    </Stack.Navigator>
  );
}