/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';
import { addBoard } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { getMsgAsyncThunk } from '../../../../../../store/actions';
import { selectMessage } from '../../../../../../store/messages-slice';
import { generateStore } from '../../../../../../tests/generators/store';
import MessageContactList from '../message-contact-list';

describe('Message contacts list', () => {
	test(`send e-mail from the CC participant`, async () => {
		const store = generateStore();

		// Invoke the fetch of the message and the store update
		await store.dispatch<any>(getMsgAsyncThunk({ msgId: '10' }));
		const state = store.getState();
		const message = selectMessage(state, '10');
		const ccContacts = filter(message.participants, ['type', 'c'])[0];
		const props = {
			message,
			folderId: message.parent,
			contactListExpandCB: jest.fn()
		};

		const { user } = setupTest(<MessageContactList {...props} />, { store });
		const toggleIcon = within(screen.getByTestId('contacs-list-toggle-icon')).getByTestId(
			'icon: ChevronDown'
		);
		expect(toggleIcon).toBeInTheDocument();
		await user.click(toggleIcon);
		const firstCCContactId = `chip-${ccContacts.address}`;
		const ccContact = within(screen.getByTestId(firstCCContactId)).getByTestId(
			'icon: EmailOutline'
		);
		expect(ccContact).toBeInTheDocument();
		await user.click(ccContact);
		const updatedContact = [{ ...ccContacts, type: 't' }];
		expect(addBoard).toHaveBeenCalledWith(
			expect.objectContaining({
				boardViewId: 'mails_editor_board_view',
				context: {
					originAction: 'mailTo',
					compositionData: {
						recipients: updatedContact
					}
				},
				title: ''
			})
		);
	});
	test(`send e-mail from the BCC participant`, async () => {
		const store = generateStore();

		// Invoke the fetch of the message and the store update
		await store.dispatch<any>(getMsgAsyncThunk({ msgId: '10' }));
		const state = store.getState();
		const message = selectMessage(state, '10');
		const bccContacts = filter(message.participants, ['type', 'b'])[0];
		const props = {
			message,
			folderId: message.parent,
			contactListExpandCB: jest.fn()
		};

		const { user } = setupTest(<MessageContactList {...props} />, { store });
		const toggleIcon = within(screen.getByTestId('contacs-list-toggle-icon')).getByTestId(
			'icon: ChevronDown'
		);
		expect(toggleIcon).toBeInTheDocument();
		await user.click(toggleIcon);
		const firstBCCContactId = `chip-${bccContacts.address}`;
		const ccContact = within(screen.getByTestId(firstBCCContactId)).getByTestId(
			'icon: EmailOutline'
		);
		expect(ccContact).toBeInTheDocument();
		await user.click(ccContact);
		const updatedContact = [{ ...bccContacts, type: 't' }];
		expect(addBoard).toHaveBeenCalledWith(
			expect.objectContaining({
				boardViewId: 'mails_editor_board_view',
				context: {
					originAction: 'mailTo',
					compositionData: {
						recipients: updatedContact
					}
				},
				title: ''
			})
		);
	});
});
