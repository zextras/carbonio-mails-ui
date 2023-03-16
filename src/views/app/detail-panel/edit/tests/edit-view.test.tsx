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
import { FOLDERS, getUserAccount } from '@zextras/carbonio-shell-ui';
import { find, noop } from 'lodash';
import React from 'react';
import { rest } from 'msw';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { createFakeIdentity } from '../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import { useBoard as mockedUseBoard } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { getMocksContext } from '../../../../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { ActionsType } from '../../../../../commons/utils';
import { MAILS_ROUTE } from '../../../../../constants';
import * as useQueryParam from '../../../../../hooks/useQueryParam';
import * as saveDraftAction from '../../../../../store/actions/save-draft';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import { saveDraftResult } from '../../../../../tests/mocks/network/msw/cases/saveDraft/saveDraft-1';
import {
	SoapDraftMessageObj,
	SoapEmailMessagePartObj,
	SoapMailMessage,
	SoapMailMessagePart
} from '../../../../../types';
import EditView from '../edit-view';
import { getSetupServer } from '../../../../../carbonio-ui-commons/test/jest-setup';

const CT_HTML = 'text/html' as const;
const CT_PLAIN = 'text/plain' as const;
const CT_MULTIPART_ALTERNATIVE = 'multipart/alternative';

/**
 * Extracts the content of the mail message body, if it is found,
 * and it matches the given content type.
 * An empty string is returned otherwise.
 * @param msg
 * @param contentType
 */
const getSoapMailBodyContent = (
	msg: SoapMailMessage | SoapDraftMessageObj,
	contentType: typeof CT_HTML | typeof CT_PLAIN
): string => {
	const mp = msg.mp[0];
	if (!mp) {
		return '';
	}

	/*
	 * If the content type matches (plain or html text) then the
	 * nested content (_content) should be present and will be returned.
	 */
	if (mp.ct === contentType) {
		// FIXME see IRIS-4029
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return msg.mp[0]?.content?._content;
	}

	/*
	 * If the content type is a multipart/alternative then 2 parts should be
	 * present:
	 * - a text/plain type content
	 * - a text/html type content
	 * The one who matches the gioven content type will be returned
	 */
	if (mp.ct === CT_MULTIPART_ALTERNATIVE) {
		const part = find<SoapMailMessagePart | SoapEmailMessagePartObj>(mp.mp, ['ct', contentType]);
		if (!part) {
			return '';
		}

		return part.content && typeof part.content === 'string' ? part.content : '';
	}

	return '';
};

/**
 * Test the EditView component in different scenarios
 */
