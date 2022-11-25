/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { FOLDERS, getUserAccount } from '@zextras/carbonio-shell-ui';
import { find, noop } from 'lodash';
import React from 'react';
import { rest } from 'msw';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import * as useQueryParam from '../../../../../hooks/useQueryParam';
import { generateStore } from '../../../../../tests/generators/store';
import EditView from '../edit-view';
import { getSetupServerApi } from '../../../../../carbonio-ui-commons/test/jest-setup';

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

		const from = find(getUserAccount().identities.identity, ['name', 'DEFAULT'])._attrs
			.zimbraPrefFromAddress;
		const address = 'ciccio@foo.com';
		const ccAddress = 'john@foo.com';
		const subject = 'Interesting subject';
		const body = 'Lorem ipsum';

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
		const btnCc = screen.getByTestId('BtnCc');
		const toComponent = screen.getByTestId('RecipientTo');
		const toInputElement = within(toComponent).getByRole('textbox');
		const subjectComponent = screen.getByTestId('subject');
		const subjectInputElement = within(subjectComponent).getByRole('textbox');
		const editorTextareaElement = await screen.findByTestId('MailPlainTextEditor');

		// Check for the status of the "send" button to be disabled
		expect(btnSend).toBeVisible();
		expect(btnSend).toBeDisabled();

		// Reset the content of the "to" component and type the address
		await user.click(toInputElement);
		await user.clear(toInputElement);
		await user.type(toInputElement, address);

		// Click on the "CC" button to show CC Recipient field
		await user.click(btnCc);
		const ccComponent = screen.getByTestId('RecipientCc');
		const ccInputElement = within(ccComponent).getByRole('textbox');

		// Reset the content of the "Cc" component and type the address
		await user.click(ccInputElement);
		await user.clear(ccInputElement);
		await user.type(ccInputElement, ccAddress);

		// Click on another component to trigger the change event
		await user.click(subjectInputElement);

		// Check for the status of the "send" button to be enabled
		expect(btnSend).toBeEnabled();

		// Insert a subject
		await user.type(subjectInputElement, subject);
		act(() => jest.advanceTimersByTime(1000));

		// Insert a text inside editor
		await user.type(editorTextareaElement, body);
		act(() => jest.advanceTimersByTime(1000));

		// Register a handler for the REST call
		getSetupServerApi().use(
			rest.post('/service/soap/SendMsgRequest', async (req, res, ctx) => {
				if (!req) {
					throw new Error('Empty request');
				}

				const msg = (await req.json()).Body.SendMsgRequest.m;
				try {
					expect(msg.su._content).toBe(subject);
					msg.e.forEach((participant) => {
						if (participant.t === 't') {
							expect(participant.a).toBe(address);
						} else if (participant.t === 'f') {
							expect(participant.a).toBe(from);
						}
					});
					expect(msg.mp[0].content._content).toBe(body);
				} catch (error) {
					console.error(error);
					throw error;
				}

				const response = {
					Header: {
						context: {
							session: {
								id: '1220806',
								_content: '1220806'
							}
						}
					},
					Body: {
						SendMsgResponse: {
							m: [
								{
									id: '1'
								}
							],
							_jsns: 'urn:zimbraMail'
						}
					},
					_jsns: 'urn:zimbraSoap'
				};

				return res(ctx.json(response));
			})
		);

		// Click on the "send" button
		await user.click(btnSend);

		// Check if a snackbar (countdown) will appear
		await screen.findByText('messages.snackbar.sending_mail_in_count', {}, { timeout: 4000 });

		// Wait for the snackbar to disappear
		await waitForElementToBeRemoved(
			() => screen.queryByText('messages.snackbar.sending_mail_in_count'),
			{ timeout: 10000 }
		);

		// Check if a snackbar (email sent) will appear
		await screen.findByText('messages.snackbar.mail_sent', {}, { timeout: 4000 });
		// await screen.findByText('label.error_try_again', {}, { timeout: 4000 });

		// console.log('**** editors', selectEditors(store.getState()));
	}, 150000);
});
