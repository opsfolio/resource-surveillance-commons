#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-sys
import { SQLa, SQLPageAide as spa } from "./deps.ts";

class SqlPages<EmitContext extends SQLa.SqlEmitContext> {
  readonly cr: spa.ComponentRenderer = new spa.ComponentRenderer();
  readonly emitCtx = SQLa.typicalSqlEmitContext({
    sqlDialect: SQLa.sqliteDialect(),
  }) as EmitContext;
  readonly ddlOptions = SQLa.typicalSqlTextSupplierOptions<EmitContext>();

  // type-safe wrapper for all SQL text generated in this library;
  // we call it `SQL` so that VS code extensions like frigus02.vscode-sql-tagged-template-literals
  // properly syntax-highlight code inside SQL`xyz` strings.
  get SQL() {
    return SQLa.SQL<EmitContext>(this.ddlOptions);
  }

  "drh/index.sql"() {
    return this.SQL`
          /*SELECT
            'list' as component,
            'DRH DATA CONVERSION' as title,
            'Here are some useful links.' as description;        
          SELECT 'Device Summary' as title,
          '../drh_device_summary.sql' as link,
          'Provides information about the device from which the data conversion is carried out' as description;            
          SELECT 'List of the Files Converted' as title,
            'drh_converted_file_list.sql' as link,
            'Provides the files being converted' as description;
          SELECT 'Tables' as title,
            'drh_table_list.sql' as link,
            'List of the tables' as description;  
          SELECT 'Basic tables Snapshot' as title,
            'view_table_snapshot.sql' as link,
            'Table data' as description; 
            */
         select 
                'card'                      as component,
                'Welcome to the Diabetes Research Hub' as title,
                1                           as columns;

          select 
                'About' as title,
                'blue'                        as color,
                'light-blue'                  as background_color,
                'The Diabetes Research Hub (DRH) addresses a growing need for a centralized platform to manage and analyze continuous glucose monitor (CGM) data.Our primary focus is to collect data from studies conducted by various researchers. Initially, we are concentrating on gathering CGM data, with plans to collect additional types of data in the future.' as description,
                'info-circle'                 as icon;

          select 
              'card'                     as component,
              'Features ' as title,
              4                          as columns;
          select 
              'Researcher and Associated Information'  as title,
              'researcher_related_data.sql' as link,
              'This section provides detailed information about the individuals , institutions and labs involved in the research study.' as description,
              'file'                as icon,
              'green'                    as color;  
                ;

          select 
              'Research Study Details'  as title,
              'study_related_data.sql' as link,
              'This section provides detailed information about the study , the participants and sites involved in the research study.' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
          
              select 
              'Author and Publication Details'  as title,
              'author_pub_data.sql' as link,
              'Information about research publications and the authors involved in the studies are also collected, contributing to the broader understanding and dissemination of research findings.' as description,
              'file'                as icon,
              'green'                    as color;  
                ;

              select 
              'CGM Meta Data and Associated information'  as title,
              'cgm_associated_data.sql' as link,
              'This section provides detailed information about the CGM device used, the relationship between the participant''s raw CGM tracing file and related metadata, and other pertinent information.' as description,
              'file'                as icon,
              'green'                    as color;  
                ;

          /*select 
              'card'                     as component,
              'DRH Data Conversion' as title,
              1                          as columns;
          select 
              'Device Summary'  as title,
              '../drh_device_summary.sql' as link,
              'Device Information: View the Device details' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
              select 
              'card'                     as component,
              'Data Summary' as title,
              2                          as columns;
              select 
              'Files Information'  as title,
              'drh_converted_file_list.sql' as link,
              'Provides information about files being transformed' as description,
              'file'                as icon,
              'green'                    as color;  
              select 
              'Transformed Data Summary'  as title,
              'drh_table_list.sql' as link,
              'Provides information about the tables to which the files were transformed' as description,
              'file'                as icon,
              'green'                    as color;  
              select 
              'card'                     as component,
              'Transformed Data Snapshot' as title,
              9                         as columns;
              select 
              'Study Data'  as title,
              'study_data.sql' as link,
              'Transformed Data from the study file' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
                select 
              'CGM File Meta Data'  as title,
              'cgmfilemetadata.sql' as link,
              'A snapshot from the converted data from CGM file meta data ' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
                select 
              'Author'  as title,
              'author_data.sql' as link,
              'Data from Author file' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
                select 
              'Institution'  as title,
              'institution_data.sql' as link,
              'Data transformed from Author file' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
                select 
              'Investigator'  as title,
              'investigator_data.sql' as link,
              'Transformed data from Investigator file' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
                select 
              'Lab data'  as title,
              'lab_data.sql' as link,
              'Data transformed from file lab' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
                select 
              'Participant Data'  as title,
              'participant_data.sql' as link,
              'Data transformed from "Participant" file' as description,
              'file'                as icon,
              'green'                    as color;  
                ;
                select 
              'Publication'  as title,
              'publication_data.sql' as link,
              'Data converted from "publication" file' as description,
              'file'                as icon,
              'green'                    as color;  
                ;

                select 
              'Site'  as title,
              'site_data.sql' as link,
              'Data converted from "site" file' as description,
              'file'                as icon,
              'green'                    as color; 
                ;*/


              `;      
  }

