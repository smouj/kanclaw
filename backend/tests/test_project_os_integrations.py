import time
import uuid


class TestProjectOsIntegrations:
    # Project OS premium API flows: chat persistence/offline honesty, GitHub connector, snapshots, filesystem metadata

    def test_chat_persists_messages_and_returns_offline_error(self, api_client, base_url):
        suffix = uuid.uuid4().hex[:8]
        project_name = f"TEST_Chat_{suffix}"
        create_project = api_client.post(
            f"{base_url}/api/projects",
            json={
                "name": project_name,
                "description": "chat offline test",
                "agents": [{"name": "AgentQA", "role": "qa"}],
            },
        )
        assert create_project.status_code == 201
        project = create_project.json()

        threads_response = api_client.get(
            f"{base_url}/api/chat",
            params={"projectSlug": project["slug"]},
        )
        assert threads_response.status_code == 200
        threads = threads_response.json()
        assert isinstance(threads, list)
        assert len(threads) >= 1
        thread_id = threads[0]["id"]

        send_response = api_client.post(
            f"{base_url}/api/chat",
            json={
                "projectSlug": project["slug"],
                "threadId": thread_id,
                "targetAgentName": "AgentQA",
                "content": "TEST offline persistence check",
            },
        )
        assert send_response.status_code == 503
        assert "OpenClaw no está disponible" in send_response.json()["error"]

        # Give async persistence a short moment.
        time.sleep(1)
        refreshed_threads_response = api_client.get(
            f"{base_url}/api/chat",
            params={"projectSlug": project["slug"]},
        )
        assert refreshed_threads_response.status_code == 200
        refreshed_threads = refreshed_threads_response.json()
        selected = [item for item in refreshed_threads if item["id"] == thread_id][0]
        messages = selected["messages"]
        assert any(msg["role"] == "human" and "offline persistence check" in msg["content"] for msg in messages)
        assert any(msg["role"] == "system" and "OpenClaw no está disponible" in msg["content"] for msg in messages)

    def test_github_connector_status_connected(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/connectors/github")
        assert response.status_code == 200
        data = response.json()
        assert data["connected"] is True
        assert data["mode"] == "PAT"
        assert isinstance(data["username"], str)
        assert len(data["username"]) > 0

    def test_github_repositories_and_preview(self, api_client, base_url):
        repos_response = api_client.get(f"{base_url}/api/connectors/github/repositories")
        assert repos_response.status_code == 200
        repositories = repos_response.json()
        assert isinstance(repositories, list)
        assert len(repositories) > 0

        first_repo = repositories[0]
        assert isinstance(first_repo["owner"], str)
        assert isinstance(first_repo["name"], str)

        preview_response = api_client.get(
            f"{base_url}/api/connectors/github",
            params={"owner": first_repo["owner"], "repo": first_repo["name"]},
        )
        assert preview_response.status_code == 200
        preview = preview_response.json()
        assert preview["owner"] == first_repo["owner"]
        assert preview["repo"] == first_repo["name"]
        assert isinstance(preview["tree"], list)

    def test_snapshot_create_and_get_persist(self, api_client, base_url):
        suffix = uuid.uuid4().hex[:8]
        project_name = f"TEST_Snap_{suffix}"
        create_project = api_client.post(
            f"{base_url}/api/projects",
            json={
                "name": project_name,
                "description": "snapshot test",
                "agents": [{"name": "SnapAgent", "role": "ops"}],
            },
        )
        assert create_project.status_code == 201
        project = create_project.json()

        create_snapshot = api_client.post(
            f"{base_url}/api/snapshots",
            json={"projectSlug": project["slug"], "title": "Snapshot QA"},
        )
        assert create_snapshot.status_code == 201
        snapshot = create_snapshot.json()
        assert snapshot["title"] == "Snapshot QA"
        assert isinstance(snapshot["id"], str)

        get_snapshots = api_client.get(
            f"{base_url}/api/snapshots",
            params={"projectSlug": project["slug"]},
        )
        assert get_snapshots.status_code == 200
        snapshots = get_snapshots.json()
        assert isinstance(snapshots, list)
        matched = [item for item in snapshots if item["id"] == snapshot["id"]]
        assert len(matched) == 1
        assert matched[0]["title"] == "Snapshot QA"

    def test_filesystem_local_first_metadata_path(self, api_client, base_url):
        suffix = uuid.uuid4().hex[:8]
        project_name = f"TEST_FS_{suffix}"
        create_project = api_client.post(
            f"{base_url}/api/projects",
            json={
                "name": project_name,
                "description": "filesystem path test",
                "agents": [{"name": "FsAgent", "role": "infra"}],
            },
        )
        assert create_project.status_code == 201
        project = create_project.json()

        path = "knowledge/local-first-check.md"
        write_response = api_client.put(
            f"{base_url}/api/files",
            json={"projectSlug": project["slug"], "path": path, "content": "local-first"},
        )
        assert write_response.status_code == 200

        read_response = api_client.get(
            f"{base_url}/api/files",
            params={"projectSlug": project["slug"], "path": path},
        )
        assert read_response.status_code == 200
        body = read_response.json()
        assert body["content"] == "local-first"
        metadata = body["metadata"]
        assert isinstance(metadata["absolutePath"], str)
        expected_fragment = f"/.kanclaw/workspace/projects/{project['slug']}/"
        assert expected_fragment in metadata["absolutePath"]
