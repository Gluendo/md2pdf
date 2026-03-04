# Complex Mermaid Diagrams

## Flowchart with subgraphs

```mermaid
graph TB
    subgraph Frontend
        A[React App] --> B[API Client]
        A --> C[State Manager]
    end
    subgraph Backend
        D[API Gateway] --> E[Auth Service]
        D --> F[User Service]
        D --> G[Order Service]
        F --> H[(PostgreSQL)]
        G --> H
        G --> I[(Redis Cache)]
    end
    B --> D
    E -->|JWT Token| B
```

## Sequence Diagram with loops and alternatives

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Auth
    participant API
    participant DB

    User->>App: Login request
    App->>Auth: Validate credentials
    alt Valid credentials
        Auth->>Auth: Generate JWT
        Auth-->>App: Token + refresh token
        App-->>User: Login success
        loop Every API call
            User->>App: Request with token
            App->>API: Forward with JWT
            API->>DB: Query data
            DB-->>API: Results
            API-->>App: JSON response
            App-->>User: Rendered view
        end
    else Invalid credentials
        Auth-->>App: 401 Unauthorized
        App-->>User: Error message
    end
```

## Class Diagram

```mermaid
classDiagram
    class Document {
        +String title
        +String content
        +Date createdAt
        +render() HTML
        +toJSON() Object
    }
    class MarkdownDocument {
        +String rawMarkdown
        +parse() AST
        +extractFrontmatter() Map
    }
    class PDFDocument {
        +Buffer pdfData
        +Object options
        +addHeader(text) void
        +addFooter(text) void
        +setMargins(top, right, bottom, left) void
    }
    class Pipeline {
        +List~Processor~ processors
        +run(input) Output
        +addProcessor(p) void
    }
    class Processor {
        <<interface>>
        +process(input) Output
    }

    Document <|-- MarkdownDocument
    Document <|-- PDFDocument
    Pipeline o-- Processor
    MarkdownDocument ..> PDFDocument : converts to
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review : Submit
    Review --> Approved : Approve
    Review --> Draft : Request changes
    Approved --> Published : Publish
    Published --> Archived : Archive
    Archived --> Draft : Restore

    state Review {
        [*] --> PeerReview
        PeerReview --> TechReview
        TechReview --> FinalReview
        FinalReview --> [*]
    }
```

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id PK
        string name
        string email
        date created_at
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int id PK
        int user_id FK
        date order_date
        string status
        decimal total
    }
    ORDER_ITEM }|--|| PRODUCT : references
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }
    PRODUCT {
        int id PK
        string name
        string description
        decimal price
        int stock
    }
    PRODUCT }o--|| CATEGORY : belongs_to
    CATEGORY {
        int id PK
        string name
    }
```

## Gantt Chart

```mermaid
gantt
    title Project Release Plan
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Design
        Wireframes           :done,    des1, 2025-01-01, 14d
        Mockups              :done,    des2, after des1, 10d
        Design review        :done,    des3, after des2, 3d

    section Development
        Core engine          :active,  dev1, after des3, 30d
        API integration      :         dev2, after dev1, 20d
        Frontend             :         dev3, after dev1, 25d

    section Testing
        Unit tests           :         test1, after dev2, 10d
        Integration tests    :         test2, after dev3, 10d
        UAT                  :         test3, after test2, 7d

    section Release
        Staging deploy       :milestone, after test3, 0d
        Production deploy    :milestone, after test3, 3d
```

## Git Graph

```mermaid
gitGraph
    commit id: "init"
    commit id: "add core"
    branch feature/auth
    commit id: "add login"
    commit id: "add JWT"
    checkout main
    branch feature/api
    commit id: "add routes"
    commit id: "add middleware"
    checkout main
    merge feature/auth id: "merge auth"
    merge feature/api id: "merge api"
    commit id: "v1.0.0" tag: "v1.0.0"
```