  "drh_device_summary.sql"() {
    return this.SQL`
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from device_data;      
      select 
      'text' as component,
      '[Back to Home](drh/index.sql)' as contents_md;`;
      
  }

  "drh/drh_converted_file_list.sql"() {
    return this.SQL`
      --select 'Number of Files converted' as Title,select * from number_of_files_converted as description;
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from converted_files_list;
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;`;
  }

  "drh/drh_table_list.sql"() {
    return this.SQL`
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from converted_table_list;
      --select 'table' as component, 'action' as markdown;
        --select *,
        --format('[View](view_table_snapshot.sql?id=%s)', table_name) as action
        --from converted_table_list
        select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;;
        `;
  }

  "drh/view_table_snapshot.sql"() {
    return this.SQL`      
      select 
      'title'   as component,
      'Table Data Snapshot' as contents,
       1    as level;       
      select 
      'text' as component,
      'Study Table' as contents_md;  
        SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
        select *        
        from uniform_resource_study_sub_data ; 
        select 
      'text' as component,
      'CGM File Meta Data table' as contents_md;  
        SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
        select *        
        from uniform_resource_cgm_file_data ; 
        `;
    }

  "drh/study_data.sql"() {
      return this.SQL`      
        SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
        SELECT * from study_data;
        select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
          `;
  }

  "drh/cgmfilemetadata.sql"() {
        return this.SQL`      
          SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
          SELECT * from cgmfilemetadata_view;
          select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
            `;
  }

  "drh/author_data.sql"() {
    return this.SQL`      
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from author_data;
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }

  "drh/institution_data.sql"() {
    return this.SQL`      
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from institution_data;
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }

  "drh/investigator_data.sql"() {
    return this.SQL`      
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from investigator_data;
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }
  "drh/lab_data.sql"() {
    return this.SQL`      
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from lab_data;
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }

  "drh/participant_data.sql"() {
    return this.SQL`      
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from participant_data;
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }

  "drh/publication_data.sql"() {
    return this.SQL`      
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from publication_data;
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }

