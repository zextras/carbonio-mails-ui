/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import moment from 'moment';
import { http } from 'msw';

import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useProductFlavorStore } from '../../../store/zustand/product-flavor/store';
import { RecoverMessages } from '../recover-messages';

function getParams(url: string): Record<string, string> {
	const params = [...new URLSearchParams(new URL(url).searchParams)];
	const rec: Record<string, string> = {};
	params.forEach(([key, value]) => {
		rec[key] = value;
	});
	return rec;
}

describe('Recover messages', () => {
	it('should render view if product flavour is advanced', () => {
		useProductFlavorStore.getState().setAdvanced();
		setupTest(<RecoverMessages />, {});
		expect(screen.getByTestId('product-flavour-form')).toBeInTheDocument();
	});
	it('should not render view if product flavour is community', () => {
		useProductFlavorStore.getState().setCommunity();
		setupTest(<RecoverMessages />, {});
		expect(screen.queryByTestId('product-flavour-form')).not.toBeInTheDocument();
	});
	it('should call undelete API when recovery button is pressed', async () => {
		useProductFlavorStore.getState().setAdvanced();
		const { user } = setupTest(<RecoverMessages />, {});
		await user.click(screen.getByRole('button', { name: 'label.start_recovery' }));
		await user.click(screen.getByRole('button', { name: 'label.confirm' }));

		const APIrequestStartEnd = (): Promise<{ start: string; end: string }> =>
			new Promise((resolve, reject) => {
				getSetupServer().use(
					http.post('/zx/backup/v1/undelete', async ({ request }) => {
						if (request === undefined) {
							reject(new Error('Empty request'));
						}
						const params = getParams(request.url);
						const { start } = params;
						const { end } = params;
						resolve({ start, end });
					})
				);
			});
		const { start, end } = await APIrequestStartEnd();
		expect(start).toBeDefined();
		expect(end).toBeDefined();
		const oneWeek = moment(end).utc().diff(moment(start).utc());
		expect(oneWeek).toBe(60 * 1000 * 60 * 24 * 7);
	});
});