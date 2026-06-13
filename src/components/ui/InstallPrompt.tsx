import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../utils/constants';

const DISMISS_KEY = 'installPromptDismissed:v1';

type Mode = 'none' | 'ios' | 'prompt';

/**
 * 「加入主畫面」引導（PWA 的安裝入口）。
 * - iOS Safari 不支援 beforeinstallprompt → 顯示「分享 → 加入主畫面」圖文說明
 * - Android/桌面 Chrome → 攔截 beforeinstallprompt，顯示「安裝」按鈕
 * - 已是 standalone 或先前關閉過則不顯示
 */
export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>('none');
  const [deferred, setDeferred] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      return;
    }

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(ua);

    if (isIOS) {
      setMode('ios');
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setMode('prompt');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setMode('none');
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice?.catch(() => {});
    dismiss();
  }

  if (mode === 'none') return null;

  return (
    <View style={styles.bar}>
      <Text style={styles.icon}>🧳</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title}>把 TripPlanner 加到主畫面</Text>
        {mode === 'ios' ? (
          <Text style={styles.subtitle}>
            點下方「分享」<Text style={styles.bold}> ⬆️ </Text>→「加入主畫面」，像 App 一樣全螢幕使用
          </Text>
        ) : (
          <Text style={styles.subtitle}>安裝後可離線開啟、全螢幕使用</Text>
        )}
      </View>
      {mode === 'prompt' ? (
        <Pressable style={styles.installButton} onPress={install}>
          <Text style={styles.installText}>安裝</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.close} onPress={dismiss} hitSlop={8}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  icon: { fontSize: 24 },
  textWrap: { flex: 1 },
  title: { color: '#fff', fontSize: 14, fontWeight: '700' },
  subtitle: { color: '#D1D5DB', fontSize: 12, marginTop: 2, lineHeight: 17 },
  bold: { fontWeight: '700', color: '#fff' },
  installButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  installText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  close: { padding: 4 },
  closeText: { color: '#9CA3AF', fontSize: 16 },
});
