#!/usr/bin/env python3
"""
Debug script to diagnose RAG/Weaviate issues
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent / "src"))

load_dotenv()

def test_environment():
    """Test if required environment variables are set"""
    print("=== Environment Variables ===")
    required_vars = ["WEAVIATE_URL", "WEAVIATE_API_KEY", "OPENAI_API_KEY"]

    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Mask API keys for security
            if "API_KEY" in var:
                print(f"✅ {var}: {value[:8]}...{value[-4:] if len(value) > 12 else '***'}")
            else:
                print(f"✅ {var}: {value}")
        else:
            print(f"❌ {var}: NOT SET")
    print()

def test_weaviate_connection():
    """Test basic Weaviate connection"""
    print("=== Testing Weaviate Connection ===")
    try:
        import weaviate
        from weaviate.classes.init import Auth

        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=os.environ["WEAVIATE_URL"],
            auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
        )

        print("✅ Connected to Weaviate successfully")

        # Check if Policies collection exists
        if client.collections.exists("Policies"):
            print("✅ 'Policies' collection exists")

            # Get collection info
            policies = client.collections.get("Policies")
            count = policies.aggregate.over_all(total_count=True).total_count
            print(f"✅ Collection has {count} documents")

            if count > 0:
                # Get a sample document
                sample = policies.query.fetch_objects(limit=1)
                if sample.objects:
                    obj = sample.objects[0]
                    print(f"✅ Sample document: {obj.properties.get('title', 'No title')}")
                    print(f"   Section: {obj.properties.get('section', 'No section')}")
                    print(f"   Text preview: {obj.properties.get('text', '')[:100]}...")
            else:
                print("⚠️  Collection is empty - run bootstrap_policies.py first")
        else:
            print("❌ 'Policies' collection does not exist - run bootstrap_policies.py first")

        client.close()
        return True

    except Exception as e:
        print(f"❌ Weaviate connection failed: {e}")
        return False

    print()

def test_llamaindex_integration():
    """Test LlamaIndex integration with Weaviate"""
    print("=== Testing LlamaIndex Integration ===")
    try:
        from basic.retrieval import build_policy_query_engine

        qe, client = build_policy_query_engine()
        print("✅ Query engine created successfully")

        # Test queries
        test_queries = [
            "salary access policy",
            "HR role permissions",
            "performance review access",
            "Which policy governs salary access for role HR?",
            "employee data access"
        ]

        for query in test_queries:
            print(f"\n🔍 Testing query: '{query}'")
            try:
                response = qe.query(query)
                if response and hasattr(response, 'response') and response.response:
                    print(f"✅ Response: {response.response[:200]}...")
                else:
                    print("❌ Empty response")
            except Exception as e:
                print(f"❌ Query failed: {e}")

        client.close()
        return True

    except Exception as e:
        print(f"❌ LlamaIndex integration failed: {e}")
        return False

    print()

def test_specific_salary_query():
    """Test the specific query that's failing"""
    print("=== Testing Specific Salary Query ===")
    try:
        from basic.retrieval import build_policy_query_engine

        qe, client = build_policy_query_engine()

        # This is the exact query from core.py
        resource = "salary"
        role = "HR"
        query = f"Which policy governs {resource} access for role {role}? Cite section."

        print(f"🔍 Exact query from core.py: '{query}'")

        response = qe.query(query)
        print(f"Response type: {type(response)}")
        print(f"Response object: {response}")

        if hasattr(response, 'response'):
            print(f"Response.response: '{response.response}'")
            print(f"Response.response type: {type(response.response)}")
            print(f"Response.response bool: {bool(response.response)}")

        if hasattr(response, 'source_nodes'):
            print(f"Source nodes count: {len(response.source_nodes)}")
            for i, node in enumerate(response.source_nodes[:3]):
                print(f"  Node {i+1}: {node.text[:100]}...")

        client.close()

    except Exception as e:
        print(f"❌ Specific query test failed: {e}")

    print()

def test_direct_weaviate_search():
    """Test direct Weaviate vector search"""
    print("=== Testing Direct Weaviate Search ===")
    try:
        import weaviate
        from weaviate.classes.init import Auth
        from weaviate.classes.query import MetadataQuery

        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=os.environ["WEAVIATE_URL"],
            auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
        )

        policies = client.collections.get("Policies")

        # Test different search methods
        print("1. Keyword search for 'salary':")
        results = policies.query.bm25(query="salary", limit=3)
        for i, obj in enumerate(results.objects):
            print(f"  Result {i+1}: {obj.properties.get('section')} - {obj.properties.get('title')}")

        print("\n2. Vector similarity search:")
        results = policies.query.near_text(query="salary access HR", limit=3)
        for i, obj in enumerate(results.objects):
            print(f"  Result {i+1}: {obj.properties.get('section')} - {obj.properties.get('title')}")

        print("\n3. Filter by role:")
        results = policies.query.where(
            lambda x: x.contains("roles_allowed", "HR")
        ).limit(3)
        for i, obj in enumerate(results.objects):
            print(f"  Result {i+1}: {obj.properties.get('section')} - {obj.properties.get('title')}")

        client.close()

    except Exception as e:
        print(f"❌ Direct Weaviate search failed: {e}")

    print()

def main():
    print("🔍 RAG Debugging Script")
    print("=" * 50)

    # Run all tests
    test_environment()

    if test_weaviate_connection():
        test_llamaindex_integration()
        test_specific_salary_query()
        test_direct_weaviate_search()

    print("=" * 50)
    print("🏁 Debug complete")

if __name__ == "__main__":
    main()
