/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	findByText,
	screen,
	waitFor,
	waitForElementToBeRemoved,
	within
} from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { ActionsType } from '../../../../../commons/utils';
import * as useQueryParam from '../../../../../hooks/useQueryParam';
import { generateStore } from '../../../../../tests/generators/store';
import EditView from '../edit-view';
import { selectEditors } from '../../../../../store/editor-slice';

describe('Edit view', () => {
	test('create a new email', async () => {
		const store = generateStore();

		// Mock the "action" query param
		jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param, defaultValue) => {
			if (param === 'action') {
				return 'new';
			}
			return undefined;
		});

		const props = {
			mailId: 'new-1',
			folderId: FOLDERS.INBOX,
			setHeader: noop,
			toggleAppBoard: false
		};

		// Create and wait for the component to be rendered
		const { user } = setupTest(<EditView {...props} />, { store });
		await waitFor(() => {
			expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
		});

		// Get the components
		const btnSend = screen.getByTestId('BtnSendMail');
		const toComponent = screen.getByTestId('RecipientTo');
		const toInputElement = within(toComponent).getByRole('textbox');
		const subjectComponent = screen.getByTestId('subject');
		const subjectInputElement = within(subjectComponent).getByRole('textbox');
		const editorComponent = await screen.findByTestId('MailPlainTextEditor');
		const editorTextareaElement = within(subjectComponent).getByRole('textbox');

		// Check for the status of the "send" button to be disabled
		expect(btnSend).toBeVisible();
		expect(btnSend).toBeDisabled();

		// Reset the content of the "to" component and type the address
		await user.click(toInputElement);
		await user.clear(toInputElement);
		const address = 'ciccio@foo.com';
		await user.type(toInputElement, address);

		// Click on another component to trigger the change event
		await user.click(subjectInputElement);

		// Check for the status of the "send" button to be enabled
		expect(btnSend).toBeEnabled();

		// Insert a subject
		await user.type(subjectInputElement, 'Interesting subject');
		// Click on another component to trigger the change event
		await user.click(editorTextareaElement);

		// Insert a text inside editor
		await user.type(editorTextareaElement, 'Lorem ipsum');
		// Click on another component to trigger the change event
		await user.click(subjectInputElement);

		// TODO should we check if the draft is created?

		// Click on the "send" button
		await user.click(btnSend);

		// Check if a snackbar (countdown) will appear
		// FIXME: resolve the string using the corresponding key in en.json
		//await findByText('Sending your message in', {}, { timeout: 4000 });
		// const snackbar = await screen.findByText(/Sending your message in/i, {}, { timeout: 4000 });
		// console.log(snackbar);
		// await waitForElementToBeRemoved(() => screen.findByText('Sending your message in'));

		// // Wait the default delay (3 sec) for the email to be send

		// // Check if a snackbar (email sent) will appear
		// // FIXME: resolve the string using the corresponding key in en.json
		// await findByText('Message sent', {}, { timeout: 10000 });

		// // TEST SOLUTION 1: Check inside the store if the email exists

		// // TEST SOLUTION 2: Intercept the SOAP call (need some new feature in common-ui) and check the request content

		console.log('**** editors', selectEditors(store.getState()));
	});
});
