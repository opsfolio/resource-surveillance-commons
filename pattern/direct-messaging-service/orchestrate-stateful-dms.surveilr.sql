-- ---------------------------------------------------------------------------------
-- Script to extract, denormalize, and cache DMS data from JSONB in surveilr RSSDs.
-- ---------------------------------------------------------------------------------
-- This "stateful" pattern assumes that "stateless" views have been created which 
-- capture logic that might be slow to query so tables are created which act like
-- materialized views.
-- ---------------------------------------------------------------------------------

-- Cache for the dms_v4_bundle_resource_patient view.
-- Caches detailed information about Patient resources extracted from DMS bundles.
DROP TABLE IF EXISTS dms_inbox_data_cached;
CREATE TABLE dms_inbox_data_cached AS 
  SELECT * FROM inbox;
