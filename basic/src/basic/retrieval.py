import os
import weaviate
from weaviate.classes.init import Auth
from llama_index.core import VectorStoreIndex
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.schema import Document, NodeWithScore, QueryBundle
from llama_index.core.retrievers import BaseRetriever
from typing import List
from dotenv import load_dotenv

load_dotenv()

class WeaviateDirectRetriever(BaseRetriever):
    """
    Direct Weaviate retriever that bypasses embedding compatibility issues
    by using Weaviate's native search capabilities.
    """

    def __init__(self, weaviate_client, collection_name: str = "Policies", top_k: int = 5):
        super().__init__()
        self.client = weaviate_client
        self.collection_name = collection_name
        self.top_k = top_k
        self.collection = self.client.collections.get(collection_name)

    def _retrieve(self, query_bundle: QueryBundle) -> List[NodeWithScore]:
        """Retrieve documents using Weaviate's native near_text search"""
        query_str = query_bundle.query_str

        try:
            # Use Weaviate's built-in vectorization with near_text
            results = self.collection.query.near_text(
                query=query_str,
                limit=self.top_k,
                return_metadata=['distance']
            )

            nodes = []
            for obj in results.objects:
                # Extract properties
                title = obj.properties.get('title', '')
                section = obj.properties.get('section', '')
                text = obj.properties.get('text', '')

                # Create comprehensive document text
                doc_text = f"Title: {title}\nSection: {section}\nContent: {text}"

                # Calculate score from distance (convert distance to similarity)
                distance = getattr(obj.metadata, 'distance', 1.0) if hasattr(obj, 'metadata') else 1.0
                score = max(0.0, 1.0 - distance)

                # Create document node
                doc = Document(
                    text=doc_text,
                    metadata={
                        'title': title,
                        'section': section,
                        'uuid': str(obj.uuid),
                        **{k: v for k, v in obj.properties.items() if k not in ['title', 'section', 'text']}
                    }
                )

                node_with_score = NodeWithScore(node=doc, score=score)
                nodes.append(node_with_score)

            return nodes

        except Exception as e:
            print(f"Error in Weaviate retrieval: {e}")
            return []

def build_policy_query_engine():
    """
    Build a policy query engine using direct Weaviate integration.
    This avoids the embedding dimension mismatch issue.
    """
    try:
        # Connect to Weaviate
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=os.environ["WEAVIATE_URL"],
            auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
        )

        # Verify collection exists
        if not client.collections.exists("Policies"):
            raise ValueError("Policies collection not found. Run bootstrap_policies.py first.")

        # Create custom retriever
        retriever = WeaviateDirectRetriever(
            weaviate_client=client,
            collection_name="Policies",
            top_k=5
        )

        # Create query engine with the custom retriever
        query_engine = RetrieverQueryEngine(retriever=retriever)

        return query_engine, client

    except Exception as e:
        print(f"Error building query engine: {e}")
        raise

def simple_policy_search(query: str) -> str:
    """
    Simple function to search policies and return formatted results.
    This is used as a fallback when the main query engine fails.
    """
    try:
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=os.environ["WEAVIATE_URL"],
            auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
        )

        if not client.collections.exists("Policies"):
            return "Policy database not available"

        collection = client.collections.get("Policies")

        # Search using Weaviate's native capabilities
        results = collection.query.near_text(query=query, limit=3)

        if not results.objects:
            client.close()
            return "No relevant policies found"

        # Format the best result
        best = results.objects[0]
        title = best.properties.get('title', 'Unknown')
        section = best.properties.get('section', 'N/A')
        text = best.properties.get('text', '')[:200]

        response = f"{title} ({section}): {text}..."

        client.close()
        return response

    except Exception as e:
        return f"Policy search error: {str(e)}"

if __name__ == "__main__":
    # Test the implementation
    try:
        qe, client = build_policy_query_engine()

        test_query = "salary access policy for HR role"
        print(f"Testing query: {test_query}")

        response = qe.query(test_query)
        print(f"Response: {response.response}")

        client.close()
        print("✅ Test successful!")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        # Try fallback
        result = simple_policy_search("salary access HR")
        print(f"Fallback result: {result}")
