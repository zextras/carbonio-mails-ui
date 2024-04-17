/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import moment from 'moment';
import { HttpResponse } from 'msw';

import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useProductFlavorStore } from '../../../store/zustand/product-flavor/store';
import { RecoverMessages } from '../recover-messages';
import { createAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { defaultBeforeAllTests } from '../../../carbonio-ui-commons/test/jest-setup';

function getParams(url: string): Record<string, string> {
	const params = [...new URLSearchParams(new URL(url).searchParams)];
	const rec: Record<string, string> = {};
	params.forEach(([key, value]) => {
		rec[key] = value;
	});
	return rec;
}

describe('Recover messages', () => {
	beforeAll(() => {
		defaultBeforeAllTests({ onUnhandledRequest: 'error' });
	});

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
		const apiInterceptor = createAPIInterceptor(
			'/zx/backup/v1/undelete',
			HttpResponse.json(null, { status: 202 })
		);

		await act(async () => {
			await user.click(screen.getByRole('button', { name: 'label.start_recovery' }));
			await user.click(screen.getByRole('button', { name: 'label.confirm' }));
		});

		const { start, end } = getParams((await apiInterceptor).url);
		expect(start).toBeDefined();
		expect(end).toBeDefined();
		const oneWeek = moment(end).utc().diff(moment(start).utc());
		expect(oneWeek).toBe(60 * 1000 * 60 * 24 * 7);
	});

	it('should not close the recover messages modal when the API call fails', async () => {
		useProductFlavorStore.getState().setAdvanced();
		const { user } = setupTest(<RecoverMessages />, {});
		createAPIInterceptor('/zx/backup/v1/undelete', HttpResponse.json(null, { status: 500 }));

		await act(async () => {
			await user.click(screen.getByRole('button', { name: 'label.start_recovery' }));
			await user.click(screen.getByRole('button', { name: 'label.confirm' }));
		});

		expect(screen.getByText('label.confirm')).toBeInTheDocument();
	});

	it('should close the recover messages modal when the API call succedes', async () => {
		useProductFlavorStore.getState().setAdvanced();
		const { user } = setupTest(<RecoverMessages />, {});
		createAPIInterceptor('/zx/backup/v1/undelete', HttpResponse.json(null, { status: 202 }));

		await act(async () => {
			await user.click(screen.getByRole('button', { name: 'label.start_recovery' }));
			await user.click(screen.getByRole('button', { name: 'label.confirm' }));
		});

		expect(screen.queryByText('label.confirm')).not.toBeInTheDocument();
	});
});
