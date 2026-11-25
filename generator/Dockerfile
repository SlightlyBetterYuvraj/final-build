FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir ortools>=9.8.3296

COPY . .

ENV PORT=7860
ENV HOST=0.0.0.0

EXPOSE 7860

CMD ["python", "server.py", "--host", "0.0.0.0", "--port", "7860"]
