FROM python:3.12-slim

WORKDIR /app

# Install mitmproxy + test deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy proxy source
COPY guardian_proxy/ ./guardian_proxy/
COPY run.py .
COPY tests/ ./tests/

# mitmproxy stores its CA cert here
RUN mkdir -p /root/.mitmproxy

# Expose proxy port
EXPOSE 8080

# Default: run in live mode
CMD ["python", "run.py", "--host", "0.0.0.0", "--port", "8080"]
