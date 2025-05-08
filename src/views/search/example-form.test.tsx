/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { ExampleForm } from './example-form';
import { setupTest, screen } from '../../carbonio-ui-commons/test/test-setup';

describe('Example Form', () => {
	it('should disable the button', async () => {
		const { user } = setupTest(<ExampleForm />);

		expect(await screen.findByTestId('submit-button')).toBeDisabled();

		const input = await screen.findByRole('textbox', { name: 'Test' });
		await user.type(input, 'whatever');
		await user.tab();

		expect(await screen.findByTestId('submit-button')).toBeEnabled();
	});
});
