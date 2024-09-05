import * as control from "../../pattern/info-assurance-controls/ux.sql.ts";
import * as policy from "../../pattern/info-assurance-policies/ux.sql.ts";
import * as infraAssurance from "../../pattern/infra-assurance/ux.sql.ts";
import * as infraAudit from "../../pattern/infra-audit/ux.sql.ts";

if (import.meta.main) console.log((await SQL()).join("\n"));

export async function SQL() {
  return [
    ...(await control.controlSQL()),
    ...(await policy.policySQL()),
    ...(await infraAssurance.assuranceSQL()),
    ...(await infraAudit.auditSQL()),
  ];
}

if (import.meta.main) {
  console.log((await SQL()).join("\n"));
}
