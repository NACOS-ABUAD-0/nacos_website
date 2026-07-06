import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

export default function EventsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-primary">Events</Text>
        <Text className="text-base text-gray-500">Coming in Milestone 4</Text>
      </View>
    </SafeAreaView>
  );
}
