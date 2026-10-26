-- Align the existing local schema with the updated authoritative domain model.
-- No DROP, row rewrite or table recreation.
ALTER TABLE contract_revision_tab
  MODIFY COLUMN review_snapshot_json JSON NULL
    COMMENT '未审核时review_snapshot为空；冻结审查结论及仅追加审签/替代/终止事件；每事件有幂等号及UTC时刻',
  MODIFY COLUMN lifecycle_events_json JSON NOT NULL
    COMMENT '未审核时review_snapshot为空；冻结审查结论及仅追加审签/替代/终止事件；每事件有幂等号及UTC时刻';
