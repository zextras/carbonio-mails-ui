/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { setupTest } from '@test-setup';
import FilterModule from 'views/settings/filters';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	t: (key: string, fallback?: string): string => fallback || key
}));

describe('FilterModule', () => {
	it('renders FormSection with id="filters" for anchor navigation', async () => {
		const { container } = await act(async () => setupTest(<FilterModule />));
		// eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
		const el = container.querySelector('#filters');
		expect(el).toBeInTheDocument();
	});
});