describe('Edit view', () => {
	/**
	 * Creation of emails
	 */
	describe('Mail creation', () => {
		/**
		 * Test the creation of a new email
		 */
		test('create a new email', async () => {
			const account = getUserAccount();
			const store = generateStore();

			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const from = find(account.identities.identity, ['name', 'DEFAULT'])._attrs
				.zimbraPrefFromAddress;
			const address = faker.internet.email();
			const ccAddress = faker.internet.email();
			const subject = faker.lorem.sentence(1);
			const body = faker.lorem.sentence(10);

			const props = {
				mailId: 'new-1',
				folderId: FOLDERS.INBOX,
				setHeader: noop,
				toggleAppBoard: false
			};

			// Create and wait for the component to be rendered
			const { user, container } = setupTest(<EditView {...props} />, { store });
			expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

			// Get the components
			const btnSend =
				screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
			const btnCc = screen.getByTestId('BtnCc');
			const toComponent = screen.getByTestId('RecipientTo');
			const toInputElement = within(toComponent).getByRole('textbox');
			const subjectComponent = screen.getByTestId('subject');
			const subjectInputElement = within(subjectComponent).getByRole('textbox');
			const editorTextareaElement = screen.getByTestId('MailPlainTextEditor') as HTMLInputElement;

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

			// Insert a subject
			await user.click(subjectInputElement);
			await user.type(subjectInputElement, subject);
			act(() => {
				jest.advanceTimersByTime(10000);
			});

			// Workaround of typing problem in the preset textarea
			await user.clear(editorTextareaElement);

			// Insert a text inside editor
			await user.type(editorTextareaElement, body);

			// Check for the status of the "send" button to be enabled
			expect(btnSend).toBeEnabled();

			const sendMsgPromise = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServer().use(
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
			// The button's existence is already tested above
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
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

			expect(getSoapMailBodyContent(msg, CT_PLAIN)).toBe(body);

			// Check if a snackbar (email sent) will appear
			await screen.findByText('messages.snackbar.mail_sent', {}, { timeout: 4000 });
			// await screen.findByText('label.error_try_again', {}, { timeout: 4000 });
		}, 20000);
	});

	/**
	 * Test the email drafts
	 */
	describe('Draft', () => {
		test('is saved when user clicks on the save button', async () => {
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
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 30000 }
			);

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServer().use(
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

			const subject = faker.lorem.sentence(5);
			const sender = find(getUserAccount().identities.identity, ['name', 'DEFAULT'])._attrs
				.zimbraPrefFromAddress;
			const recipient = faker.internet.email();
			const cc = faker.internet.email();
			const body = faker.lorem.paragraph(5);

			// Get the components
			const btnSave = screen.getByTestId('BtnSaveMail');
			const btnCc = screen.getByTestId('BtnCc');
			const toComponent = screen.getByTestId('RecipientTo');
			const toInputElement = within(toComponent).getByRole('textbox');
			const subjectComponent = screen.getByTestId('subject');
			const subjectInputElement = within(subjectComponent).getByRole('textbox');
			const editorTextareaElement = await screen.findByTestId('MailPlainTextEditor');

			// Reset the content of the "to" component and type the address
			await user.click(toInputElement);
			await user.clear(toInputElement);
			await user.type(toInputElement, recipient);

			// Click on the "CC" button to show CC Recipient field
			await user.click(btnCc);
			const ccComponent = screen.getByTestId('RecipientCc');
			const ccInputElement = within(ccComponent).getByRole('textbox');

			// Reset the content of the "Cc" component and type the address
			await user.click(ccInputElement);
			await user.clear(ccInputElement);
			await user.type(ccInputElement, cc);

			// Click on another component to trigger the change event
			await user.click(subjectInputElement);

			// Insert a subject
			await user.type(subjectInputElement, subject);
			act(() => {
				jest.advanceTimersByTime(1000);
			});

			// Workaround of typing problem in the preset textarea
			await user.clear(editorTextareaElement);

			// Insert a text inside editor
			await user.type(editorTextareaElement, body);
			act(() => {
				jest.advanceTimersByTime(1000);
			});

			// Click on the "save" button
			await user.click(btnSave);

			// Obtain the message from the rest handler
			const msg = await draftSavingInterceptor;

			// Check the content of the message
			expect(msg.su._content).toBe(subject);
			msg.e.forEach((participant) => {
				if (participant.t === 't') {
					expect(participant.a).toBe(recipient);
				} else if (participant.t === 'f') {
					expect(participant.a).toBe(sender);
				}
			});
			expect(msg.mp[0]?.content?._content).toBe(body);
		}, 50000);

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
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 30000 }
			);

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(10000);
			});
			expect(mockedSaveDraft).not.toBeCalled();
		}, 50000);

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
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 30000 }
			);

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServer().use(
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
		}, 50000);

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
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 30000 }
			);

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServer().use(
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
		}, 50000);

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
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 30000 }
			);

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServer().use(
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

			// Workaround of typing problem in the preset textarea
			await user.clear(editorTextareaElement);

			// Insert the text into the text area
			await user.type(editorTextareaElement, body);

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(2000);
			});

			const msg = await draftSavingInterceptor;
			expect(msg.mp[0]?.content?._content).toBe(body);
		}, 50000);

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
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 30000 }
			);

			const body = faker.lorem.text();

			const editorTextareaElement = await screen.findByTestId('MailPlainTextEditor');

			// Insert the text into the text area
			await user.type(editorTextareaElement, body);

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(1999);
			});

			expect(mockedSaveDraft).not.toBeCalled();
		}, 50000);

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
			setupTest(<EditView {...props} />, { store });
			await waitFor(() => {
				expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
			});

			const callTester = jest.fn();

			const draftSavingInterceptor = new Promise<SoapDraftMessageObj>((resolve, reject) => {
				// Register a handler for the REST call
				getSetupServer().use(
					rest.post('/service/soap/SaveDraftRequest', async (req, res, ctx) => {
						callTester();

						if (!req) {
							reject(new Error('Empty request'));
						}

						const msg = (await req.json()).Body.SaveDraftRequest.m;
						resolve(msg);

						// Don't care about the response. Return a fake one
						return res(ctx.json(saveDraftResult));
					})
				);
			});

			const fileInput = await screen.findByTestId('file-input');

			await act(
				() =>
					new Promise<void>((resolve, reject) => {
						// eslint-disable-next-line testing-library/prefer-user-event
						fireEvent.change(fileInput, {
							target: {
								files: [new File(['(⌐□_□)'], 'fakeimage.png', { type: 'image/png' })]
							}
						})
							? resolve()
							: reject();
					})
			);

			// Wait few seconds
			act(() => {
				jest.advanceTimersByTime(5000);
			});

			// Await the call to the saveDraft
			await draftSavingInterceptor;

			// The saveDraft request should be invoked 2 times (1 before and
			// 1 after the upload of the attachment
			expect(callTester).toBeCalledTimes(2);
		}, 50000);
	});

	describe('Identities selection', () => {
		test('identity selector must be visible when multiple identities are present', async () => {
			const store = generateStore();

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

			// Create and wait for the component to be rendered
			setupTest(<EditView {...props} />, { store });
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 10000 }
			);

			expect(screen.getByTestId('from-dropdown')).toBeInTheDocument();
			expect(screen.getByTestId('from-dropdown')).toBeVisible();
		});

		describe('New mail', () => {
			test('user default identity is selected', async () => {
				// Get the default identity
				const defaultIdentity = find(getUserAccount().identities.identity, ['name', 'DEFAULT']);

				const store = generateStore();

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

				// Create and wait for the component to be rendered
				setupTest(<EditView {...props} />, { store });
				await waitFor(
					() => {
						expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
					},
					{ timeout: 10000 }
				);

				expect(screen.getByTestId('from-identity-address')).toHaveTextContent(
					defaultIdentity._attrs.zimbraPrefFromAddress
				);
			});
		});
		describe('Reply mail', () => {
			describe('fallback selection', () => {
				test("user default identity is selected when the message' recipients don't include any user's address", async () => {
					// Get the default identity
					const defaultIdentity = find(getUserAccount().identities.identity, ['name', 'DEFAULT']);

					// Generate the message
					const msg = generateMessage({ isComplete: true });

					const store = generateStore({
						messages: {
							searchedInFolder: {},
							messages: {
								[msg.id]: msg
							},
							status: {}
						}
					});

					// Mock the "action" query param
					jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
						if (param === 'action') {
							return ActionsType.REPLY;
						}
						return undefined;
					});

					// Mock the board context
					mockedUseBoard.mockImplementation(() => ({
						url: `${MAILS_ROUTE}/edit/${msg.id}?action=${ActionsType.REPLY}`,
						context: { mailId: msg.id, folderId: FOLDERS.INBOX },
						title: ''
					}));

					const props = {
						setHeader: noop
					};

					// Create and wait for the component to be rendered
					setupTest(<EditView {...props} />, { store });
					await waitFor(
						() => {
							expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
						},

						{ timeout: 10000 }
					);

					expect(screen.getByTestId('from-dropdown')).toBeInTheDocument();
					expect(screen.getByTestId('from-identity-address')).toHaveTextContent(
						defaultIdentity._attrs.zimbraPrefFromAddress
					);
				});
			});

			describe('priority by opening folder', () => {
				test("user primary account identity is selected when message, sent to a user account AND a shared account, is open from the primary account's folder", async () => {
					// Get the identities
					const mocksContext = getMocksContext();
					const defaultIdentity = mocksContext.identities.primary.identity;
					const sharedAccountIdentity = mocksContext.identities.sendAs[0].identity;

					// Generate the message
					const to = [
						{
							type: ParticipantRole.TO,
							address: defaultIdentity.email,
							fullName: defaultIdentity.fullName
						},
						{
							type: ParticipantRole.TO,
							address: sharedAccountIdentity.email,
							fullName: sharedAccountIdentity.fullName
						}
					];
					const msg = generateMessage({ to, folderId: FOLDERS.INBOX, isComplete: true });

					const store = generateStore({
						messages: {
							searchedInFolder: {},
							messages: {
								[msg.id]: msg
							},
							status: {}
						}
					});

					// Mock the "action" query param
					jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
						if (param === 'action') {
							return ActionsType.REPLY;
						}
						return undefined;
					});

					// Mock the board context
					mockedUseBoard.mockImplementation(() => ({
						url: `${MAILS_ROUTE}/edit/${msg.id}?action=${ActionsType.REPLY}`,
						context: { mailId: msg.id, folderId: FOLDERS.INBOX },
						title: ''
					}));

					const props = {
						setHeader: noop
					};

					// Create and wait for the component to be rendered
					setupTest(<EditView {...props} />, { store });
					expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

					expect(screen.getByTestId('from-dropdown')).toBeInTheDocument();
					expect(screen.getByTestId('from-identity-address')).toHaveTextContent(
						defaultIdentity.email
					);
				});

				test("shared account identity is selected when message, sent to a user account AND a shared account, is open from the shared account's folder", async () => {
					// Get the identities
					const mocksContext = getMocksContext();
					const defaultIdentity = mocksContext.identities.primary.identity;
					const sharedAccountIdentity = mocksContext.identities.sendAs[0].identity;

					// Generate the message
					const to = [
						{
							type: ParticipantRole.TO,
							address: defaultIdentity.email,
							fullName: defaultIdentity.fullName
						},
						{
							type: ParticipantRole.TO,
							address: sharedAccountIdentity.email,
							fullName: sharedAccountIdentity.fullName
						}
					];
					const msgId = `${sharedAccountIdentity.id}:1234`;
					const folderId = `${sharedAccountIdentity.id}:${FOLDERS.INBOX}`;
					const msg = generateMessage({ id: msgId, to, folderId, isComplete: true });

					const store = generateStore({
						messages: {
							searchedInFolder: {},
							messages: {
								[msg.id]: msg
							},
							status: {}
						}
					});

					// Mock the "action" query param
					jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
						if (param === 'action') {
							return ActionsType.REPLY;
						}
						return undefined;
					});

					// Mock the board context
					mockedUseBoard.mockImplementation(() => ({
						url: `${MAILS_ROUTE}/edit/${msg.id}?action=${ActionsType.REPLY}`,
						context: { mailId: msg.id, folderId },
						title: ''
					}));

					const props = {
						setHeader: noop
					};

					// Create and wait for the component to be rendered
					setupTest(<EditView {...props} />, { store });
					expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

					expect(screen.getByTestId('from-dropdown')).toBeInTheDocument();
					expect(screen.getByTestId('from-identity-address')).toHaveTextContent(
						sharedAccountIdentity.email
					);
				});
			});
		});
	});
});
