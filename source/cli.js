#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
		Usage
		  $ wfh-eq

		Description
		  A CLI tool to find overlapping working hours between two timezones.

		Examples
		  $ wfh-eq
		  Select your timezone and another timezone to see overlapping working hours (9 AM - 5 PM).
	`,
	{
		importMeta: import.meta,
	},
);

render(<App />);
