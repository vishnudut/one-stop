#!/usr/bin/env python3
"""
Test embedding compatibility between LlamaIndex and Weaviate
"""
import os
import sys
from pathlib import Path
import numpy as np
from dotenv import load_dotenv

# Add the src directory to the path
sys.path.insert(0, str(Path(__file__).parent / "src"))

load_dotenv()

def test_llamaindex_embeddings():
    """Test what embedding model LlamaIndex is using"""
    print("=== Testing LlamaIndex Embeddings ===")

    try:
        from llama_index.core import Settings

        # Check current embedding model
        if Settings.embed_model:
            print(f"Current embed model: {Settings.embed_model}")
            print(f"Embed model type: {type(Settings.embed_model)}")

            # Test embedding generation
            test_text = "salary access policy for HR role"
            embedding = Settings.embed_model.get_text_embedding(test_text)
            print(f"Generated embedding dimensions: {len(embedding)}")
            print(f"First few values: {embedding[:5]}")

        else:
            print("⚠️ No embedding model configured in LlamaIndex Settings")

            # Try to create default embedding
            from llama_index.embeddings.openai import OpenAIEmbedding
            embed_model = OpenAIEmbedding()
            Settings.embed_model = embed_model

            print("✅ Set OpenAI embedding model as default")
            test_text = "salary access policy for HR role"
            embedding = embed_model.get_text_embedding(test_text)
            print(f"OpenAI embedding dimensions: {len(embedding)}")
            print(f"First few values: {embedding[:5]}")

    except Exception as e:
        print(f"❌ LlamaIndex embedding test failed: {e}")
        import traceback
        traceback.print_exc()

def test_weaviate_embeddings():
    """Test what embeddings Weaviate has stored"""
    print("\n=== Testing Weaviate Stored Embeddings ===")

    try:
        import weaviate
        from weaviate.classes.init import Auth

        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=os.environ["WEAVIATE_URL"],
            auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
        )

        policies = client.collections.get("Policies")

        # Get a document with its vector
        sample = policies.query.fetch_objects(limit=1, include_vector=True)
        if sample.objects:
            obj = sample.objects[0]
            if hasattr(obj, 'vector') and obj.vector:
                vector = obj.vector['default']  # Weaviate stores vectors under 'default'
                print(f"Weaviate vector dimensions: {len(vector)}")
                print(f"First few values: {vector[:5]}")
                print(f"Vector type: {type(vector)}")

                # Check if it's a valid vector (not all zeros)
                if all(v == 0 for v in vector):
                    print("⚠️ Vector is all zeros - might not be properly generated")
                else:
                    print("✅ Vector contains non-zero values")

        client.close()

    except Exception as e:
        print(f"❌ Weaviate embedding test failed: {e}")

def test_embedding_compatibility():
    """Test if LlamaIndex and Weaviate embeddings are compatible"""
    print("\n=== Testing Embedding Compatibility ===")

    try:
        # Test LlamaIndex with explicit OpenAI embeddings
        from llama_index.core import Settings
        from llama_index.embeddings.openai import OpenAIEmbedding

        # Force OpenAI embeddings
        openai_embed = OpenAIEmbedding(model="text-embedding-3-small")
        Settings.embed_model = openai_embed

        test_text = "Employee Salary Access Only HR and Admin roles may access employee salary information"
        llamaindex_embedding = openai_embed.get_text_embedding(test_text)

        print(f"LlamaIndex OpenAI embedding dimensions: {len(llamaindex_embedding)}")

        # Now test if we can query with this
        from basic.retrieval import build_policy_query_engine

        qe, client = build_policy_query_engine()

        # Test a simple query
        response = qe.query("salary access")
        print(f"Query response: {response.response}")
        print(f"Source nodes: {len(response.source_nodes)}")

        for i, node in enumerate(response.source_nodes):
            print(f"  Node {i+1} score: {node.score}")
            print(f"  Node {i+1} text: {node.text[:100]}...")

        client.close()

    except Exception as e:
        print(f"❌ Compatibility test failed: {e}")
        import traceback
        traceback.print_exc()

def test_manual_vector_store():
    """Test creating vector store manually without LlamaIndex"""
    print("\n=== Testing Manual Vector Store Creation ===")

    try:
        import weaviate
        from weaviate.classes.init import Auth
        from llama_index.embeddings.openai import OpenAIEmbedding

        # Create embedding model
        embed_model = OpenAIEmbedding(model="text-embedding-3-small")

        # Connect to Weaviate
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=os.environ["WEAVIATE_URL"],
            auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
        )

        policies = client.collections.get("Policies")

        # Get a document and manually compute similarity
        sample = policies.query.fetch_objects(limit=1)
        if sample.objects:
            doc_text = sample.objects[0].properties['text']
            print(f"Sample document: {doc_text[:100]}...")

            # Generate embedding for query
            query = "salary access HR"
            query_embedding = embed_model.get_text_embedding(query)

            # Search using the embedding
            results = policies.query.near_vector(
                near_vector=query_embedding,
                limit=3,
                return_metadata=['distance']
            )

            print(f"Manual vector search results:")
            for i, obj in enumerate(results.objects):
                distance = obj.metadata.distance if hasattr(obj.metadata, 'distance') else 'unknown'
                print(f"  Result {i+1}: {obj.properties.get('section')} - {obj.properties.get('title')} (distance: {distance})")

        client.close()

    except Exception as e:
        print(f"❌ Manual vector store test failed: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("🔍 Embedding Compatibility Testing")
    print("=" * 60)

    test_llamaindex_embeddings()
    test_weaviate_embeddings()
    test_embedding_compatibility()
    test_manual_vector_store()

    print("\n" + "=" * 60)
    print("🏁 Embedding tests complete")

if __name__ == "__main__":
    main()
