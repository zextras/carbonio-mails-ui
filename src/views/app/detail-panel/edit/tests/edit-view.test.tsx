/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import {
	act,
	fireEvent,
	screen,
	waitFor,
	waitForElementToBeRemoved,
	within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FOLDERS, getUserAccount } from '@zextras/carbonio-shell-ui';
import { find, noop } from 'lodash';
import React from 'react';
import { rest } from 'msw';
import { createFakeIdentity } from '../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import * as useQueryParam from '../../../../../hooks/useQueryParam';
import * as saveDraftAction from '../../../../../store/actions/save-draft';
import { generateStore } from '../../../../../tests/generators/store';
import { SoapDraftMessageObj } from '../../../../../types';
import * as editUtils from '../edit-utils';
import EditView from '../edit-view';
import { getSetupServerApi } from '../../../../../carbonio-ui-commons/test/jest-setup';

describe('Edit view', () => {
	/**
	 *
	 */
	describe('Mail creation', () => {
		test('create a new email', async () => {
			const store = generateStore();

			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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
			act(() => {
				jest.advanceTimersByTime(1000);
			});

			// Insert a text inside editor
			await user.type(editorTextareaElement, body);
			act(() => {
				jest.advanceTimersByTime(1000);
			});

			const sendMsgPromise = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServerApi().use(
					rest.post('/service/soap/SendMsgRequest', async (req, res, ctx) => {
						if (!req) {
							reject(new Error('Empty request'));
						}

						const sentMsg = (await req.json()).Body.SendMsgRequest.m;
						resolve(sentMsg);
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
			});

			// Click on the "send" button
			await user.click(btnSend);

			// Check if a snackbar (countdown) will appear
			await screen.findByText('messages.snackbar.sending_mail_in_count', {}, { timeout: 4000 });

			// Wait for the snackbar to disappear
			await waitForElementToBeRemoved(
				() => screen.queryByText('messages.snackbar.sending_mail_in_count'),
				{ timeout: 10000 }
			);

			// Obtain the message from the rest handler
			const msg = await sendMsgPromise;

			// Check the content of the message
			expect(msg.su._content).toBe(subject);
			msg.e.forEach((participant) => {
				if (participant.t === 't') {
					expect(participant.a).toBe(address);
				} else if (participant.t === 'f') {
					expect(participant.a).toBe(from);
				}
			});
			expect(msg.mp[0]?.content?._content).toBe(body);

			// Check if a snackbar (email sent) will appear
			await screen.findByText('messages.snackbar.mail_sent', {}, { timeout: 4000 });
			// await screen.findByText('label.error_try_again', {}, { timeout: 4000 });
		}, 10000);
	});

	describe('Draft', () => {
		test('is not autosaved if unchanged', async () => {
			// Mock the saveDraft
			const mockedSaveDraft = jest.spyOn(saveDraftAction, 'saveDraft');

			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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

			// Generate the state store
			const store = generateStore();

			// Create and wait for the component to be rendered
			setupTest(<EditView {...props} />, { store });
			await waitFor(() => {
				expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
			});

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(10000);
			});
			expect(mockedSaveDraft).not.toBeCalled();
		});

		test('is autosaved if subject is changed', async () => {
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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

			// Generate the state store
			const store = generateStore();

			// Create and wait for the component to be rendered
			const { user } = setupTest(<EditView {...props} />, { store });
			await waitFor(() => {
				expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
			});

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServerApi().use(
					rest.post('/service/soap/SaveDraftRequest', async (req, res, ctx) => {
						if (!req) {
							reject(new Error('Empty request'));
						}

						const msg = (await req.json()).Body.SaveDraftRequest.m;
						resolve(msg);

						// Don't care about the actual response
						return res(ctx.json({}));
					})
				);
			});

			const subjectText =
				"This is the most interesting subject ever! It's all about unicorns brewing beers for the elves";
			const subjectComponent = screen.getByTestId('subject');
			const subjectInputElement = within(subjectComponent).getByRole('textbox');
			await user.click(subjectInputElement);
			await user.type(subjectInputElement, subjectText);

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(10000);
			});

			const msg = await draftSavingInterceptor;
			expect(msg.su._content).toBe(subjectText);
		});

		test('is autosaved if recipient (to) is changed', async () => {
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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

			// Generate the state store
			const store = generateStore();

			// Create and wait for the component to be rendered
			const { user } = setupTest(<EditView {...props} />, { store });
			await waitFor(() => {
				expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
			});

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServerApi().use(
					rest.post('/service/soap/SaveDraftRequest', async (req, res, ctx) => {
						if (!req) {
							reject(new Error('Empty request'));
						}

						const msg = (await req.json()).Body.SaveDraftRequest.m;
						resolve(msg);

						// Don't care about the actual response
						return res(ctx.json({}));
					})
				);
			});

			const recipient = createFakeIdentity().email;
			const subjectComponent = screen.getByTestId('subject');
			const subjectInputElement = within(subjectComponent).getByRole('textbox');
			const toComponent = screen.getByTestId('RecipientTo');
			const toInputElement = within(toComponent).getByRole('textbox');

			// Reset the content of the "to" component and type the address
			await user.click(toInputElement);
			await user.clear(toInputElement);
			await user.type(toInputElement, recipient);

			// Click on other component to trigger the chip creation
			await user.click(subjectInputElement);

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(10000);
			});

			const msg = await draftSavingInterceptor;
			const sentRecipient = msg.e.reduce((prev, participant) =>
				participant.t === 't' ? participant : prev
			);

			expect(sentRecipient?.a).toBe(recipient);
		});

		test('is autosaved if body is changed', async () => {
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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

			// Generate the state store
			const store = generateStore();

			// Create and wait for the component to be rendered
			const { user } = setupTest(<EditView {...props} />, { store });
			await waitFor(() => {
				expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
			});

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServerApi().use(
					rest.post('/service/soap/SaveDraftRequest', async (req, res, ctx) => {
						if (!req) {
							reject(new Error('Empty request'));
						}

						const msg = (await req.json()).Body.SaveDraftRequest.m;
						resolve(msg);

						// Don't care about the actual response
						return res(ctx.json({}));
					})
				);
			});

			const body = faker.lorem.text();

			const editorTextareaElement = await screen.findByTestId('MailPlainTextEditor');

			// Reset the content of the "to" component and type the address

			// Insert the text into the text area
			await user.type(editorTextareaElement, body);

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(2000);
			});

			const msg = await draftSavingInterceptor;
			expect(msg.mp[0]?.content?._content).toBe(body);
		});

		test('is not autosaved within 2 seconds if body is changed', async () => {
			// Spy the saveDraftAction
			const mockedSaveDraft = jest.spyOn(saveDraftAction, 'saveDraft');

			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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

			// Generate the state store
			const store = generateStore();

			// Create and wait for the component to be rendered
			const { user } = setupTest(<EditView {...props} />, { store });
			await waitFor(() => {
				expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
			});

			const body = faker.lorem.text();

			const editorTextareaElement = await screen.findByTestId('MailPlainTextEditor');

			// Insert the text into the text area
			await user.type(editorTextareaElement, body);

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(1999);
			});

			expect(mockedSaveDraft).not.toBeCalled();
		});

		test('is autosaved if a file is attached', async () => {
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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

			// Generate the state store
			const store = generateStore();

			// Create and wait for the component to be rendered
			const renderResult = setupTest(<EditView {...props} />, { store });
			const { user } = renderResult;
			await waitFor(() => {
				expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
			});

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServerApi().use(
					rest.post('/service/soap/SaveDraftRequest', async (req, res, ctx) => {
						if (!req) {
							reject(new Error('Empty request'));
						}

						const msg = (await req.json()).Body.SaveDraftRequest.m;
						resolve(msg);

						// Result
						const result = {
							Header: {
								context: {
									session: { id: '113405', _content: '113405' },
									change: { token: 21489 },
									notify: [
										{
											seq: 14,
											modified: {
												mbx: [{ s: 248716466 }],
												folder: [
													{
														id: '6',
														uuid: '8d438ed1-5d63-4bfb-8059-0ef93812a488',
														deletable: false,
														n: 2,
														s: 1955,
														i4ms: 21488,
														i4next: 10719
													}
												],
												m: [
													{
														s: 866,
														d: 1669740509000,
														meta: [{}],
														rev: 21488,
														i4uid: 10718,
														id: '10718',
														e: [
															{
																a: 'luca.stauble@zextras.com',
																d: 'luca',
																p: 'luca stauble',
																t: 'f'
															}
														],
														su: ''
													}
												]
											}
										}
									],
									_jsns: 'urn:zimbra'
								}
							},
							Body: {
								SaveDraftResponse: {
									m: [
										{
											s: 866,
											d: 1669740509000,
											l: '6',
											cid: '-10718',
											f: 'sd',
											rev: 21488,
											id: '10718',
											e: [{ a: 'luca.stauble@zextras.com', d: 'luca', p: 'luca stauble', t: 'f' }],
											su: '',
											mid: '\u003C840622014.2092008.1669740509754.JavaMail.zextras@zextras.com\u003E',
											sd: 1669740509000,
											mp: [
												{
													part: 'TEXT',
													ct: 'multipart/mixed',
													mp: [
														{
															part: '1',
															ct: 'multipart/alternative',
															mp: [
																{
																	part: '1.1',
																	ct: 'text/html',
																	s: 120,
																	body: true,
																	content:
																		'\u003Chtml\u003E\u003Cbody\u003E\u003Cdiv style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"\u003E\u003C/div\u003E\u003C/body\u003E\u003C/html\u003E'
																},
																{ part: '1.2', ct: 'text/plain', s: 0 }
															]
														}
													]
												}
											]
										}
									],
									_jsns: 'urn:zimbraMail'
								}
							},
							_jsns: 'urn:zimbraSoap'
						};
						return res(ctx.json({}));
					})
				);
			});

			const attachmentPart = [
				{
					part: '2',
					mid: '1251'
				}
			];

			const fileInput = await screen.findByTestId('file-input');

			const mockedAddAttachments = jest
				.spyOn(editUtils, 'addAttachments')
				.mockResolvedValue(Promise.resolve(attachmentPart));

			await new Promise<void>((resolve, reject) => {
				// eslint-disable-next-line testing-library/prefer-user-event
				fireEvent.change(fileInput, {
					target: {
						files: [new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' })]
					}
				})
					? resolve()
					: reject();
			});

			// expect(mockedAddAttachments).toBeCalled();

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(5000);
			});

			const msg = await draftSavingInterceptor;
			console.log('****************** msg', msg);
			// expect(msg.attach.mp[0]).toEqual(attachmentPart);
		}, 10000);
	});
});
