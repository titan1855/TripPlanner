import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { SheetModal } from '../../../src/components/ui/SheetModal';
import { useAuth } from '../../../src/hooks/useAuth';
import { appAlert, appConfirm } from '../../../src/lib/dialog';
import {
  addCompanion,
  inviteByEmail,
  listMembers,
  removeMember,
  updateMember,
} from '../../../src/services/members';
import { getTrip } from '../../../src/services/trips';
import type { TripMember } from '../../../src/types/database';
import { COLORS } from '../../../src/utils/constants';

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [members, setMembers] = useState<TripMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TripMember | null>(null);

  const [companionName, setCompanionName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mem, trip] = await Promise.all([listMembers(id), getTrip(id)]);
      setMembers(mem);
      setIsOwner(trip.owner_id === session?.user.id);
    } catch (e: any) {
      appAlert('載入失敗', e.message ?? '請稍後再試');
    }
  }, [id, session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAddCompanion() {
    if (!companionName.trim()) {
      appAlert('請輸入旅伴名字');
      return;
    }
    setBusy(true);
    try {
      await addCompanion(id, companionName, members);
      setCompanionName('');
      setAddOpen(false);
      await load();
    } catch (e: any) {
      appAlert('新增失敗', e.message ?? '請稍後再試');
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      appAlert('請輸入對方註冊用的 Email');
      return;
    }
    setBusy(true);
    try {
      await inviteByEmail(id, inviteEmail, members);
      setInviteEmail('');
      setAddOpen(false);
      await load();
      appAlert('邀請成功', '對方現在可以在自己的行程列表看到並共同編輯這趟旅程');
    } catch (e: any) {
      appAlert('邀請失敗', e.message ?? '請稍後再試');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveNickname() {
    if (!editing || !editNickname.trim()) return;
    setBusy(true);
    try {
      await updateMember(editing.id, { nickname: editNickname.trim() });
      setEditing(null);
      await load();
    } catch (e: any) {
      appAlert('儲存失敗', e.message ?? '請稍後再試');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!editing) return;
    const ok = await appConfirm(
      '移除旅伴',
      `確定移除「${editing.nickname}」？檢查表中由他負責的項目會變成未指派。`,
      '移除',
      true
    );
    if (!ok) return;
    setBusy(true);
    try {
      await removeMember(editing.id);
      setEditing(null);
      await load();
    } catch (e: any) {
      appAlert('移除失敗', e.message ?? '請稍後再試');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {members.map((m) => (
          <Card
            key={m.id}
            onPress={
              isOwner && !m.is_owner
                ? () => {
                    setEditing(m);
                    setEditNickname(m.nickname);
                  }
                : undefined
            }
          >
            <View style={styles.memberRow}>
              <View
                style={[styles.avatar, { backgroundColor: m.avatar_color ?? COLORS.border }]}
              >
                <Text style={styles.avatarText}>{m.nickname.slice(0, 1)}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.nickname}>{m.nickname}</Text>
                <Text style={styles.memberType}>
                  {m.is_owner
                    ? '👑 建立者'
                    : m.user_id
                      ? '✅ 已註冊・可共同編輯'
                      : '👤 名字旅伴（檢查表負責人用）'}
                </Text>
              </View>
              {isOwner && !m.is_owner ? <Text style={styles.chevron}>›</Text> : null}
            </View>
          </Card>
        ))}

        {!isOwner ? (
          <Text style={styles.hint}>只有行程建立者可以新增或移除旅伴</Text>
        ) : null}
      </ScrollView>

      {isOwner ? (
        <View style={styles.footer}>
          <Button title="＋ 新增旅伴" onPress={() => setAddOpen(true)} />
        </View>
      ) : null}

      <SheetModal visible={addOpen} title="新增旅伴" onClose={() => setAddOpen(false)}>
        <Text style={styles.sectionLabel}>方式一：只加名字（不需註冊）</Text>
        <Text style={styles.sectionHint}>
          用於檢查表指派負責人，對方不會看到行程
        </Text>
        <Input
          label="旅伴名字"
          value={companionName}
          onChangeText={setCompanionName}
          placeholder="例：小美"
        />
        <Button title="加入名字旅伴" variant="secondary" onPress={handleAddCompanion} loading={busy} />

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>方式二：邀請已註冊使用者共同編輯</Text>
        <Text style={styles.sectionHint}>
          對方需先用 Email 註冊 TripPlanner，邀請後即可一起編輯整趟行程
        </Text>
        <Input
          label="對方的 Email"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="friend@example.com"
        />
        <Button title="送出邀請" onPress={handleInvite} loading={busy} />
      </SheetModal>

      <SheetModal
        visible={!!editing}
        title={`編輯旅伴：${editing?.nickname ?? ''}`}
        onClose={() => setEditing(null)}
      >
        <Input label="顯示名稱" value={editNickname} onChangeText={setEditNickname} />
        <Button title="儲存" onPress={handleSaveNickname} loading={busy} />
        <View style={styles.deleteWrap}>
          <Button title="移除旅伴" variant="danger" onPress={handleRemove} />
        </View>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  memberInfo: { flex: 1 },
  nickname: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  memberType: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.border },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  footer: { padding: 16, paddingTop: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  deleteWrap: { marginTop: 10 },
});
