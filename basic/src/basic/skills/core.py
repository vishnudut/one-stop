import os, json
from pathlib import Path
import pandas as pd
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from basic.retrieval import build_policy_query_engine
from datetime import datetime

load_dotenv()

BASE = Path(__file__).resolve().parents[3]  # points to basic/
EMP = pd.read_csv(BASE / "data" / "employees.csv")

def _role(email:str)->Optional[str]:
    r = EMP.loc[EMP["email"]==email]
    return None if r.empty else str(r.iloc[0]["role"])

def _is_mgr_of(mgr_emp_id:int, emp_id:int)->bool:
    try:
        return bool(EMP.loc[EMP["employee_id"]==emp_id, "manager_id"].eq(mgr_emp_id).any())
    except Exception:
        return False

def check_permissions(user_email:str, user_role:str, resource:str, action:str,
                      target_employee_id:Optional[int]=None,
                      context:Optional[Dict[str,Any]]=None)->Dict[str,Any]:
    role = _role(user_email) or user_role
    allow, reasons = False, []

    if resource=="directory":
        allow=True; reasons.append("Company directory accessible to all employees (GEN-1.1).")
    elif resource=="performance_summary":
        if role in {"HR","HR Manager","HR Director","Admin"}:
            allow=True; reasons.append("HR may access all performance reviews (HR-1.2).")
        else:
            req = EMP.loc[EMP["email"]==user_email]
            if not req.empty and target_employee_id:
                if int(req.iloc[0]["employee_id"])==int(target_employee_id):
                    allow=True; reasons.append("Employees may access their own reviews (HR-1.2).")
                elif role.endswith("Manager") and _is_mgr_of(int(req.iloc[0]["employee_id"]), int(target_employee_id)):
                    allow=True; reasons.append("Managers may access reviews for direct reports (HR-1.2).")
    elif resource=="salary":
        if role in {"HR","HR Manager","HR Director","Admin"}:
            allow=True; reasons.append("Only HR/Admin may access salary (HR-1.1).")
        else:
            reasons.append("Managers/employees cannot view exact salary (HR-1.1).")
    elif resource=="financial_report":
        rt=(context or {}).get("report_type","")
        if role in {"Finance","CFO","CEO"}:
            allow=True; reasons.append("Finance/executives may access financial reports (FIN-1.1).")
        elif role=="Executive" and rt=="quarterly":
            allow=True; reasons.append("Executives may access quarterly summaries (FIN-1.1).")
        else:
            reasons.append("Non-finance access requires CFO approval (FIN-1.1).")

    qe, client = build_policy_query_engine()
    rag = qe.query(f"Which policy governs {resource} access for role {role}? Cite section.").response
    client.close()

    return {
        "allow": allow,
        "reason": " ".join(reasons) + (f" Policy note: {rag}" if rag else ""),
        "policy_ref": "Policies",
    }

def fetch_data(resource:str, filters:Optional[Dict[str,Any]]=None)->Dict[str,Any]:
    df = EMP.copy()
    if resource=="directory":
        df = df[["employee_id","name","email","department","role","manager_id","home_city"]]
    elif resource=="salary":
        df = df[["employee_id","name","salary"]]
    elif resource=="performance_summary":
        df = df[["employee_id","name","performance_rating","performance_summary"]]
    else:
        df = df.head(0)
    if filters:
        for k,v in filters.items():
            if k in df.columns: df = df[df[k]==v]
    return {"rows": df.to_dict(orient="records")}

def audit_log(entry:Dict[str,Any]|None=None)->str:
    (BASE / "logs").mkdir(exist_ok=True)
    safe = entry or {}
    safe.setdefault("timestamp", datetime.utcnow().isoformat() + "Z")
    with open(BASE / "logs" / "audit.jsonl","a") as f:
        f.write(json.dumps(safe) + "\n")
    return "ok"
