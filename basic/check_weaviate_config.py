#!/usr/bin/env python3
"""
Check Weaviate collection configuration to debug LlamaIndex integration
"""
import os
import weaviate
from weaviate.classes.init import Auth
from dotenv import load_dotenv

load_dotenv()

def check_weaviate_config():
    """Check the Policies collection configuration"""
    try:
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=os.environ["WEAVIATE_URL"],
            auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
        )

        print("=== Weaviate Collection Configuration ===")

        if not client.collections.exists("Policies"):
            print("❌ Policies collection does not exist")
            return

        policies = client.collections.get("Policies")

        # Get collection configuration
        config = policies.config.get()
        print(f"Collection name: {config.name}")
        print(f"Vector config: {config.vector_config}")
        print(f"Vectorizer config: {config.vectorizer_config}")

        # Check if vectorizer is properly configured
        if config.vectorizer_config:
            print(f"Vectorizer type: {type(config.vectorizer_config)}")
            print(f"Vectorizer details: {config.vectorizer_config}")
        else:
            print("⚠️ No vectorizer configuration found")

        # Check vector dimensions
        if hasattr(config.vector_config, 'vector_index_config'):
            print(f"Vector index config: {config.vector_config.vector_index_config}")

        # Get a sample object to check if it has vectors
        sample = policies.query.fetch_objects(limit=1, include_vector=True)
        if sample.objects:
            obj = sample.objects[0]
            print(f"\n=== Sample Object ===")
            print(f"UUID: {obj.uuid}")
            print(f"Properties keys: {list(obj.properties.keys())}")

            if hasattr(obj, 'vector') and obj.vector:
                print(f"✅ Object has vector (length: {len(obj.vector['default']) if 'default' in obj.vector else 'unknown'})")
            else:
                print("❌ Object has no vector - this is the problem!")

        # Test vector search directly
        print(f"\n=== Testing Vector Search ===")
        try:
            results = policies.query.near_text(
                query="salary access",
                limit=1,
                return_metadata=['distance']
            )
            if results.objects:
                obj = results.objects[0]
                distance = obj.metadata.distance if hasattr(obj.metadata, 'distance') else 'unknown'
                print(f"✅ Vector search works - found: {obj.properties.get('title')} (distance: {distance})")
            else:
                print("❌ Vector search returned no results")
        except Exception as e:
            print(f"❌ Vector search failed: {e}")

        # Check what vectorizer is being used
        print(f"\n=== Vectorizer Details ===")
        try:
            # Get cluster metadata
            cluster_meta = client.cluster.get_nodes_status()
            print(f"Cluster nodes: {len(cluster_meta)}")

            # Check available modules
            meta = client.get_meta()
            if 'modules' in meta:
                print(f"Available modules: {list(meta['modules'].keys())}")

        except Exception as e:
            print(f"Could not get cluster metadata: {e}")

        client.close()

    except Exception as e:
        print(f"❌ Error checking configuration: {e}")

if __name__ == "__main__":
    check_weaviate_config()
