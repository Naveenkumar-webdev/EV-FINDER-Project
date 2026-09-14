# Stage 1: Build Spring Boot JAR with Java 21 & Maven
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Install Maven
RUN apk add --no-cache maven

# Copy backend source and compile
COPY backend /app/backend
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Stage 2: Production runtime environment (Java 21 + Node.js)
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install Node.js & Bash
RUN apk add --no-cache nodejs npm bash

# Copy backend JAR and frontend files
COPY --from=builder /app/backend/target/*.jar /app/backend.jar
COPY frontend /app/frontend
COPY serve_frontend.js /app/serve_frontend.js
COPY package.json /app/package.json
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 5500 8080

CMD ["/bin/bash", "/app/start.sh"]
