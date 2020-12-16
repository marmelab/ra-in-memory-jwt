.PHONY: install start stop log

export CURRENT_UID ?= $(id -u):$(id -g)
export NODE_ENV ?= development

DC_DEMO := docker-compose -p ra-inmemoryjwt-demo

help: ## Display available commands
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# =====================================================================
# Initialization ======================================================
# =====================================================================

install: ## Install all js deps
	@${DC_DEMO} run --rm --no-deps back ash -ci 'npm install'
	@${DC_DEMO} run --rm --no-deps admin ash -ci 'npm install'

start: ## Start all service in containers
	${DC_DEMO} up -d

stop: ## Stop all containers
	${DC_DEMO} down

connect-admin: ## Connectback container 
	${DC_DEMO} exec admin ash

connect-back: ## Connectback container 
	${DC_DEMO} exec back ash

logs: ## Display all logs
	${DC_DEMO} logs -f

init: ## Init db with demo user
	$(DC_DEMO) exec back ash -ci 'npm run migrate:latest'
	$(DC_DEMO) exec back ash -ci 'USERNAME=myFirstUser PASSWORD=n33dToB3+Str0ng node ./cli/create-user.js'
