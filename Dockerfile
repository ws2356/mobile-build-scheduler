FROM node:8

# Set the working directory to /app
WORKDIR /mobile-build-scheduler

COPY package.json .
RUN yarn install

COPY . .

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
#ENV NAME World

CMD ["node", "bin/www"]
