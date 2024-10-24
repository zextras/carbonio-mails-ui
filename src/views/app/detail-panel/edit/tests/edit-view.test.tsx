/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import * as hooks from '@zextras/carbonio-shell-ui';
import { find, noop } from 'lodash';
import { HttpResponse } from 'msw';

import { aFailingSaveDraft, aSuccessfullSaveDraft } from './utils/utils';
import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { defaultBeforeAllTests } from '../../../../../carbonio-ui-commons/test/jest-setup';
import { createFakeIdentity } from '../../../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import { useBoard as mockedUseBoard } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import {
	createAPIInterceptor,
	createSoapAPIInterceptor
} from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { getEmptyMSWShareInfoResponse } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/handle-get-share-info';
import { generateSettings } from '../../../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { getMocksContext } from '../../../../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { buildSoapErrorResponseBody } from '../../../../../carbonio-ui-commons/test/mocks/utils/soap';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { EditViewActions, MAILS_ROUTE } from '../../../../../constants';
import * as useQueryParam from '../../../../../hooks/use-query-param';
import * as saveDraftAction from '../../../../../store/actions/save-draft';
import {
	GetSignaturesRequest,
	GetSignaturesResponse
} from '../../../../../store/actions/signatures';
import { addEditor } from '../../../../../store/zustand/editor';
import {
	generateEditAsNewEditor,
	generateNewMessageEditor,
	generateReplyAllMsgEditor,
	generateReplyMsgEditor
} from '../../../../../store/zustand/editor/editor-generators';
import { setupEditorStore } from '../../../../../tests/generators/editor-store';
import { readyToBeSentEditorTestCase } from '../../../../../tests/generators/editors';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import type {
	CreateSmartLinksRequest,
	MailsEditorV2,
	SaveDraftRequest,
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

const extractPartContent = (content: string | { _content: string } | undefined): string => {
	if (!content) {
		return '';
	}

	if (typeof content === 'string') {
		return content;
	}

	return content._content;
};
async function awaitDebouncedSaveDraft(time = 2_000): Promise<void> {
	jest.advanceTimersByTime(time);
}

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
	createSoapAPIInterceptor<CreateSmartLinksRequest, ErrorSoapBodyResponse>(
		'CreateSmartLinks',
		buildSoapErrorResponseBody({
			detailCode: 'Failed upload to Files',
			code: '123',
			reason: 'Failed due to connection timeout'
		})
	);

const clearAndInsertText =
	(user: UserEvent, target: Element, text: string) => async (): Promise<void> => {
		await user.click(target);
		await user.clear(target);
		await user.type(target, text);
	};

jest.mock('../../../../../store/zustand/editor', () => ({
	...jest.requireActual('../../../../../store/zustand/editor'),
	deleteEditor: jest.fn()
}));

describe('Edit view', () => {
	describe('Mail creation', () => {
		beforeEach(() => {
			aSuccessfullSaveDraft();
			createSoapAPIInterceptor('GetShareInfo');
		});
		// warning
		it('should correctly send a new email', async () => {
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
			const settings = generateSettings({
				prefs: {
					zimbraFeatureMailSendLaterEnabled: 'FALSE'
				},
				props: [
					{
						zimlet: 'carbonio-mails-ui',
						name: 'mails_snackbar_delay',
						_content: '0'
					}
				]
			});

			jest.spyOn(hooks, 'getUserSettings').mockReturnValue(settings);

			const { user } = setupTest(<EditView {...props} />, { store: reduxStore });

			// Get the components
			const btnSend = await screen.findByTestId(/BtnSendMail/i);
			const btnCc = screen.getByTestId('BtnCc');
			const toComponent = screen.getByTestId('RecipientTo');
			const toInputElement = within(toComponent).getByRole('textbox');
			const subjectComponent = screen.getByTestId('subject');
			const subjectInputElement = within(subjectComponent).getByRole('textbox');
			const editorTextareaElement = screen.getByTestId('MailPlainTextEditor') as HTMLInputElement;

			expect(btnSend).toBeVisible();

			await waitFor(clearAndInsertText(user, toInputElement, address));
			await waitFor(async () => {
				await user.tab();
				await user.click(btnCc);
			});

			// Click on the "CC" button to show CC Recipient field
			const ccComponent = screen.getByTestId('RecipientCc');
			const ccInputElement = within(ccComponent).getByRole('textbox');

			await waitFor(clearAndInsertText(user, ccInputElement, ccAddress));

			// Insert a subject
			await waitFor(clearAndInsertText(user, subjectInputElement, subject));

			const optionIcon = screen.getByTestId('options-dropdown-icon');
			expect(optionIcon).toBeInTheDocument();

			await act(async () => {
				await user.click(optionIcon);
			});
			const markAsImportantOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
				/label\.mark_as_important/i
			);
			expect(markAsImportantOption).toBeVisible();

			await act(async () => {
				awaitDebouncedSaveDraft();
			});

			await waitFor(clearAndInsertText(user, editorTextareaElement, body));

			// // Check for the status of the "send" button to be enabled
			await waitFor(() => expect(btnSend).toBeEnabled());

			const response = {
				m: [
					{
						id: '1'
					}
				],
				_jsns: 'urn:zimbraMail'
			};
			const sendMsgPromise = createSoapAPIInterceptor<
				{ m: SoapDraftMessageObj },
				SoapSendMsgResponse
			>('SendMsg', response);

			await act(async () => {
				await user.click(btnSend);
			});

			const { m: msg } = await sendMsgPromise;

			expect(msg.su._content).toBe(subject);

			msg.e.forEach((participant) => {
				if (participant.t === 't') {
					expect(participant.a).toBe(address);
				} else if (participant.t === 'f') {
					expect(participant.a).toBe(from);
					expect(participant.p).toBe(fullName);
				}
			});
			act(() => {
				expect(getSoapMailBodyContent(msg, CT_PLAIN)).toBe(body);
			});
		});

		it('create a new email and text format should be as per setting', async () => {
			setupEditorStore({ editors: [] });
			const reduxStore = generateStore();
			const editor = generateNewMessageEditor(reduxStore.dispatch);
			addEditor({ id: editor.id, editor });

			// Text format should be plain as per the settings done
			expect(editor.isRichText).toBe(false);
		});
	});

	describe('send email with attachment to convert to smart link', () => {
		beforeAll(() => {
			defaultBeforeAllTests({ onUnhandledRequest: 'error' });
		});

		it.skip('should show error-try-again snackbar message on CreateSmartLink soap failure ', async () => {
			createAPIInterceptor(
				'post',
				'/service/soap/GetShareInfoRequest',
				HttpResponse.json(getEmptyMSWShareInfoResponse())
			);
			// setup api interceptor and mail to send editor
			const apiInterceptor = createSmartLinkFailureAPIInterceptor();
			setupEditorStore({ editors: [] });
			const store = generateStore();
			const editor = await readyToBeSentEditorTestCase(store.dispatch, {
				id: '123-testId',
				did: '123-testId',
				savedAttachments: [
					{
						filename: 'large-document.pdf',
						contentType: 'application/pdf',
						requiresSmartLinkConversion: true,
						size: 81290955,
						messageId: '123-testId',
						partName: '2',
						isInline: false
					}
				]
			});
			addEditor({ id: editor.id, editor });

			const { user } = setupTest(<EditView {...{ editorId: editor.id, closeController: noop }} />, {
				store
			});
			const btnSend = screen.queryByTestId('BtnSendMailMulti');
			await waitFor(() => expect(btnSend).toBeEnabled());
			await act(async () => {
				await user.click(btnSend as HTMLElement);
			});

			await apiInterceptor;
			await waitFor(() => screen.findByText('label.error_try_again'));
			expect(await screen.findByTestId('edit-view-editor')).toBeVisible();
		});
	});

	describe('Draft', () => {
		beforeEach(() => {
			createAPIInterceptor(
				'post',
				'/service/soap/GetShareInfoRequest',
				HttpResponse.json(getEmptyMSWShareInfoResponse())
			);
		});

		it('is not autosaved on initialization if draft id is present', async () => {
			const mockedSaveDraft = jest.spyOn(saveDraftAction, 'saveDraftV3');

			aSuccessfullSaveDraft();
			setupEditorStore({ editors: [] });
			const reduxStore = generateStore();
			const editor = generateNewMessageEditor(reduxStore.dispatch);
			addEditor({ id: editor.id, editor: { ...editor, did: '123' } });

			act(() => {
				setupTest(<EditView editorId={editor.id} closeController={noop} />, { store: reduxStore });
			});
			await act(async () => {
				jest.advanceTimersByTime(5_000);
			});
			expect(mockedSaveDraft).not.toHaveBeenCalled();
		});

		it('is autosaved on initialization if draft id is not present', async () => {
			const interceptor = aSuccessfullSaveDraft();
			setupEditorStore({ editors: [] });
			const reduxStore = generateStore();
			const editor = generateNewMessageEditor(reduxStore.dispatch);
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />, { store: reduxStore });
			await interceptor;
			expect(await screen.findByText('message.email_saved_at')).toBeVisible();
		});

		describe('it saves the draft when the user', () => {
			beforeEach(() => {
				jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
					if (param === 'action') {
						return 'new';
					}
					return undefined;
				});
			});

			it('clicks on the save button', async () => {
				setupEditorStore({ editors: [] });
				const reduxStore = generateStore();
				const editor = generateNewMessageEditor(reduxStore.dispatch);
				addEditor({ id: editor.id, editor });

				const props = {
					editorId: editor.id,
					closeController: noop
				};

				const firstSaveDraftInterceptor = aSuccessfullSaveDraft();
				const { user } = setupTest(<EditView {...props} />, { store: reduxStore });

				await firstSaveDraftInterceptor;
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				createSoapAPIInterceptor<GetSignaturesRequest, GetSignaturesResponse>('GetSignatures', {
					signature: [],
					_jsns: 'urn:zimbraAccount'
				});

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

				await waitFor(clearAndInsertText(user, toInputElement, recipient));

				await act(async () => {
					await user.click(btnCc);
				});

				const ccComponent = screen.getByTestId('RecipientCc');
				const ccInputElement = within(ccComponent).getByRole('textbox');

				await waitFor(clearAndInsertText(user, ccInputElement, cc));

				await waitFor(clearAndInsertText(user, subjectInputElement, subject));

				await waitFor(clearAndInsertText(user, editorTextareaElement, body));

				await act(async () => {
					await user.click(btnSave);
				});

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
			});

			it('changes the subject', async () => {
				setupEditorStore({ editors: [] });
				const reduxStore = generateStore();
				const editor = generateNewMessageEditor(reduxStore.dispatch);
				addEditor({ id: editor.id, editor });
				const props = {
					editorId: editor.id,
					closeController: noop
				};
				const firstSaveDraftInterceptor = aSuccessfullSaveDraft();
				const { user } = setupTest(<EditView {...props} />, { store: reduxStore });
				await firstSaveDraftInterceptor;
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				const subjectText =
					"This is the most interesting subject ever! It's all about unicorns brewing beers for the elves";
				const subjectInputElement = within(screen.getByTestId('subject')).getByRole('textbox');
				await waitFor(clearAndInsertText(user, subjectInputElement, subjectText));

				await act(async () => {
					awaitDebouncedSaveDraft();
				});

				const { m: msg } = await draftSavingInterceptor;
				expect(msg.su._content).toBe(subjectText);
			});

			it('changes the recipient (to)', async () => {
				setupEditorStore({ editors: [] });
				const reduxStore = generateStore();
				const editor = generateNewMessageEditor(reduxStore.dispatch);
				addEditor({ id: editor.id, editor });
				const props = {
					editorId: editor.id,
					closeController: noop
				};
				const firstSaveDraftInterceptor = aSuccessfullSaveDraft();
				const { user } = setupTest(<EditView {...props} />, { store: reduxStore });
				await firstSaveDraftInterceptor;
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				const recipient = createFakeIdentity().email;
				const toInputElement = within(screen.getByTestId('RecipientTo')).getByRole('textbox');
				await waitFor(clearAndInsertText(user, toInputElement, recipient));
				await waitFor(async () => {
					await user.tab();
				});

				await act(async () => {
					awaitDebouncedSaveDraft();
				});

				const { m: msg } = await draftSavingInterceptor;
				const sentRecipient = msg.e[0];
				expect(sentRecipient.a).toBe(recipient);
			});

			it('changes the body', async () => {
				setupEditorStore({ editors: [] });
				const reduxStore = generateStore();
				const editor = generateNewMessageEditor(reduxStore.dispatch);
				addEditor({ id: editor.id, editor });
				const props = {
					editorId: editor.id,
					closeController: noop
				};
				const firstSaveDraftInterceptor = aSuccessfullSaveDraft();
				const { user } = setupTest(<EditView {...props} />, { store: reduxStore });
				await firstSaveDraftInterceptor;
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				const body = faker.lorem.text();

				const editorTextareaElement = await screen.findByTestId('MailPlainTextEditor');

				// Insert the text into the text area
				await waitFor(clearAndInsertText(user, editorTextareaElement, body));

				await act(async () => {
					awaitDebouncedSaveDraft();
				});

				const { m: msg } = await draftSavingInterceptor;
				expect(msg.mp[0]?.content?._content).toBe(body);
			});

			it('attaches a file', async () => {
				setupEditorStore({ editors: [] });
				createAPIInterceptor('post', '/service/upload', new HttpResponse(null, { status: 200 }));
				const reduxStore = generateStore();
				const editor = generateNewMessageEditor(reduxStore.dispatch);
				addEditor({ id: editor.id, editor });
				const props = {
					editorId: editor.id,
					closeController: noop
				};
				const saveDraftSpy = jest.spyOn(saveDraftAction, 'saveDraftV3');
				const firstSaveDraft = aSuccessfullSaveDraft();

				const { user } = setupTest(<EditView {...props} />, { store: reduxStore });
				await firstSaveDraft;
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				const fileInput = screen.getByTestId('file-input');
				await act(async () => {
					await user.upload(
						fileInput,
						new File(['test string'], 'test.txt', { type: 'text/plain' })
					);
				});

				await act(async () => {
					awaitDebouncedSaveDraft();
				});

				await draftSavingInterceptor;
				expect(saveDraftSpy).toHaveBeenCalledTimes(2);
			});
		});

		describe('send button', () => {
			describe('is disabled when draft cannot be saved', () => {
				let reduxStore: ReturnType<typeof generateStore>;
				let failingSaveDraft: Promise<SaveDraftRequest>;
				beforeEach(() => {
					failingSaveDraft = aFailingSaveDraft();
					setupEditorStore({ editors: [] });
					reduxStore = generateStore();
				});
				const checkSaveBtnIsDisabled = async (editor: MailsEditorV2): Promise<void> => {
					addEditor({
						id: editor.id,
						editor
					});
					setupTest(<EditView editorId={editor.id} closeController={noop} />);
					await act(async () => {
						await failingSaveDraft;
					});

					screen.queryByText('label.error_try_again');
					const btnSend =
						screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
					expect(btnSend).toBeVisible();
					expect(btnSend).toBeDisabled();
				};

				it('and action is "new editor"', async () => {
					const editor = generateNewMessageEditor(reduxStore.dispatch);
					await checkSaveBtnIsDisabled(editor);
				});

				it('and action is "reply"', async () => {
					const message = generateMessage({
						isComplete: true
					});
					const editor = generateReplyMsgEditor(reduxStore.dispatch, message);
					await checkSaveBtnIsDisabled(editor);
				});
			});

			describe('is enabled when draft is saved', () => {
				let reduxStore: ReturnType<typeof generateStore>;
				beforeEach(() => {
					aSuccessfullSaveDraft();
					setupEditorStore({ editors: [] });
					reduxStore = generateStore();
				});
				const checkSendBtnEnabled = async (editor: MailsEditorV2): Promise<void> => {
					addEditor({
						id: editor.id,
						editor: { ...editor }
					});

					setupTest(<EditView editorId={editor.id} closeController={noop} />);

					expect(await screen.findByText('message.email_saved_at')).toBeVisible();
					const btnSend =
						screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
					expect(btnSend).toBeVisible();
					expect(btnSend).toBeEnabled();
				};

				it('and action is "reply"', async () => {
					const message = generateMessage({
						isComplete: true
					});

					const editor = generateReplyMsgEditor(reduxStore.dispatch, message);

					await checkSendBtnEnabled(editor);
				});

				it('and action is "replyAll"', async () => {
					const message = generateMessage({
						isComplete: true
					});

					const editor = generateReplyAllMsgEditor(reduxStore.dispatch, message);

					await checkSendBtnEnabled(editor);
				});
			});

			it('is enabled when an editor is created with "edit as new" action and a draft is saved', async () => {
				aSuccessfullSaveDraft();
				setupEditorStore({ editors: [] });
				const reduxStore = generateStore();

				const message = generateMessage({ isComplete: true });
				const editor = generateEditAsNewEditor(reduxStore.dispatch, message);

				addEditor({
					id: editor.id,
					editor
				});

				const props: EditViewProp = {
					editorId: editor.id,
					closeController: noop
				};

				setupTest(<EditView {...props} />, { store: reduxStore });
				expect(await screen.findByText('message.email_saved_at')).toBeVisible();
				const btnSend =
					screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
				expect(btnSend).toBeVisible();
				expect(btnSend).toBeEnabled();
			});
		});
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
