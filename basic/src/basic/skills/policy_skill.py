from llama_index.core.tools import FunctionTool
from .core import check_permissions, fetch_data, audit_log

TOOLS = [
    FunctionTool.from_defaults(check_permissions, name="check_permissions",
                               description="Check policy to allow/deny access."),
    FunctionTool.from_defaults(fetch_data, name="fetch_data",
                               description="Fetch data rows when allowed."),
    FunctionTool.from_defaults(audit_log, name="audit_log",
                               description="Append an audit entry.")
]
