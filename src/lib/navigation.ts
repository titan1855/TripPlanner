import { Linking, Platform } from 'react-native';

/** 用名稱或地址開啟 Google Maps 導航（不串任何 API），優先地址 */
export function openGoogleMapsNavigation(
  spot: { name: string; address?: string | null },
  destinationHint?: string
) {
  const query = encodeURIComponent(
    spot.address || `${spot.name} ${destinationHint ?? ''}`.trim()
  );
  const appUrl = Platform.select({
    ios: `comgooglemaps://?daddr=${query}`,
    android: `google.navigation:q=${query}`,
  })!;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  Linking.canOpenURL(appUrl)
    .then((ok) => Linking.openURL(ok ? appUrl : webUrl))
    .catch(() => Linking.openURL(webUrl));
}
