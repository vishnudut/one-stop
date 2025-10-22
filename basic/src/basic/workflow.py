import os
from dotenv import load_dotenv

from llama_index.core import Settings
from llama_index.core.agent.workflow import FunctionAgent
from llama_index.core.workflow import step, Workflow, StartEvent, StopEvent
from basic.skills.policy_skill import TOOLS

load_dotenv()

# --- LLM (OpenAI) ---
from llama_index.llms.openai import OpenAI

# Use OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")

Settings.llm = OpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    api_key=openai_api_key,
    temperature=0.1,
    max_tokens=2048,
)

# SYSTEM = """You are a Compliance-Aware Data Concierge.
# - Always call check_permissions() BEFORE fetch_data().
# - If denied, explain briefly and do NOT call fetch_data().
# - If allowed, call fetch_data(), then audit_log() with {user_email, role, resource, action, decision, policy_ref}.
# - Default to least privilege and include a short policy note when possible.
# """
#

SYSTEM = """You are a Compliance-Aware Data Concierge.

Policy:
- Always call check_permissions() BEFORE fetch_data().
- If denied: reply briefly with the reason + policy section; DO NOT call fetch_data() or audit_log().
- If allowed: call fetch_data(), THEN call audit_log(entry=<dict>) with ALL fields below.

audit_log(entry) REQUIRED fields example:
{
  "user_email": "<string>",
  "role": "<string>",
  "resource": "<string>",          # e.g., "performance_summary"
  "action": "<string>",            # e.g., "read"
  "filters": {"employee_id": 101}, # if applicable
  "decision": "allow|deny",
  "policy_section": "<e.g., HR-1.2>",
  "policy_ref": "Policies",
  "rows_returned": <int>,          # number of rows returned from fetch_data
  "timestamp": "<iso8601>"
}

Be concise. Default to least privilege. Include a short policy note (quote or section id)."""


agent = FunctionAgent(llm=Settings.llm, tools=TOOLS, system_prompt=SYSTEM)

class ConciergeWorkflow(Workflow):
    @step
    async def gate_and_answer(self, ev: StartEvent) -> StopEvent:
        # Debug: print what we received
        print(f"DEBUG: ev type = {type(ev)}")
        print(f"DEBUG: dict(ev) = {dict(ev)}")
        print(f"DEBUG: hasattr 'message' = {hasattr(ev, 'message')}")
        print(f"DEBUG: hasattr 'input' = {hasattr(ev, 'input')}")

        # Try to get message from various possible locations
        msg = ""
        if hasattr(ev, "message"):
            msg = ev.message
        elif hasattr(ev, "input") and isinstance(ev.input, dict):
            msg = ev.input.get("message", "")

        if not msg:
            return StopEvent(result={
                "error": "missing 'message' in input",
                "debug_received": dict(ev)
            })

        try:
            print(f"DEBUG: Calling agent with message: {msg[:100]}...")
            result = await agent.run(user_msg=msg)
            print(f"DEBUG: Agent result: {str(result)[:200]}...")
            return StopEvent(result={"answer": str(result)})
        except Exception as e:
            import traceback
            error_details = {
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc()
            }
            print(f"DEBUG: Exception occurred: {error_details}")
            return StopEvent(result=error_details)

wf = ConciergeWorkflow()
# give it a nicer URL name (optional)
# wf.name = "concierge"
