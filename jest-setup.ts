/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import '@testing-library/jest-dom';
import failOnConsole from 'jest-fail-on-console';

failOnConsole({
	shouldFailOnError: true,
	shouldFailOnWarn: true
});

beforeAll(() => {
	// before all
});

beforeEach(() => {
	// before each
});

afterEach(() => {
	// after each
});

afterAll(() => {
	// after all
});