  "drh/site_data.sql"() {
    return this.SQL`      
      SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
      SELECT * from site_data;
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }

  "drh/cgm_associated_data.sql"() {
        return this.SQL` 
          select 
    'text' as component,
    '
    ## CGM File Metadata

    CGM file metadata provides essential information about the Continuous Glucose Monitoring (CGM) data files used in research studies. This metadata is crucial for understanding the context and quality of the data collected.

    ### Metadata Details

    - **Metadata ID**: A unique identifier for the metadata record.
    - **Device Name**: The name of the CGM device used to collect the data.
    - **Device ID**: A unique identifier for the CGM device.
    - **Source Platform**: The platform or system from which the CGM data originated.
    - **Patient ID**: A unique identifier for the patient from whom the data was collected.
    - **File Name**: The name of the uploaded CGM data file.
    - **File Format**: The format of the uploaded file (e.g., CSV, Excel).
    - **File Upload Date**: The date when the file was uploaded to the system.
    - **Data Start Date**: The start date of the data period covered by the file.
    - **Data End Date**: The end date of the data period covered by the file.
    - **Study ID**: A unique identifier for the study associated with the CGM data.


    ' as contents_md;

    SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
    SELECT * from cgmfilemetadata_view;

    

          select 
          'text' as component,
          '[Back to Home](index.sql)' as contents_md;
            `;
      }


  "drh/author_pub_data.sql"() {
        return this.SQL` 
          select 
    'text' as component,
    '
# Authors and Publications Information

## Authors 

This section contains information about the authors involved in study publications. Each author plays a crucial role in contributing to the research, and their details are important for recognizing their contributions.

### Author Details

  - **Author ID**: A unique identifier for the author.
  - **Name**: The full name of the author.
  - **Email**: The email address of the author.
  - **Investigator ID**: A unique identifier for the investigator the author is associated with.
  - **Study ID**: A unique identifier for the study associated with the author.


        ' as contents_md;

    SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
    SELECT * from author_data;
    select 
    'text' as component,
    '
## Publications Overview

This section provides information about the publications resulting from a study. Publications are essential for sharing research findings with the broader scientific community.

### Publication Details

- **Publication ID**: A unique identifier for the publication.
- **Publication Title**: The title of the publication.
- **Digital Object Identifier (DOI)**: Identifier for the digital object associated with the publication.
- **Publication Site**: The site or journal where the publication was released.
- **Study ID**: A unique identifier for the study associated with the publication.


    ' as contents_md;

    SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
    SELECT * from publication_data;

          select 
          'text' as component,
          '[Back to Home](index.sql)' as contents_md;
            `;
      }

  "drh/researcher_related_data.sql"() {
    return this.SQL` 
      select 
    'text' as component,
    'Researcher and associated information' as title;
     select 
    'The Diabetes Research Hub collaborates with a diverse group of researchers or investigators dedicated to advancing diabetes research. This section provides detailed information about the individuals and institutions involved in the research studies.' as contents;
     

    select 
    'text' as component,
    'Researcher / Investigator ' as title;
     select 
    'These are scientific professionals and medical experts who design and conduct studies related to diabetes management and treatment. Their expertise ranges from clinical research to data analysis, and they are crucial in interpreting results and guiding future research directions.Principal investigators lead the research projects, overseeing the study design, implementation, and data collection. They ensure the research adheres to ethical standards and provides valuable insights into diabetes management.' as contents;
    SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
    SELECT * from investigator_data;

    select 
    'text' as component,
    'Institution' as title;
     select 
    'The researchers and investigators are associated with various institutions, including universities, research institutes, and hospitals. These institutions provide the necessary resources, facilities, and support for conducting high-quality research. Each institution brings its unique strengths and expertise to the collaborative research efforts.' as contents;
    SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
    SELECT * from institution_data;


    select 
    'text' as component,
    'Lab' as title;
     select 
    'Within these institutions, specialized labs are equipped with state-of-the-art technology to conduct diabetes research. These labs focus on different aspects of diabetes studies, such as glucose monitoring, metabolic analysis, and data processing. They play a critical role in executing experiments, analyzing samples, and generating data that drive research conclusions.' as contents;
    SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
    SELECT * from lab_data;

      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }

  "drh/study_related_data.sql"() {
    return this.SQL` 
      select 
    'text' as component,
    '
# Study and Participant Information

## Study Overview

In Continuous Glucose Monitoring (CGM) research, studies are designed to evaluate the effectiveness, accuracy, and impact of CGM systems on diabetes management. Each study aims to gather comprehensive data on glucose levels, treatment efficacy, and patient outcomes to advance our understanding of diabetes care.

### Study Details

- **Study ID**: A unique identifier assigned to each study.
- **Study Name**: The name or title of the study.
- **Start Date**: The date when the study begins.
- **End Date**: The date when the study concludes.
- **Treatment Modalities**: Different treatment methods or interventions used in the study.
- **Funding Source**: The source(s) of financial support for the study.
- **NCT Number**: ClinicalTrials.gov identifier for the study.
- **Study Description**: A description of the study’s objectives, methodology, and scope.

' as contents_md;

SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
SELECT * from study_data;

select 
    'text' as component,
    '
## Participant Information

Participants are individuals who volunteer to take part in CGM research studies. Their data is crucial for evaluating the performance of CGM systems and their impact on diabetes management.

### Participant Details

- **Participant ID**: A unique identifier assigned to each participant.
- **Study ID**: A unique identifier for the study in which the participant is involved.
- **Site ID**: The identifier for the site where the participant is enrolled.
- **Diagnosis ICD**: The diagnosis code based on the International Classification of Diseases (ICD) system.
- **Med RxNorm**: The medication code based on the RxNorm system.
- **Treatment Modality**: The type of treatment or intervention administered to the participant.
- **Gender**: The gender of the participant.
- **Race Ethnicity**: The race and ethnicity of the participant.
- **Age**: The age of the participant.
- **BMI**: The Body Mass Index (BMI) of the participant.
- **Baseline HbA1c**: The baseline Hemoglobin A1c level of the participant.
- **Diabetes Type**: The type of diabetes diagnosed for the participant.
- **Study Arm**: The study arm or group to which the participant is assigned.


' as contents_md;

SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
SELECT * from participant_data;

select 
    'text' as component,
    '

## Site Information

Research sites are locations where the studies are conducted. They include clinical settings where participants are recruited, monitored, and data is collected.

### Site Details

- **Study ID**: A unique identifier for the study associated with the site.
- **Site ID**: A unique identifier for each research site.
- **Site Name**: The name of the institution or facility where the research is carried out.
- **Site Type**: The type or category of the site (e.g., hospital, clinic).

' as contents_md;

SELECT 'table' as component, 1 as search, 1 as sort, 1 as hover, 1 as striped_rows;
SELECT * from site_data;

  
      select 
      'text' as component,
      '[Back to Home](index.sql)' as contents_md;
        `;
  }

