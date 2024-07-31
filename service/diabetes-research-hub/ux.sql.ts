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
        ;

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