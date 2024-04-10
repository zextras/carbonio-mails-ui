/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import {
	act,
	fireEvent,
	screen,
	waitFor,
	waitForElementToBeRemoved,
	within
} from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { find, noop } from 'lodash';

import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { defaultBeforeAllTests } from '../../../../../carbonio-ui-commons/test/jest-setup';
import { createFakeIdentity } from '../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import {
	FOLDERS,
	useBoard as mockedUseBoard
} from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { getMocksContext } from '../../../../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { EditViewActions, MAILS_ROUTE } from '../../../../../constants';
import * as useQueryParam from '../../../../../hooks/use-query-param';
import * as saveDraftAction from '../../../../../store/actions/save-draft';
import { addEditor } from '../../../../../store/zustand/editor';
import { generateNewMessageEditor } from '../../../../../store/zustand/editor/editor-generators';
import { setupEditorStore } from '../../../../../tests/generators/editor-store';
import { readyToBeSentEditorTestCase } from '../../../../../tests/generators/editors';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import type {
	CreateSmartLinksRequest,
	SoapDraftMessageObj,
	SoapEmailMessagePartObj,
	SoapMailMessage,
	SoapMailMessagePart
} from '../../../../../types';
import { SoapSendMsgResponse } from '../../../../../types/soap/send-msg';
import { EditView, EditViewProp } from '../edit-view';

const CT_HTML = 'text/html' as const;
const CT_PLAIN = 'text/plain' as const;
const CT_MULTIPART_ALTERNATIVE = 'multipart/alternative';
const FAKE_MESSAGE_ID = '11215';

const extractPartContent = (content: string | { _content: string } | undefined): string => {
	if (!content) {
		return '';
	}

	if (typeof content === 'string') {
		return content;
	}

	return content._content;
};

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

		return extractPartContent(part.content);
	}

	return '';
};

