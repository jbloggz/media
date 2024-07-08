#
# MIT License
#
# Author: Josef Barnes
#
# Makefile: The recipies for building the media app
#

.PHONY: default test build lint coverage serve clean

default: build

test:
	python -m coverage run --branch --include='*/media/*' --omit='*/test/*' -m unittest discover src/py && python -m coverage html
	npm test

build:
	npm run build

lint:
	npm run lint

serve:
	npm start

clean:
	rm -f .coverage
	rm -rf coverage
	rm -rf htmlcov
	rm -rf .mypy_cache
	rm -rf .next
	rm -rf .swc

clean-all: clean
	rm -rf node_modules
	rm -f package-lock.json

