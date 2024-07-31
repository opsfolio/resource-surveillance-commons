DROP View IF EXISTS device_data;
Create view  device_data As
select device_id ,name ,created_at from device d ;


DROP View IF EXISTS number_of_files_converted;
Create view  number_of_files_converted
As
select count(*) from uniform_resource where content_digest != '-' ;;

DROP View IF EXISTS converted_files_list;
Create View  converted_files_list As
select file_basename from ur_ingest_session_fs_path_entry where file_extn !='sql' and file_extn !='db';


DROP View IF EXISTS converted_table_list ;
Create View  converted_table_list As
SELECT tbl_name As 'table_name'
FROM sqlite_master 
WHERE type = 'table' 
  AND name LIKE 'uniform_resource%' 
  AND name != 'uniform_resource_transform' 
  And name != 'uniform_resource';
 
 
DROP View IF EXISTS uniform_resource_study_nature ;
Create View  uniform_resource_study_nature As 
SELECT 
    json_extract(elaboration , '$.uniform_resource_id') AS uniform_resource_id,
    json_extract(elaboration, '$.new_table') AS new_table,
    json_extract(elaboration, '$.from_nature') AS from_nature,
    json_extract(elaboration, '$.to_nature') AS to_nature  
FROM uniform_resource_study;


  
CREATE View orch_session_view AS
SELECT orchestration_session_id, device_id, orchestration_nature_id, version, orch_started_at, orch_finished_at, diagnostics_json, diagnostics_md 
FROM orchestration_session;

SELECT orchestration_session_id, device_id, orchestration_nature_id, version, orch_started_at, orch_finished_at, diagnostics_json, diagnostics_md 
FROM orchestration_session where orchestration_nature_id ='drh-deidentify';

CREATE View orchestration_session_entry_view AS 
SELECT orchestration_session_entry_id, session_id, ingest_src, ingest_table_name FROM orchestration_session_entry;

CREATE View orchestration_session_exec_view AS 
SELECT orchestration_session_exec_id, exec_nature, session_id, session_entry_id, parent_exec_id, namespace, exec_identity, exec_code, exec_status, input_text, exec_error_text, output_text, output_nature, narrative_md FROM orchestration_session_exec;

  
   
DROP View IF EXISTS study_data ;
Create View  study_data As 
SELECT study_id, study_name, 'start_date', end_date, treatment_modalities, funding_source, nct_number, study_description FROM uniform_resource_study limit 10;

DROP View IF EXISTS cgmfilemetadata_view;
Create View  cgmfilemetadata_view As 
SELECT metadata_id, devicename, device_id, source_platform, patient_id, file_name, 'file_format', file_upload_date, data_start_date, data_end_date, study_id FROM uniform_resource_cgm_file_metadata limit 10;
  
CREATE view author_data as
SELECT author_id, name, email, investigator_id, study_id FROM uniform_resource_author;
 
CREATE view institution_data as
SELECT institution_id, institution_name, city, state, country FROM uniform_resource_institution;

CREATE view investigator_data as
SELECT investigator_id, investigator_name, email, institution_id, study_id FROM uniform_resource_investigator;


CREATE view lab_data as
SELECT lab_id, lab_name, lab_pi, institution_id, study_id FROM uniform_resource_lab;

CREATE view participant_data as
SELECT participant_id, study_id, site_id, diagnosis_icd, med_rxnorm, treatment_modality, gender, race_ethnicity, age, bmi, baseline_hba1c, diabetes_type, study_arm FROM uniform_resource_participant;

CREATE view publication_data as
SELECT publication_id, publication_title, digital_object_identifier, publication_site, study_id FROM uniform_resource_publication;


CREATE view site_data as
SELECT study_id, site_id, site_name, site_type FROM uniform_resource_site;



 





