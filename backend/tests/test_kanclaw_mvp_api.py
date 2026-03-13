import time
import uuid


class TestKanClawMvpApi:
    """Critical MVP API coverage for projects, tasks, files and send-task flows."""

    def test_health_endpoint(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["app"] == "kanclaw"
        assert "openclaw" in data

    def test_projects_list_and_create(self, api_client, base_url):
        before = api_client.get(f"{base_url}/api/projects")
        assert before.status_code == 200
        before_data = before.json()
        assert isinstance(before_data, list)

        suffix = uuid.uuid4().hex[:8]
        project_name = f"TEST_KanClaw_{suffix}"
        payload = {
            "name": project_name,
            "description": "Proyecto de test API",
            "agents": [{"name": "QAAgent", "role": "qa"}],
        }
        create = api_client.post(f"{base_url}/api/projects", json=payload)
        assert create.status_code == 201
        created = create.json()
        assert created["name"] == project_name
        assert created["slug"] == project_name.lower().replace("_", "-")
        assert isinstance(created["id"], str)

        after = api_client.get(f"{base_url}/api/projects")
        assert after.status_code == 200
        after_data = after.json()
        matched = [p for p in after_data if p["id"] == created["id"]]
        assert len(matched) == 1
        assert matched[0]["slug"] == created["slug"]

    def test_task_create_and_status_update_persist(self, api_client, base_url):
        suffix = uuid.uuid4().hex[:8]
        project_name = f"TEST_Task_{suffix}"
        create_project = api_client.post(
            f"{base_url}/api/projects",
            json={"name": project_name, "description": "task test", "agents": [{"name": "Runner", "role": "dev"}]},
        )
        assert create_project.status_code == 201
        project = create_project.json()

        create_task = api_client.post(
            f"{base_url}/api/tasks",
            json={"projectSlug": project["slug"], "title": "TEST_task_status_flow", "description": "d1", "status": "TODO"},
        )
        assert create_task.status_code == 201
        task = create_task.json()
        assert task["title"] == "TEST_task_status_flow"
        assert task["status"] == "TODO"

        update_task = api_client.put(
            f"{base_url}/api/tasks",
            json={"taskId": task["id"], "status": "RUNNING"},
        )
        assert update_task.status_code == 200
        updated = update_task.json()
        assert updated["id"] == task["id"]
        assert updated["status"] == "RUNNING"

        projects = api_client.get(f"{base_url}/api/projects")
        assert projects.status_code == 200
        project_refetched = [p for p in projects.json() if p["id"] == project["id"]][0]
        project_tasks = project_refetched.get("tasks", [])
        saved_task = [t for t in project_tasks if t["id"] == task["id"]][0]
        assert saved_task["status"] == "RUNNING"

    def test_file_create_read_and_overwrite(self, api_client, base_url):
        suffix = uuid.uuid4().hex[:8]
        project_name = f"TEST_File_{suffix}"
        create_project = api_client.post(
            f"{base_url}/api/projects",
            json={"name": project_name, "description": "file test", "agents": [{"name": "Writer", "role": "doc"}]},
        )
        assert create_project.status_code == 201
        project = create_project.json()

        target_path = "knowledge/e2e-note.md"
        first_content = "# first\napi test content"
        write_1 = api_client.put(
            f"{base_url}/api/files",
            json={"projectSlug": project["slug"], "path": target_path, "content": first_content},
        )
        assert write_1.status_code == 200
        assert write_1.json()["ok"] is True

        read_1 = api_client.get(
            f"{base_url}/api/files",
            params={"projectSlug": project["slug"], "path": target_path},
        )
        assert read_1.status_code == 200
        assert read_1.json()["content"] == first_content

        second_content = "# second\nupdated"
        write_2 = api_client.put(
            f"{base_url}/api/files",
            json={"projectSlug": project["slug"], "path": target_path, "content": second_content},
        )
        assert write_2.status_code == 200

        read_2 = api_client.get(
            f"{base_url}/api/files",
            params={"projectSlug": project["slug"], "path": target_path},
        )
        assert read_2.status_code == 200
        assert read_2.json()["content"] == second_content

        tree = api_client.get(f"{base_url}/api/files", params={"projectSlug": project["slug"]})
        assert tree.status_code == 200
        assert isinstance(tree.json()["tree"], list)

    def test_send_task_returns_clear_error_when_gateway_offline(self, api_client, base_url):
        suffix = uuid.uuid4().hex[:8]
        project_name = f"TEST_Disconnect_{suffix}"
        create_project = api_client.post(
            f"{base_url}/api/projects",
            json={"name": project_name, "description": "disconnect test", "agents": [{"name": "OfflineAgent", "role": "ops"}]},
        )
        assert create_project.status_code == 201
        project = create_project.json()

        response = api_client.post(
            f"{base_url}/api/send-task",
            json={
                "projectSlug": project["slug"],
                "agentName": "OfflineAgent",
                "prompt": "TEST should fail when openclaw is offline",
            },
        )

        # Gateway call can take a moment before failing.
        time.sleep(1)
        assert response.status_code == 503
        body = response.json()
        assert "OpenClaw no está disponible" in body["error"]
