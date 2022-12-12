/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { getMsg } from '../../../../../store/actions';
import { selectMessage } from '../../../../../store/messages-slice';
import { generateStore } from '../../../../../tests/generators/store';

import AttachmentsBlock from '../attachments-block';

describe('MIME formatted mail visualization', () => {
	describe('Attachments', () => {
		test.each`
			msgId  | attachment_type
			${'5'} | ${'pdf'}
			${'6'} | ${'images'}
		`(`$attachment_type attachments are visible`, async ({ msgId }) => {
			// Generate the store
			const store = generateStore();

			// Invoke the fetch of the message and the store update
			await store.dispatch<any>(getMsg({ msgId }));
			const state = store.getState();
			const message = selectMessage(state, msgId);

			// Get the attachment filename
			const filenames = message?.attachments?.map((attachment) => attachment.filename);
			if (!filenames) {
				return;
			}

			// Create the props for the component
			const props = {
				message
			};

			// Render the component
			const { user } = setupTest(<AttachmentsBlock {...props} />, { store });

			// Check if the attachments list expansion link exists
			const expansionLink = screen.queryByTestId('attachment-list-expand-link');
			if (expansionLink) {
				await user.click(expansionLink);
				await screen.findByTestId('attachment-list-collapse-link');
			}

			// Check the visibility of the attachment blocks
			filenames.forEach((filename) => {
				try {
					screen.getByTestId(`attachment-container-${filename}`);
				} catch (e) {
					throw new Error(`The attachment block for the file ${filename} is not present`);
				}
			});
		});
	});
});
