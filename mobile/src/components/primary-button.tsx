import { ActivityIndicator, Pressable, Text } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary' }: Props) {
  const isDisabled = disabled || loading;
  const base = 'flex-1 items-center justify-center rounded-lg py-3';
  const styles =
    variant === 'primary'
      ? `bg-primary ${isDisabled ? 'opacity-50' : ''}`
      : `border border-gray-300 bg-white ${isDisabled ? 'opacity-50' : ''}`;
  const textStyles = variant === 'primary' ? 'font-semibold text-white' : 'font-semibold text-gray-700';

  return (
    <Pressable onPress={onPress} disabled={isDisabled} className={`${base} ${styles}`}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#006E3A'} />
      ) : (
        <Text className={textStyles}>{title}</Text>
      )}
    </Pressable>
  );
}
