#!/usr/bin/env python3
"""
Debug script to test permission checking for Grace Patel's salary access
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent / "src"))

load_dotenv()

def test_role_resolution():
    """Test how roles are resolved from the CSV"""
    print("=== Testing Role Resolution ===")

    try:
        from basic.skills.core import _role, EMP

        print(f"Employee CSV shape: {EMP.shape}")
        print(f"Columns: {list(EMP.columns)}")

        # Check Grace Patel specifically
        grace_email = "grace.patel@company.com"
        grace_role_from_csv = _role(grace_email)

        print(f"\n🔍 Grace Patel lookup:")
        print(f"Email: {grace_email}")
        print(f"Role from CSV: {grace_role_from_csv}")

        # Show the actual row data
        grace_row = EMP.loc[EMP["email"] == grace_email]
        if not grace_row.empty:
            print(f"Full row data:")
            for col in EMP.columns:
                print(f"  {col}: {grace_row.iloc[0][col]}")
        else:
            print("❌ No row found for Grace Patel!")

        # Test a few other users
        test_users = [
            "alice.chen@company.com",
            "lisa.brown@company.com",  # HR Director
            "nancy.chen@company.com"   # CTO
        ]

        for email in test_users:
            role = _role(email)
            print(f"  {email} -> {role}")

    except Exception as e:
        print(f"❌ Error in role resolution test: {e}")
        import traceback
        traceback.print_exc()

def test_permission_check():
    """Test the specific permission check that's failing"""
    print("\n=== Testing Permission Check ===")

    try:
        from basic.skills.core import check_permissions

        # Test the exact scenario from the UI
        user_email = "grace.patel@company.com"
        user_role = "HR"  # This is what the UI is sending
        resource = "salary"
        action = "read"
        target_employee_id = 101  # Alice Chen

        print(f"🔍 Testing permission check:")
        print(f"User Email: {user_email}")
        print(f"User Role (from UI): {user_role}")
        print(f"Resource: {resource}")
        print(f"Action: {action}")
        print(f"Target Employee ID: {target_employee_id}")

        result = check_permissions(
            user_email=user_email,
            user_role=user_role,
            resource=resource,
            action=action,
            target_employee_id=target_employee_id
        )

        print(f"\n📋 Permission Check Result:")
        print(f"Allow: {result['allow']}")
        print(f"Reason: {result['reason']}")
        print(f"Policy Ref: {result['policy_ref']}")

        # Also test with the role from CSV
        from basic.skills.core import _role
        csv_role = _role(user_email)

        if csv_role and csv_role != user_role:
            print(f"\n🔄 Testing with CSV role ({csv_role}):")
            result2 = check_permissions(
                user_email=user_email,
                user_role=csv_role,
                resource=resource,
                action=action,
                target_employee_id=target_employee_id
            )

            print(f"Allow: {result2['allow']}")
            print(f"Reason: {result2['reason']}")

    except Exception as e:
        print(f"❌ Error in permission check test: {e}")
        import traceback
        traceback.print_exc()

def test_different_hr_roles():
    """Test different variations of HR roles"""
    print("\n=== Testing Different HR Role Variations ===")

    try:
        from basic.skills.core import check_permissions

        user_email = "grace.patel@company.com"
        resource = "salary"
        action = "read"
        target_employee_id = 101

        # Test different role variations
        role_variations = [
            "HR",
            "HR Manager",
            "HR Director",
            "Admin",
            "hr",  # lowercase
            "Hr Manager"  # mixed case
        ]

        for role in role_variations:
            print(f"\n🧪 Testing role: '{role}'")
            result = check_permissions(
                user_email=user_email,
                user_role=role,
                resource=resource,
                action=action,
                target_employee_id=target_employee_id
            )
            print(f"  Allow: {result['allow']}")
            print(f"  Reason: {result['reason'][:100]}...")

    except Exception as e:
        print(f"❌ Error in HR role variation test: {e}")
        import traceback
        traceback.print_exc()

def test_rag_query():
    """Test if the RAG query is affecting the permission result"""
    print("\n=== Testing RAG Query Impact ===")

    try:
        from basic.retrieval import build_policy_query_engine

        qe, client = build_policy_query_engine()

        # This is the exact query from the permission check
        query = "Which policy governs salary access for role HR Manager? Cite section."
        print(f"🔍 RAG Query: {query}")

        response = qe.query(query)
        print(f"📄 RAG Response: {response.response}")

        # Test a few variations
        queries = [
            "salary access HR",
            "HR Manager salary permissions",
            "Employee Salary Access policy HR-1.1"
        ]

        for q in queries:
            resp = qe.query(q)
            print(f"  '{q}' -> {resp.response[:100]}...")

        client.close()

    except Exception as e:
        print(f"❌ Error in RAG query test: {e}")
        import traceback
        traceback.print_exc()

def test_workflow_integration():
    """Test the workflow with Grace Patel's exact request"""
    print("\n=== Testing Workflow Integration ===")

    try:
        import asyncio
        from basic.workflow import wf

        # The exact message that failed
        message = "[user_email=grace.patel@company.com; role=HR] How much salary does this person get?"

        print(f"🔍 Testing message: {message}")

        async def run_test():
            input_data = {"message": message}
            result = await wf.run(input=input_data)
            return result

        result = asyncio.run(run_test())

        print(f"📋 Workflow Result:")
        if "error" in result:
            print(f"❌ Error: {result['error']}")
        else:
            answer = result.get("answer", "No answer")
            print(f"✅ Answer: {answer}")

    except Exception as e:
        print(f"❌ Error in workflow test: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Run all debug tests"""
    print("🔍 Debug: Grace Patel Salary Access Issue")
    print("=" * 60)

    test_role_resolution()
    test_permission_check()
    test_different_hr_roles()
    test_rag_query()
    test_workflow_integration()

    print("\n" + "=" * 60)
    print("🏁 Debug complete")

if __name__ == "__main__":
    main()
