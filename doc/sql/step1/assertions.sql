-- GENERATED: every ok must equal 1.
USE trade_step1_supplier_payer_46c455d0;
SET time_zone='+00:00';
SELECT JSON_OBJECT('check','five_core_tables','ok',IF((SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE')=5,1,0));
SELECT JSON_OBJECT('check','editing_revision_four','ok',IF((SELECT COUNT(*) FROM trade_record_tab WHERE revision_number=4 AND version=4 AND trade_status_code=2 AND approved_revision_number=0)=1,1,0));
SELECT JSON_OBJECT('check','six_participants','ok',IF((SELECT COUNT(*) FROM trade_participater_tab)=6,1,0));
SELECT JSON_OBJECT('check','two_submitters_only','ok',IF((SELECT COUNT(*) FROM trade_event_tab WHERE actor_reference NOT IN ('DEMO-SUPPLIER-USER','DEMO-PAYER-USER'))=0,1,0));
SELECT JSON_OBJECT('check','supplier_created','ok',IF((SELECT COUNT(*) FROM trade_record_tab WHERE created_by='DEMO-SUPPLIER-USER')=1,1,0));
SELECT JSON_OBJECT('check','four_submissions','ok',IF((SELECT COUNT(*) FROM trade_event_tab WHERE event_type_code=3)=4,1,0));
SELECT JSON_OBJECT('check','one_creation','ok',IF((SELECT COUNT(*) FROM trade_event_tab WHERE event_type_code=1 AND revision_number=1 AND actor_reference='DEMO-SUPPLIER-USER')=1,1,0));
SELECT JSON_OBJECT('check','five_events','ok',IF((SELECT COUNT(*) FROM trade_event_tab)=5,1,0));
SELECT JSON_OBJECT('check','no_approval_snapshot','ok',IF((SELECT COUNT(*) FROM trade_revision_tab)=0,1,0));
SELECT JSON_OBJECT('check','actual_local_material','ok',IF((SELECT COUNT(*) FROM document_file_tab WHERE sha256='77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284' AND size_bytes=1528 AND document_type_code=17 AND revision_status_code=2)=1,1,0));
SELECT JSON_OBJECT('check','supplier_edit_persisted','ok',IF((SELECT COUNT(*) FROM trade_participater_tab WHERE party_role_code=3 AND JSON_UNQUOTE(JSON_EXTRACT(participant_information_json,'$.delivery_arrangements'))='供应商修改后的合成送货安排')=1,1,0));
SELECT JSON_OBJECT('check','payer_edit_persisted','ok',IF((SELECT COUNT(*) FROM trade_participater_tab WHERE party_role_code=4 AND JSON_UNQUOTE(JSON_EXTRACT(participant_information_json,'$.payment_purpose'))='付款方修改后的合成付款说明')=1,1,0));
SELECT JSON_OBJECT('check','cny_total','ok',IF((SELECT SUM(CAST(j.amount AS DECIMAL(20,2))) FROM trade_record_tab t,JSON_TABLE(t.transaction_goods_items_json,'$[*]' COLUMNS(amount VARCHAR(32) PATH '$.amount',currency VARCHAR(3) PATH '$.currency_code')) j WHERE j.currency='CNY')=12500.00,1,0));
SELECT JSON_OBJECT('check','confirmed_refs','ok',IF((SELECT COUNT(*) FROM trade_record_tab t,JSON_TABLE(t.transaction_filing_document_references_json,'$[*]' COLUMNS(f VARCHAR(40) PATH '$.logical_file_number',v INT PATH '$.revision_number',h VARCHAR(64) PATH '$.content_digest')) r LEFT JOIN document_file_tab d ON d.logical_file_number=r.f AND d.revision_number=r.v AND d.sha256=r.h WHERE d.id IS NULL)=0,1,0));
SELECT JSON_OBJECT('check','minimum_receipts','ok',IF((SELECT COUNT(*) FROM trade_event_tab WHERE event_type_code=3 AND JSON_EXTRACT(event_payload,'$.accepted_representation') IS NOT NULL AND JSON_EXTRACT(event_payload,'$.accepted_representation.content') IS NULL)=4,1,0));
SELECT JSON_OBJECT('check','missing_evidence_visible','ok',IF((SELECT JSON_LENGTH(transaction_filing_missing_information_json) FROM trade_record_tab)=4,1,0));
