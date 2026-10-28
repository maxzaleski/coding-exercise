BACKEND_DIR := src/backend
FRONTEND_DIR := src/frontend

.PHONY: install backend frontend dev format format-check audit

install:
	npm install
	npm --prefix $(BACKEND_DIR) install
	npm --prefix $(FRONTEND_DIR) install

backend:
	npm --prefix $(BACKEND_DIR) run dev

frontend:
	npm --prefix $(FRONTEND_DIR) run dev

dev:
	$(MAKE) -j2 backend frontend

format:
	npm run format

format-check:
	npm run format:check

audit:
	@status=0; \
	for dir in . $(BACKEND_DIR) $(FRONTEND_DIR); do \
		echo "=> npm audit ($$dir)"; \
		npm --prefix $$dir audit || status=1; \
	done; \
	exit $$status
