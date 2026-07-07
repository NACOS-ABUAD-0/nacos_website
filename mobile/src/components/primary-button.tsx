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
  // `w-full` (not `flex-1`) — fills whatever width its parent gives it,
  // whether that's the full screen width (the common case) or one slot in a
  // `flex-row` of equal-width siblings (wrap each in a `flex-1` View at the
  // call site for that case — see register.tsx / resources/[id].tsx).
  const base = 'w-full items-center justify-center rounded-lg py-3';
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