const createSmartLinkFailureAPIInterceptor = (): Promise<CreateSmartLinksRequest> =>
	createAPIInterceptor<CreateSmartLinksRequest, ErrorSoapBodyResponse>('CreateSmartLinks', {
		Fault: {
			Reason: { Text: 'Failed upload to Files' },
			Detail: {
				Error: { Code: '123', Detail: 'Failed due to connection timeout' }
			}
		}
	});

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
			setupEditorStore({ editors: [] });
			const reduxStore = generateStore();
			const editor = generateNewMessageEditor(reduxStore.dispatch);
			addEditor({ id: editor.id, editor });

			// Get the default identity address
			const mocksContext = getMocksContext();
			const from = mocksContext.identities.primary.identity.email;
			const { fullName } = mocksContext.identities.primary.identity;
			const address = faker.internet.email();
			const ccAddress = faker.internet.email();
			const subject = faker.lorem.sentence(1);
			const body = faker.lorem.sentence(10);

			const props: EditViewProp = {
				editorId: editor.id,
				closeController: noop
			};

			// Create and wait for the component to be rendered
			const { user } = setupTest(<EditView {...props} />, { store: reduxStore });
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
			await act(() => user.click(toInputElement));
			await act(() => user.clear(toInputElement));
			await act(() => user.type(toInputElement, address));

			// Click on the "CC" button to show CC Recipient field
			await act(() => user.click(btnCc));
			const ccComponent = screen.getByTestId('RecipientCc');
			const ccInputElement = within(ccComponent).getByRole('textbox');

			// Reset the content of the "Cc" component and type the address
			await act(() => user.click(ccInputElement));
			await act(() => user.clear(ccInputElement));
			await act(() => user.type(ccInputElement, ccAddress));

			// Insert a subject
			await act(() => user.click(subjectInputElement));
			await act(() => user.type(subjectInputElement, subject));

			const optionIcon = screen.getByTestId('options-dropdown-icon');
			expect(optionIcon).toBeInTheDocument();
			await act(() => user.click(optionIcon));
			const markAsImportantOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
				/label\.mark_as_important/i
			);
			expect(markAsImportantOption).toBeVisible();
			act(() => {
				jest.advanceTimersByTime(10000);
			});

			// Workaround of typing problem in the preset textarea
			await act(() => user.clear(editorTextareaElement));

			// Insert a text inside editor
			await act(() => user.type(editorTextareaElement, body));
			await act(() => user.click(subjectInputElement));

			// Check for the status of the "send" button to be enabled
			expect(btnSend).toBeEnabled();

			const response = {
				m: [
					{
						id: '1'
					}
				],
				_jsns: 'urn:zimbraMail'
			};
			const sendMsgPromise = createAPIInterceptor<{ m: SoapDraftMessageObj }, SoapSendMsgResponse>(
				'SendMsg',
				response
			);

			await waitFor(() => {
				expect(btnSend).toBeEnabled();
			});

			// Click on the "send" button
			// The button's existence is already tested above
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			await user.click(btnSend);

			// Check if a snackbar (countdown) will appear
			await screen.findByText('messages.snackbar.sending_mail_in_count', {}, { timeout: 2000 });

			// Wait for the snackbar to disappear
			await waitForElementToBeRemoved(
				() => screen.queryByText('messages.snackbar.sending_mail_in_count'),
				{ timeout: 10000 }
			);

			act(() => {
				jest.advanceTimersByTime(4000);
			});

			// Obtain the message from the rest handler
			const { m: msg } = await sendMsgPromise;

			// Check the content of the message
			expect(msg.su._content).toBe(subject);

			msg.e.forEach((participant) => {
				if (participant.t === 't') {
					expect(participant.a).toBe(address);
				} else if (participant.t === 'f') {
					expect(participant.a).toBe(from);
					expect(participant.p).toBe(fullName);
				}
			});

			// Check if a snackbar (email sent) will appear
			// await screen.findByText('messages.snackbar.mail_sent', {}, { timeout: 5000 });
			// await screen.findByText('label.error_try_again', {}, { timeout: 4000 });
			expect(getSoapMailBodyContent(msg, CT_PLAIN)).toBe(body);
		}, 200000);

		describe('send email with attachment to convert in smart link', () => {
			beforeAll(() => {
				defaultBeforeAllTests({ onUnhandledRequest: 'error' });
			});

			test('should show error-try-again snackbar message on CreateSmartLink soap failure ', async () => {
				// setup api interceptor and mail to send editor
				const apiInterceptor = createSmartLinkFailureAPIInterceptor();
				setupEditorStore({ editors: [] });
				const store = generateStore();
				const editor = await readyToBeSentEditorTestCase(store.dispatch, {
					savedAttachments: [
						{
							filename: 'large-document.pdf',
							contentType: 'application/pdf',
							requiresSmartLinkConversion: true,
							size: 81290955,
							messageId: FAKE_MESSAGE_ID,
							partName: '2',
							isInline: false
						}
					]
				});
				addEditor({ id: editor.id, editor });
				// render the component
				const { user } = setupTest(
					<EditView {...{ editorId: editor.id, closeController: noop }} />,
					{ store }
				);
				expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

				// trigger mail sending
				const btnSend = screen.queryByTestId('BtnSendMailMulti');
				expect(btnSend).toBeEnabled();
				await user.click(btnSend as Element);

				// assertions
				await apiInterceptor;
				await screen.findByText('label.error_try_again', {}, { timeout: 2000 });
				expect(await screen.findByTestId('edit-view-editor')).toBeVisible();

				act(() => {
					jest.advanceTimersByTime(4000);
				});
			}, 200000);
		});

		/**
		 * Test the creation of a new email
		 */
		test('create a new email and text format should be as per setting', async () => {
			setupEditorStore({ editors: [] });
			const reduxStore = generateStore();
			const editor = generateNewMessageEditor(reduxStore.dispatch);
			addEditor({ id: editor.id, editor });

			// Text format should be plain as per the settings done
			expect(editor.isRichText).toBe(false);
		}, 20000);
	});

	/**
	 * Test the email drafts
	 */
	describe('Draft', () => {
		test.skip('is saved when user clicks on the save button', async () => {
			setupEditorStore({ editors: [] });
			const reduxStore = generateStore();
			const editor = generateNewMessageEditor(reduxStore.dispatch);
			addEditor({ id: editor.id, editor });

			const props = {
				editorId: editor.id,
				closeController: noop
			};

			// Create and wait for the component to be rendered
			const { user } = setupTest(<EditView {...props} />, { store: reduxStore });
			await waitFor(
				() => {
					expect(screen.getByTestId('edit-view-editor')).toBeInTheDocument();
				},
				{ timeout: 30000 }
			);
			const draftSavingInterceptor = createAPIInterceptor<{ m: SoapDraftMessageObj }>('SaveDraft');

			const subject = faker.lorem.sentence(5);
			// Get the default identity address
			const mocksContext = getMocksContext();
			const sender = mocksContext.identities.primary.identity.email;
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
			const { m: msg } = await draftSavingInterceptor;

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

		test.skip('is not autosaved if unchanged', async () => {
			// Mock the saveDraft
			const mockedSaveDraft = jest.spyOn(saveDraftAction, 'saveDraftV3');

			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const props = {
				editorId: 'new-1',
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

		test.skip('is autosaved if subject is changed', async () => {
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const props = {
				editorId: 'new-1',
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
			const draftSavingInterceptor = createAPIInterceptor<{ m: SoapDraftMessageObj }>(
				'SaveDraftRequest'
			);

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

			const { m: msg } = await draftSavingInterceptor;
			expect(msg.su._content).toBe(subjectText);
		}, 50000);

		test.skip('is autosaved if recipient (to) is changed', async () => {
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const props = {
				editorId: 'new-1',
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
			const draftSavingInterceptor = createAPIInterceptor<{ m: SoapDraftMessageObj }>(
				'SaveDraftRequest'
			);

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

			const { m: msg } = await draftSavingInterceptor;
			const sentRecipient = msg.e.reduce((prev, participant) =>
				participant.t === 't' ? participant : prev
			);

			expect(sentRecipient?.a).toBe(recipient);
		}, 50000);

		test.skip('is autosaved if body is changed', async () => {
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const props = {
				editorId: 'new-1',
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
			const draftSavingInterceptor = createAPIInterceptor<{ m: SoapDraftMessageObj }>(
				'SaveDraftRequest'
			);

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

			const { m: msg } = await draftSavingInterceptor;
			expect(msg.mp[0]?.content?._content).toBe(body);
		}, 50000);

		test.skip('is not autosaved within 2 seconds if body is changed', async () => {
			// Spy the saveDraftAction
			const mockedSaveDraft = jest.spyOn(saveDraftAction, 'saveDraftV3');

			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const props = {
				editorId: 'new-1',
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

		test.skip('is autosaved if a file is attached', async () => {
			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const props = {
				editorId: 'new-1',
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
			const draftSavingInterceptor = createAPIInterceptor<{ m: SoapDraftMessageObj }>(
				'SaveDraftRequest'
			);

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
		test.skip('identity selector must be visible when multiple identities are present', async () => {
			const store = generateStore();

			// Mock the "action" query param
			jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
				if (param === 'action') {
					return 'new';
				}
				return undefined;
			});

			const props = {
				editorId: 'new-1',
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
			test.skip('user default identity is selected', async () => {
				// Get the default identity address
				const mocksContext = getMocksContext();
				const defaultIdentityAddress = mocksContext.identities.primary.identity.email;

				const store = generateStore();

				// Mock the "action" query param
				jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
					if (param === 'action') {
						return 'new';
					}
					return undefined;
				});

				const props = {
					editorId: 'new-1',
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
					defaultIdentityAddress
				);
			});
		});
		describe('Reply mail', () => {
			describe('fallback selection', () => {
				test.skip("user default identity is selected when the message' recipients don't include any user's address", async () => {
					// Get the default identity address
					const mocksContext = getMocksContext();
					const defaultIdentityAddress = mocksContext.identities.primary.identity.email;

					// Generate the message
					const msg = generateMessage({ isComplete: true });

					const store = generateStore({
						messages: {
							searchedInFolder: {},
							messages: {
								[msg.id]: msg
							},
							searchRequestStatus: null
						}
					});

					// Mock the "action" query param
					jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
						if (param === 'action') {
							return EditViewActions.REPLY;
						}
						return undefined;
					});

					// Mock the board context
					mockedUseBoard.mockImplementation(() => ({
						url: `${MAILS_ROUTE}/edit/${msg.id}?action=${EditViewActions.REPLY}`,
						context: { editorId: msg.id, folderId: FOLDERS.INBOX },
						title: ''
					}));

					const props = {
						editorId: 'new-1',
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
						defaultIdentityAddress
					);
				});
			});

			describe('priority by opening folder', () => {
				test.skip("user primary account identity is selected when message, sent to a user account AND a shared account, is opened from the primary account's folder", async () => {
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
							searchRequestStatus: null
						}
					});

					// Mock the "action" query param
					jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
						if (param === 'action') {
							return EditViewActions.REPLY;
						}
						return undefined;
					});

					// Mock the board context
					mockedUseBoard.mockImplementation(() => ({
						url: `${MAILS_ROUTE}/edit/${msg.id}?action=${EditViewActions.REPLY}`,
						context: { editorId: msg.id, folderId: FOLDERS.INBOX },
						title: ''
					}));

					const props = {
						editorId: 'new-1',
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

				test.skip("shared account identity is selected when message, sent to a user account AND a shared account, is opened from the shared account's folder", async () => {
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
							searchRequestStatus: null
						}
					});

					populateFoldersStore();

					// Mock the "action" query param
					jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
						if (param === 'action') {
							return EditViewActions.REPLY;
						}
						return undefined;
					});

					// Mock the board context
					mockedUseBoard.mockImplementation(() => ({
						url: `${MAILS_ROUTE}/edit/${msg.id}?action=${EditViewActions.REPLY}`,
						context: { editorId: msg.id, folderId },
						title: ''
					}));

					const props = {
						editorId: 'new-1',
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
