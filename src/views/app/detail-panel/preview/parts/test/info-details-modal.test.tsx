/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { getMsgAsyncThunk } from '../../../../../../store/actions';
import { selectMessage } from '../../../../../../store/messages-slice';
import { generateStore } from '../../../../../../tests/generators/store';
import { InfoDetailsModal } from '../info-details-modal';

describe('Signed info block', () => {
	test(`Should show the correct title`, async () => {
		const onClose = jest.fn();
		const store = generateStore();

		await store.dispatch<any>(getMsgAsyncThunk({ msgId: '15' }));
		const state = store.getState();
		const msg = selectMessage(state, '15');
		setupTest(<InfoDetailsModal onClose={onClose} signature={msg.signature?.[0]} />, { store });
		const title = await screen.findByText('Message details');
		expect(title).toBeVisible();
	});
});
