FRONTEND_DIR := src/frontend

.PHONY: install run format format-check audit

install:
	npm install
	npm --prefix $(FRONTEND_DIR) install

run:
	npm --prefix $(FRONTEND_DIR) run build
	npm run build
	npm start

format:
	npm run format

format-check:
	npm run format:check

audit:
	@status=0; \
	for dir in . $(FRONTEND_DIR); do \
		echo "=> npm audit ($$dir)"; \
		npm --prefix $$dir audit || status=1; \
	done; \
	exit $$status
