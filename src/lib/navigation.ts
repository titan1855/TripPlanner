import { Linking } from 'react-native';

/**
 * 用名稱或地址開啟 Google Maps 導航（universal link，不串 API）。
 * 手機上裝有 Google Maps APP 會自動喚起，沒裝開網頁版，桌面開新分頁。
 */
export function openGoogleMapsNavigation(
  spot: { name: string; address?: string | null },
  destinationHint?: string
) {
  const query = encodeURIComponent(
    spot.address || `${spot.name} ${destinationHint ?? ''}`.trim()
  );
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
}
