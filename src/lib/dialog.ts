import { Alert, Platform } from 'react-native';

/** 跨平台 alert：web 上 Alert.alert 是 no-op，必須用這個 */
export function appAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/** 跨平台確認對話框，resolve true = 使用者按下確認 */
export function appConfirm(
  title: string,
  message?: string,
  confirmLabel = '確定',
  destructive = false
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: '取消', style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
