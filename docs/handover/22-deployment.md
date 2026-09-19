# Velvet & Iron Backend - Deployment & Infrastructure Architecture

**Document ID:** `22-deployment.md`  
**Target Audience:** DevOps Engineers, Cloud Architects, System Administrators  

---

## 1. Deployment Topology Diagram

The following architecture diagram represents the complete deployment pipeline from Git push to production execution on AWS EC2:

```mermaid
flowchart TD
    Dev["Developer Workstation"] -->|git push origin main| GHEntry["GitHub Repository (main branch)"]

    subgraph CI["GitHub Actions Pipeline (.github/workflows/ci.yml)"]
        TestJob["Job 1: test\n- Node 20 setup\n- pnpm i\n- pnpm format\n- pnpm build"]
        BuildJob["Job 2: build-and-push-docker-image\n- Docker Hub Login\n- docker build -t ${{ secrets.IMMAGE_NAME }}\n- docker push"]
        DeployJob["Job 3: deploy\n- SSH Connectivity to EC2\n- scp docker-compose.yml to VPS\n- scp Caddyfile to VPS\n- Remote SSH Execution:\n  docker compose --profile prod pull\n  docker compose --profile prod down\n  docker compose --profile prod up -d"]
        
        TestJob --> BuildJob
        BuildJob --> DeployJob
    end

    GHEntry --> TestJob

    subgraph Registry["Docker Hub Container Registry"]
        HubImage["Image: shamimranaprofessionaloffice/velvet_backend:latest"]
    end

    BuildJob -->|Push Image| HubImage

    subgraph ServerInfra["Production Host (AWS EC2 / Ubuntu Linux)"]
        DockerDaemon["Docker Engine & Docker Compose"]
        
        subgraph Containers["Docker Compose Stack (--profile prod)"]
            CaddyCont["caddy Container\n(Ports 80, 443, 8000, 8001)"]
            ServerCont["velvet_backend Container\n(Node.js 20 Alpine, Port 3200)"]
            PostgresCont["velvet_backend_postgres Container\n(PostgreSQL 16 Alpine, Port 5432)"]
            PrismaStudioCont["velvet_backend_prisma_studio Container\n(Port 7896)"]
        end

        StorageVol[("Docker Named Volumes:\n- postgres_data\n- caddy_data\n- caddy_config")]
    end

    DeployJob -->|SSH & Pull| DockerDaemon
    HubImage -->|docker pull| DockerDaemon
    PostgresCont --- StorageVol
    CaddyCont --- StorageVol

    subgraph Users["End Users & Ingress"]
        MobileUsers["Flutter Mobile App"]
        AdminBrowser["Admin Web Browser"]
    end

    MobileUsers -->|HTTPS :8000 / velvet.api.softvence.app| CaddyCont
    AdminBrowser -->|HTTPS :8001 / velvet.db.softvence.app (BasicAuth)| CaddyCont
    CaddyCont -->|proxy :3200| ServerCont
    CaddyCont -->|proxy :7896| PrismaStudioCont
    ServerCont -->|internal network :5432| PostgresCont
```

---

## 2. Containerization Architecture

### 2.1 The Multi-Stage `Dockerfile`
```dockerfile
# Stage 1: Build Environment
FROM node:20 AS build
WORKDIR /software
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install
RUN npm install -g prisma
RUN pnpm add express

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine
WORKDIR /software
COPY --from=build /software/package.json .
COPY --from=build /software/node_modules ./node_modules
COPY --from=build /software/dist ./dist
COPY --from=build /software/prisma ./prisma
COPY --from=build /software/prisma.config.ts ./

ENV NODE_ENV=production
EXPOSE 3200
CMD ["npm", "run", "server:run:under:dockerimage"]
```

#### Startup Command Analysis
`CMD ["npm", "run", "server:run:under:dockerimage"]`  
Defined in `package.json` (line 28):
```bash
npx prisma generate && npx prisma migrate deploy && node dist/src/main
```
This guarantees that **every container boot automatically applies pending database migrations** (`prisma migrate deploy`) before the NestJS application starts listening for requests.

---

## 3. Docker Compose Stack Specifications (`docker-compose.yml`)

The compose stack defines 4 active services using Docker Compose profiles:

| Service Name | Container Name | Base Image | Exposed Ports | Healthcheck / Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `postgres` | `${SERVER_NAME}_postgres` | `postgres:16-alpine` | `${POSTGRES_PORT:-5432}:5432` | `pg_isready -U postgres` |
| `server` | `${SERVER_NAME}` | `${IMMAGE_NAME}` | `${SERVER_PORT}:${PORT}` (`6000:3200`) | Depends on `postgres: healthy` |
| `prisma-studio` | `${SERVER_NAME}_prisma_studio`| `${IMMAGE_NAME}` | `${PRISMA_STUDIO_PORT_LOCAL}:${PRISMA_STUDIO_PORT}` (`8462:7896`)| Depends on `postgres: healthy` |
| `caddy` | `caddy` | `caddy:latest` | `80`, `443`, `8000`, `8001` | Depends on `server: started` |

---

## 4. Ingress & Reverse Proxy (`Caddyfile`)

```caddyfile
# Backend API
:8000, velvet.api.softvence.app {
    reverse_proxy velvet_backend:3200
}

# Prisma Studio GUI
:8001, velvet.db.softvence.app {
    basicauth {
        shamimrana2006 $2y$10$/x6ntJtyiAp/NAJlWZlYK.ikj517KYpgqgC.pg4xY32LrLpH6qc6y
    }
    reverse_proxy velvet_backend_postgres:7896
}
```

### Infrastructure Inconsistency in Caddyfile
* Notice line 20: `reverse_proxy velvet_backend_postgres:7896`.
* In `docker-compose.yml`, the Prisma Studio container name is `velvet_backend_prisma_studio`, not `velvet_backend_postgres`!
* **Impact:** Requests to `:8001` / `velvet.db.softvence.app` fail with 502 Bad Gateway.
* **Fix:** Change `velvet_backend_postgres:7896` to `velvet_backend_prisma_studio:7896` in `Caddyfile`.

---

## 5. Automated CI/CD Pipeline (`.github/workflows/ci.yml`)

Triggered on every push to `main`:
1. **Job: `test`:**
   * Checks out code on `ubuntu-latest`.
   * Sets up Node.js 20.
   * Runs `pnpm i`, `pnpm add express`, `pnpm format`, and `pnpm build`.
2. **Job: `build-and-push-docker-image` (depends on `test`):**
   * Authenticates with Docker Hub using `${{ secrets.DOCKER_USERNAME }}` and `${{ secrets.DOCKER_PASSWORD }}`.
   * Builds container image and pushes to `${{ secrets.IMMAGE_NAME }}`.
3. **Job: `deploy` (depends on `build-and-push-docker-image`):**
   * Establishes SSH connection to `${{ secrets.EC2_HOST }}` via `appleboy/ssh-action`.
   * Copies updated `docker-compose.yml` and `Caddyfile` to target host via `appleboy/scp-action`.
   * Runs remote deployment commands:
     ```bash
     cd /home/${{ secrets.EC2_USER }}/${{ secrets.SERVER_NAME }}/
     sudo docker compose --profile prod pull
     sudo docker compose --profile prod down --remove-orphans
     sudo docker compose --profile prod up -d
     sudo docker system prune -f
     ```

