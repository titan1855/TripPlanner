-- ============================================================
-- 0003 — 交通改為「多段（轉乘）」模型
-- 原本 spots.transport_* 是單一一組交通欄位，無法表達「步行→地鐵→
-- 轉另一線」這種含轉乘的旅程。改為 transport_legs jsonb 陣列，每段一筆。
--
-- ⚠️ 這是「新增 + 回填」式 migration，不 drop 任何資料。
--    舊 transport_* 欄位「先保留」當安全網；待 APP 端確認回填正確後，
--    再用 0004 將舊欄位 drop（見檔尾被註解的 DROP 區塊）。
--
-- ⚠️ 執行前確認：這是 TripPlanner 專案（mcldqmmvsciuvnkscjhi），
--    不是拆帳 APP 那個 trip-split 專案！
-- ============================================================

-- 1) 新增 jsonb 陣列欄位，預設空陣列
alter table public.spots
  add column if not exists transport_legs jsonb not null default '[]'::jsonb;

-- 2) 把現有單段 transport_* 回填成 legs[0]
--    僅在 transport_legs 還是空陣列、且舊欄位有任何值時才回填（可重跑）
update public.spots
set transport_legs = jsonb_build_array(
  jsonb_build_object(
    'mode',           transport_mode,
    'line',           transport_line,
    'departures',     transport_departures,
    'board_at',       transport_board_at,
    'alight_at',      transport_alight_at,
    'minutes',        transport_minutes,
    'frequency_note', transport_frequency_note,
    'booking_status', transport_booking_status,
    'cost_per_person', transport_cost_per_person,
    'notes',          transport_notes
  )
)
where transport_legs = '[]'::jsonb
  and (
    transport_mode is not null
    or transport_line is not null
    or transport_departures is not null
    or transport_board_at is not null
    or transport_alight_at is not null
    or transport_minutes is not null
    or transport_frequency_note is not null
    or transport_booking_status is not null
    or transport_cost_per_person is not null
    or transport_notes is not null
  );

-- ============================================================
-- 待 APP 端確認回填無誤後，再單獨執行下列 DROP（建議放 0004）：
--
-- alter table public.spots
--   drop column transport_mode,
--   drop column transport_line,
--   drop column transport_departures,
--   drop column transport_board_at,
--   drop column transport_alight_at,
--   drop column transport_minutes,
--   drop column transport_frequency_note,
--   drop column transport_booking_status,
--   drop column transport_cost_per_person,
--   drop column transport_notes;
-- ============================================================