  "drh/welcome_data.sql"(){
    return this.SQL`      
      <select 'html' as component, '<div style="height: 40px">' as html;
      <select  '<div >' as html;
      <select  '<div >' as html;
      <select  '<h1>Welcome to the Diabetes Research Hub</h1>' as html;
      <select  '<p>Advancing Diabetes Management and Treatment through Cutting-Edge Research</p>' as html;
      <select  '</div>' as html;
      <select  '<div >' as html;
      <select  '<h2>About Us</h2>' as html;
      <select  '<p>The Diabetes Research Hub is a state-of-the-art facility dedicated to advancing diabetes research. Our mission is to bring together researchers, participants, and cutting-edge technology to study and improve diabetes management and treatment.</p>' as html;
      <select  '<h2>Our Participants</h2>' as html;
      <select  '<p>Our hub consists of:</p>' as html;
      <select  '<ul>' as html;
      <select  '<li><strong>Researchers:</strong> Scientists and medical professionals from various institutions, each associated with a specific lab.</li>' as html;
      <select  '<li><strong>Participants:</strong> Individuals recruited for studies to monitor and collect data on their glucose levels using Continuous Glucose Monitoring (CGM) devices.</li>' as html;
      <select  '</ul>' as html;
      <select  '<h2>Our Studies</h2>' as html;
      <select  '<p>We conduct a variety of studies to understand the effects of different interventions on glucose levels. Our studies involve:</p>' as html;
      <select  '<ul>' as html;
      <select  '<li>Designing comprehensive study protocols.</li>' as html;
      <select  '<li>Recruiting participants across multiple sites.</li>' as html;
      <select  '<li>Equipping participants with CGM devices for continuous glucose monitoring.</li>' as html;
      <select  '</ul>' as html;
      <select  '<h2>Data Management</h2>' as html;
      <select  '<p>We utilize advanced data management techniques to ensure the accuracy and privacy of collected data. This includes:</p>' as html;
      <select  '<ul>' as html;
      <select  '<li>Integrating data from multiple CGM devices into a central database.</li>' as html;
      <select  '<li>De-identifying data to protect participant privacy.</li>' as html;
      <select  '<li>Performing detailed analysis, including mean glucose and J-index calculations.</li>' as html;
      <select  '</ul>' as html;
      <select  '<h2>Publications</h2>' as html;
      <select  '<p>Our research findings are published in reputable medical journals, contributing to the global body of knowledge on diabetes management. Collaborations between different institutions enhance the depth and breadth of our research.</p>' as html;
      <select  '</div>' as html;
      <select  '</div>' as html;
      <select  '<div>' as html;
      <select  '<p>&copy; 2024 Diabetes Research Hub. All rights reserved.</p>' as html;
      <select  '</div>' as html;

      '[Back to Home](index.sql)' as contents_md;
        `;
  }

}

if (import.meta.main) {
  const pages = new SqlPages();
  console.log(
    new spa.SQLPageAide(pages)
      .include(/\.sql$/)
      .onNonStringContents((result, _sp, method) =>
        SQLa.isSqlTextSupplier(result)
          ? result.SQL(pages.emitCtx)
          : `/* unknown result from ${method} */`
      )
      .emitformattedSQL()
      .SQL()
      .join("\n"),
  );
}