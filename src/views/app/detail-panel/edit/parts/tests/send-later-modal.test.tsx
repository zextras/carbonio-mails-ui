/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { noop } from 'lodash';

import { setupTest } from '@test-setup';
import { SendLaterModal } from 'views/app/detail-panel/edit/parts/send-later-modal';

describe('send-later-modal', () => {
	it('all elements of the component are visible', async () => {
		const closeModal = vi.fn();

		setupTest(
			<SendLaterModal onClose={(): void => closeModal()} onAutoSendTimeSelected={noop} />,
			{}
		);

		const modalTitle = screen.getByText(/label\.send_later/i);
		expect(modalTitle).toBeVisible();

		const confirmButton = screen.getByRole('button', {
			name: /label\.schedule_send/i
		});
		expect(confirmButton).toBeVisible();

		const cancelButton = screen.getByRole('button', {
			name: /label\.cancel/i
		});
		expect(cancelButton).toBeEnabled();
	});
});
