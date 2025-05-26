/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen, setupTest } from '@zextras/carbonio-ui-commons';
import { useAuthenticated } from '../__mocks__/@zextras/carbonio-shell-ui';
import { AuthGuard } from './auth-guard';

describe('AuthGuard', () => {
	it('should render the child component when the user is authenticated', () => {
		useAuthenticated.mockReturnValue(true);

		setupTest(
			<AuthGuard>
				<p>Authenticated</p>
			</AuthGuard>
		);

		expect(screen.getByText('Authenticated')).toBeInTheDocument();
	});

	it('should not render the child component when the user is authenticated', () => {
		useAuthenticated.mockReturnValue(false);

		setupTest(
			<AuthGuard>
				<p>Authenticated</p>
			</AuthGuard>
		);

		expect(screen.queryByText('Authenticated')).not.toBeInTheDocument();
	});
});
