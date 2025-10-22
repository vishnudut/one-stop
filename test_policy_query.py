# tests/test_policy_query.py
import os
from app.retrieval import build_policy_query_engine

qe, client = build_policy_query_engine()
resp = qe.query("Who may access performance reviews?")
print(resp)  # should pull HR-1.2 text
client.close()
