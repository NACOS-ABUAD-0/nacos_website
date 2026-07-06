import { Text, TextInput, TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, ...inputProps }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <TextInput
        placeholderTextColor="#9CA3AF"
        className={`rounded-lg border px-3 py-3 text-base text-gray-900 ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
        } ${inputProps.editable === false ? 'bg-gray-100 text-gray-500' : ''}`}
        {...inputProps}
      />
      {error ? <Text className="mt-1 text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
