BACKEND_DIR := src/backend
FRONTEND_DIR := src/frontend

.PHONY: install backend frontend dev format format-check

install:
	npm install
	npm --prefix $(BACKEND_DIR) install
	npm --prefix $(FRONTEND_DIR) install

backend:
	npm --prefix $(BACKEND_DIR) run dev

frontend:
	npm --prefix $(FRONTEND_DIR) start

dev:
	$(MAKE) -j2 backend frontend

format:
	npm run format

format-check:
	npm run format:check
