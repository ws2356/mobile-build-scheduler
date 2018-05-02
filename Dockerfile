FROM node:8

# Set the working directory to /app
WORKDIR /mobile-build-scheduler

COPY . /mobile-build-scheduler
RUN cd /mobile-build-scheduler && npm install

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV PORT 80

CMD ["node", "bin/www"]
