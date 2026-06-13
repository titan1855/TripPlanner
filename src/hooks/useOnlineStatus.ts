import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * 線上狀態。旅途中漫遊/地下鐵會頻繁切換，離線快取策略依此判斷。
 * PWA（web）用瀏覽器原生 online/offline 事件 + navigator.onLine（最可靠）；
 * 原生平台用 NetInfo。
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const update = () => setOnline(navigator.onLine);
      update();
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      return () => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      };
    }

    let mounted = true;
    NetInfo.fetch().then((state) => {
      if (mounted) setOnline(state.isConnected !== false);
    });
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return online;
}
