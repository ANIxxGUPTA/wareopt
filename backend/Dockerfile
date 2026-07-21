# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first to cache them
RUN mvn dependency:go-offline -B
# Copy source code and build
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Minimal runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
