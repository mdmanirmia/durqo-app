-- Nov 21, 2026 ("24 hour er majhe asset transfer start na korle report
-- issue ta kora jabe"): the buyer could only report an issue during the
-- inspection window, so a seller who took the payment and never started the
-- transfer left the buyer with no way to escalate. Now the buyer can also
-- report once the room has been unlocked (payment confirmed) for 24 hours
-- and the seller still hasn't started (stage is still 'room_unlocked').
-- Everything else is unchanged: buyer only, explanation required, the room
-- moves to 'admin_review' and funds stay held.

create or replace function public.transfer_report_issue(p_room_id uuid, p_item_id uuid, p_category text, p_explanation text)
returns asset_transfer_issues
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.asset_transfer_rooms;
  v_issue public.asset_transfer_issues;
begin
  v_room := public.assert_transfer_participant(p_room_id, 'buyer');

  if not (
    v_room.stage = 'inspection_active'
    or (
      v_room.stage = 'room_unlocked'
      and v_room.unlocked_at is not null
      and v_room.unlocked_at <= now() - interval '24 hours'
    )
  ) then
    raise exception 'Issues can be reported during the inspection window, or if the seller has not started the transfer within 24 hours of payment (stage=%).', v_room.stage;
  end if;

  if p_item_id is not null and not exists (
    select 1 from public.asset_transfer_items where id = p_item_id and room_id = p_room_id
  ) then
    raise exception 'That item does not belong to this transfer.';
  end if;

  if p_explanation is null or length(trim(p_explanation)) = 0 then
    raise exception 'An explanation is required.';
  end if;

  insert into public.asset_transfer_issues (room_id, item_id, reporter_id, category, explanation)
  values (p_room_id, p_item_id, auth.uid(), p_category, trim(p_explanation))
  returning * into v_issue;

  update public.asset_transfer_rooms set stage = 'admin_review', updated_at = now() where id = p_room_id;

  perform public.log_transfer_event(p_room_id, auth.uid(), 'issue_reported', p_category, jsonb_build_object('issue_id', v_issue.id, 'item_id', p_item_id));

  return v_issue;
end;
$function$;
