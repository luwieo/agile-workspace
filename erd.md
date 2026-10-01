erDiagram
    %% Relationships
    auth_users ||--|| profiles : "1-to-1"
    profiles ||--o{ team_members : "Joins"
    teams ||--o{ team_members : "Has"
    teams ||--o{ projects : "Owns"
    projects ||--o{ tasks : "Contains"
    profiles ||--o{ tasks : "Assigned to"
    tasks ||--o{ comments : "Has"
    profiles ||--o{ comments : "Writes"

    %% Tables
    auth_users {
        uuid id PK
        string email UK
        string encrypted_password 
    }

    profiles {
        uuid id PK 
        string username UK
        string full_name
        string role "developer | owner"
    }

    teams {
        uuid id PK
        string name
        timestamp created_at
    }

    team_members {
        uuid team_id PK, FK
        uuid user_id PK, FK
        timestamp joined_at
    }

    projects {
        uuid id PK
        string name
        string description
        uuid team_id FK 
        timestamp created_at
    }

    tasks {
        uuid id PK
        string title
        string description
        string status "backlog | todo | in_progress | done"
        string priority "low | medium | high"
        uuid project_id FK 
        uuid assignee_id FK 
        timestamp created_at
    }
    
    comments {
        uuid id PK
        text content
        uuid task_id FK
        uuid author_id FK
        timestamp created_at
    }