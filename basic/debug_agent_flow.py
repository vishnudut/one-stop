#!/usr/bin/env python3
"""
Debug script to trace exactly what happens in the agent when processing the ambiguous query
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent / "src"))

load_dotenv()

async def trace_agent_execution():
    """Trace what happens when the agent processes the ambiguous query"""
    print("🔍 Tracing Agent Execution for Ambiguous Query")
    print("=" * 60)

    try:
        from basic.workflow import agent

        # The exact query that's failing
        query = "[user_email=grace.patel@company.com; role=HR] How much salary does this person get?"

        print(f"📝 Input Query: {query}")
        print(f"🤖 Agent System Prompt:")
        print(f"   {agent.system_prompt[:200]}...")

        print(f"\n🛠️  Available Tools:")
        for tool in agent.tools:
            print(f"   - {tool.metadata.name}: {tool.metadata.description}")

        print(f"\n🔄 Running agent...")

        # Run the agent and capture the result
        result = await agent.run(user_msg=query)

        print(f"📄 Agent Result:")
        print(f"   Type: {type(result)}")
        print(f"   Content: {str(result)}")

        # Let's also test with a more specific query
        specific_query = "[user_email=grace.patel@company.com; role=HR] Show salary for employee_id 101"
        print(f"\n🔄 Testing with specific query: {specific_query}")

        result2 = await agent.run(user_msg=specific_query)
        print(f"📄 Specific Query Result:")
        print(f"   Content: {str(result2)}")

    except Exception as e:
        print(f"❌ Error in agent execution: {e}")
        import traceback
        traceback.print_exc()

def analyze_query_parsing():
    """Analyze how the agent might be parsing the query"""
    print("\n=== Query Analysis ===")

    ambiguous_query = "How much salary does this person get?"
    specific_query = "Show salary for employee_id 101"

    print(f"🔍 Ambiguous: '{ambiguous_query}'")
    print("   - Missing: employee identifier")
    print("   - Context reference: 'this person' (ambiguous)")
    print("   - Resource: salary (clear)")
    print("   - Action: get/show (clear)")

    print(f"\n🎯 Specific: '{specific_query}'")
    print("   - Employee ID: 101 (clear)")
    print("   - Resource: salary (clear)")
    print("   - Action: show (clear)")

    # Analyze what the tools might do
    print(f"\n🛠️  Tool Analysis:")
    print("   check_permissions() needs:")
    print("     - user_email: ✅ (from message prefix)")
    print("     - user_role: ✅ (from message prefix)")
    print("     - resource: ❓ (must be inferred from 'salary')")
    print("     - action: ❓ (must be inferred from 'get')")
    print("     - target_employee_id: ❌ (missing from ambiguous query)")

    print("   fetch_data() needs:")
    print("     - resource: ❓ (must be inferred)")
    print("     - filters: ❌ (no employee_id specified)")

def test_permission_scenarios():
    """Test different permission scenarios manually"""
    print("\n=== Permission Scenarios ===")

    try:
        from basic.skills.core import check_permissions, fetch_data

        # Scenario 1: HR asking for salary without specifying employee
        print("🧪 Scenario 1: HR asking for salary (no employee specified)")
        result1 = check_permissions(
            user_email="grace.patel@company.com",
            user_role="HR",
            resource="salary",
            action="read",
            target_employee_id=None  # This is the problem!
        )
        print(f"   Result: Allow={result1['allow']}, Reason={result1['reason'][:100]}...")

        # Scenario 2: HR asking for specific employee salary
        print("\n🧪 Scenario 2: HR asking for specific employee salary")
        result2 = check_permissions(
            user_email="grace.patel@company.com",
            user_role="HR",
            resource="salary",
            action="read",
            target_employee_id=101
        )
        print(f"   Result: Allow={result2['allow']}, Reason={result2['reason'][:100]}...")

        # Test fetch_data scenarios
        print("\n🧪 Data Fetch Test 1: salary without filters")
        data1 = fetch_data(resource="salary", filters=None)
        print(f"   Rows returned: {len(data1['rows'])}")

        print("\n🧪 Data Fetch Test 2: salary with employee filter")
        data2 = fetch_data(resource="salary", filters={"employee_id": 101})
        print(f"   Rows returned: {len(data2['rows'])}")
        if data2['rows']:
            print(f"   Sample: {data2['rows'][0]}")

    except Exception as e:
        print(f"❌ Error in permission scenarios: {e}")
        import traceback
        traceback.print_exc()

def suggest_fixes():
    """Suggest specific fixes for the issue"""
    print("\n=== Suggested Fixes ===")

    print("🔧 Fix 1: Improve Query Parsing")
    print("   - Modify agent system prompt to require specific employee IDs")
    print("   - Add validation: reject queries without employee identifiers")
    print("   - Suggest proper format: 'Show salary for employee_id X'")

    print("\n🔧 Fix 2: Context Memory (UI Level)")
    print("   - Store last queried employee ID in thread context")
    print("   - When user says 'this person', substitute with last employee ID")
    print("   - Format: 'Show salary for employee_id {last_queried_id}'")

    print("\n🔧 Fix 3: Better Error Messages")
    print("   - When no employee specified: 'Please specify employee_id'")
    print("   - Provide examples of valid queries")
    print("   - Guide users to be more specific")

    print("\n🔧 Fix 4: Agent Tool Enhancement")
    print("   - Make target_employee_id required for salary/performance queries")
    print("   - Add parameter validation in check_permissions()")
    print("   - Return clearer error when employee ID missing")

async def main():
    """Run all debug tests"""
    print("🚀 Agent Flow Debug")
    print("=" * 60)

    analyze_query_parsing()
    test_permission_scenarios()
    await trace_agent_execution()
    suggest_fixes()

    print("\n" + "=" * 60)
    print("🏁 Debug complete")
    print("\n💡 Summary: The issue is that 'this person' is ambiguous.")
    print("   The agent can't determine which employee to check permissions for.")
    print("   Solution: Require specific employee IDs or implement context memory.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
