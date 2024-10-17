/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { getMsgAsyncThunk } from '../../../../../../store/actions';
import { selectMessage } from '../../../../../../store/messages-slice';
import { generateStore } from '../../../../../../tests/generators/store';
import SignedInfo from '../signed-info-block';

describe('Signed info block', () => {
	test(`Should show the show details link`, async () => {
		const store = generateStore();

		await store.dispatch<any>(getMsgAsyncThunk({ msgId: '15' }));
		const state = store.getState();
		const msg = selectMessage(state, '15');
		const props = {
			msg
		};
		setupTest(<SignedInfo {...props} />, { store });
		expect(await screen.findByTestId('show-details-container')).toBeInTheDocument();
		expect(screen.getByText('Show Details')).toBeVisible();
	});

	test(`Should open the smime details modal on show details click`, async () => {
		const store = generateStore();

		await store.dispatch<any>(getMsgAsyncThunk({ msgId: '15' }));
		const state = store.getState();
		const msg = selectMessage(state, '15');
		const props = {
			msg
		};
		const { user } = setupTest(<SignedInfo {...props} />, { store });
		expect(await screen.findByTestId('show-details-container')).toBeInTheDocument();

		const showDetails = screen.getByText('Show Details');
		expect(showDetails).toBeVisible();

		await act(async () => {
			await user.click(showDetails);
		});
		expect(await screen.findByTestId('smime-details-modal')).toBeInTheDocument();
	});
});
