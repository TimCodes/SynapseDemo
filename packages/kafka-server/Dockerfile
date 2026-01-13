FROM confluentinc/cp-kafka:7.5.0

# Copy initialization scripts
COPY init-kafka.sh /usr/local/bin/init-kafka.sh
COPY health-check.sh /usr/local/bin/health-check.sh

# Make scripts executable
RUN chmod +x /usr/local/bin/init-kafka.sh
RUN chmod +x /usr/local/bin/health-check.sh

# Note: The initialization script will be run separately after container starts
# This ensures Kafka is fully ready before creating topics
