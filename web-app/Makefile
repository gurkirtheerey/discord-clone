.PHONY: all frontend backend dev stop clean

# Run both frontend and backend
dev:
	@echo "Starting development servers..."
	@make -j 2 frontend backend

# Run frontend
frontend:
	@echo "Starting React frontend on http://localhost:5173"
	cd frontend && npm run dev

# Run backend
backend:
	@echo "Starting Go backend on http://localhost:8080"
	cd backend && go run cmd/server/main.go

# Install dependencies
install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing backend dependencies..."
	cd backend && go mod tidy

# Build for production
build:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Building backend..."
	cd backend && go build -o bin/server cmd/server/main.go

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf backend/bin

# Stop all running processes
stop:
	@echo "Stopping all processes..."
	@pkill -f "npm run dev" || true
	@pkill -f "go run cmd/server/main.go" || true