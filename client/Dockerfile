# use a base image image to where we create application package
FROM node:latest   AS build

# SET A WORKING DIRECTORY
WORKDIR /app

# COPY ALL THE JSON PACKAGES TO THE DOCKER IMAGE
COPY package*.json .

# INSTALL ALL THE REQUIRED DEPENDENCY TO RUN OUR APPLICATION
RUN npm install

# COPY ALL THE REQUIRED FILES TO RUN OUR APPLICATION
COPY . .

# 👇 accept build-time variable
ARG VITE_API_URL

# 👇 inject into build
ENV VITE_API_URL=$VITE_API_URL

# CREATING THE ARTIFACT REQUIRED
RUN npm run build

# TAKE A NEW BASE IMAGE WHERE OUR APPLICATION WILL RUN ON
FROM nginx:alpine

# COPY ARTIFACT FILE TO NGINX ROOT DIRECTORY
COPY --from=build /app/dist/   /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 
