# Stage 1: Build the React application
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# We need to expose a build-time argument for the API URL, but Nginx will serve static files. 
# We'll bake in a default that matches the compose network configuration.
# The user's browser needs to be able to hit the backend.
# If the user runs this locally, localhost:8080 is the accessible route from their browser to the backend container.
ARG VITE_API_URL=http://localhost:8080/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config if necessary, but default works for simple SPAs if we add a fallback
# We will create a simple inline config to support React Router
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
