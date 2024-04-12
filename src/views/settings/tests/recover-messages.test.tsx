/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import moment from 'moment';
import { HttpResponse, http } from 'msw';

import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useProductFlavorStore } from '../../../store/zustand/product-flavor/store';
import { RecoverMessages } from '../recover-messages';

function getParams(url: string): Record<string, string> {
	const params = new URLSearchParams(new URL(url).searchParams);
	const rec: Record<string, string> = {};
	params.forEach(([k, v]) => {
		rec[k] = v;
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

		getSetupServer().use(
			http.post('/zx/backup/v1/undelete', ({ request }) => {
				const params = getParams(request.url);
				const { start } = params;
				const { end } = params;
				expect(start).toBeDefined();
				expect(end).toBeDefined();
				const oneWeek = moment(end).utc().diff(moment(start).utc());
				expect(oneWeek).toBe(60 * 1000 * 60 * 24 * 7);
				return HttpResponse.json({});
			})
		);
	});
});
