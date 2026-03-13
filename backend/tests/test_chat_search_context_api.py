import uuid


class TestChatSearchContextApi:
    # Chat search/context API contract: validation and useful ranked items for project context.

    def test_chat_search_requires_project_slug(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/chat/search")
        assert response.status_code == 400
        body = response.json()
        assert "projectSlug" in body["error"]

    def test_chat_search_returns_ranked_context_items(self, api_client, base_url):
        suffix = uuid.uuid4().hex[:8]
        project_name = f"TEST_Search_{suffix}"
        create_project = api_client.post(
            f"{base_url}/api/projects",
            json={
                "name": project_name,
                "description": "semantic/local hybrid search test",
                "agents": [{"name": "SearchAgent", "role": "qa"}],
            },
        )
        assert create_project.status_code == 201
        project = create_project.json()

        write_knowledge = api_client.put(
            f"{base_url}/api/files",
            json={
                "projectSlug": project["slug"],
                "path": "knowledge/search-hybrid.md",
                "content": "OpenClaw provenance task context semantic search local first",
            },
        )
        assert write_knowledge.status_code == 200

        create_task = api_client.post(
            f"{base_url}/api/tasks",
            json={
                "projectSlug": project["slug"],
                "title": "TEST_search_task_provenance",
                "description": "validate ranked context items",
                "status": "TODO",
            },
        )
        assert create_task.status_code == 201

        response = api_client.get(
            f"{base_url}/api/chat/search",
            params={
                "projectSlug": project["slug"],
                "query": "provenance semantic search",
                "targetAgentName": "SearchAgent",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["items"], list)
        assert len(data["items"]) > 0
        assert len(data["items"]) <= 12

        first = data["items"][0]
        assert isinstance(first["id"], str)
        assert isinstance(first["title"], str)
        assert isinstance(first["kind"], str)
        assert isinstance(first["snippet"], str)

        kinds = {item["kind"] for item in data["items"]}
        assert "project_memory" in kinds or "knowledge" in kinds or "task" in kinds
