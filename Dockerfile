FROM node:8

# Set the working directory to /app
WORKDIR /hello-docker

COPY package.json .
RUN yarn install

COPY . .

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
#ENV NAME World

CMD ["node", "index.js"]
