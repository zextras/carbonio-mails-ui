/* eslint-disable testing-library/no-unnecessary-act,sonarjs/no-duplicate-string */
// noinspection DuplicatedCode

/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useState } from 'react';

import { faker } from '@faker-js/faker';
import { act, waitFor, fireEvent } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';
import { find, noop } from 'lodash';
import { HttpResponse } from 'msw';
import type { Mock } from 'vitest';

import { aSuccessfullSaveDraft, aFailingSaveDraft } from './utils/utils';
import { TESTID_SELECTORS } from '../../../../../__test__/constants';
import * as useQueryParam from '../../../../../hooks/use-query-param';
import { EditView } from '../edit-view';
import { setupTest, screen, within } from '@test-setup';
import {
	useBoard as mockedUseBoard,
	useBoard
} from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import {
	createSoapAPIInterceptor,
	createAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { getEmptyMSWShareInfoResponse } from '@test-utils/network/msw/handle-get-share-info';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { populateFoldersStore } from '@test-utils/store/folders';
import { getMocksContext } from '@test-utils/utils/mocks-context';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewEditor, readyToBeSentEditorTestCase } from '__test__/generators/editors';
import { generateMessage } from '__test__/generators/generateMessage';
import { EditViewActions, MAILS_ROUTE } from 'constants/index';
import { addEditor, useEditorsStore } from 'store/editor';
import {
	generateEditAsNewEditor,
	generateNewMessageEditor,
	generateReplyAllMsgEditor,
	generateReplyMsgEditor
} from 'store/editor/editor-generators';
import { MailsEditorV2 } from 'types/editor';
import {
	SaveDraftRequest,
	SaveDraftResponse,
	SoapDraftMessageObj,
	SoapEmailMessagePartObj
} from 'types/soap/save-draft';
import { SoapSendMsgResponse } from 'types/soap/send-msg';
import { SoapMailMessage, SoapMailMessagePart } from 'types/soap/soap-mail-message';

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
	return act(() => {
		vi.advanceTimersByTime(time);
	});
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
	 * The one who matches the given content type will be returned
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

const createCheckSmimeEnabledAPIInterceptor = (): void => {
	createAPIInterceptor(
		'get',
		'/service/extension/encryption/password/enabled',
		HttpResponse.json({ enabled: true })
	);
};

const clearAndInsertText =
	(user: UserEvent, target: Element, text: string) => async (): Promise<void> => {
		await user.click(target);
		await user.clear(target);
		await user.type(target, text);
	};

const TestingEditViewUnmount = ({ editor }: { editor: MailsEditorV2 }): React.JSX.Element => {
	const [close, setClose] = useState(false);
	return (
		<div data-testid="email-input">
			{!close && <EditView {...{ editorId: editor.id, closeController: () => setClose(true) }} />}
		</div>
	);
};

const getDeleteDraftButton = (): HTMLElement =>
	within(screen.getByTestId('edit-view-footer')).getByRoleWithIcon('button', {
		icon: TESTID_SELECTORS.icons.deleteDraft
	});

const getSendButton = (): HTMLElement => screen.getByTestId(/BtnSendMail/i);

const getSaveButton = (): HTMLElement => screen.getByRole('button', { name: /save/i });

const getCcButton = (): HTMLElement => screen.getByTestId('BtnCc');

const getBccButton = (): HTMLElement => screen.getByTestId('BtnBcc');

const getToInput = (): HTMLElement =>
	within(screen.getByTestId('RecipientTo')).getByRole('textbox');

const getCcInput = (): HTMLElement =>
	within(screen.getByTestId('RecipientCc')).getByRole('textbox');

const getBccInput = (): HTMLElement =>
	within(screen.getByTestId('RecipientBcc')).getByRole('textbox');

const getSubjectInput = (): HTMLElement =>
	within(screen.getByTestId('subject')).getByRole('textbox');

const getEditorTextareaElement = (): HTMLInputElement => screen.getByTestId('MailPlainTextEditor');

const makeSomeChangeToTriggerSaveDraft = async (user: UserEvent): Promise<void> => {
	await user.type(getSubjectInput(), 'Some subject');
};

describe('Edit view', () => {
	beforeAll(() => {
		createCheckSmimeEnabledAPIInterceptor();
		createSoapAPIInterceptor('GetShareInfo', getEmptyMSWShareInfoResponse());
	});

	it('should render the footer with the draft save status', () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		setupTest(<EditView editorId={editor.id} closeController={noop} />);

		expect(screen.getByText('Draft not saved')).toBeVisible();
	});

	describe('Send button is disabled', () => {
		beforeAll(() => {
			createCheckSmimeEnabledAPIInterceptor();
			createSoapAPIInterceptor('GetShareInfo');
		});
		const invalidEmailAddress = 'invalidmailaddress.com';

		test("and says recipients are invalid when there's at least an invalid recipient", async () => {
			const editor: MailsEditorV2 = generateNewEditor({
				recipients: {
					to: [
						{
							address: invalidEmailAddress,
							isGroup: false,
							type: ParticipantRole.TO
						}
					],
					cc: [],
					bcc: []
				}
			});
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
			await user.hover(getSendButton());

			const tooltip = await screen.findByTestId('tooltip');
			expect(tooltip).toBeInTheDocument();
			expect(tooltip).toHaveTextContent(/label.invalid_recipients/);
		});

		test("when there's an invalid TO recipient", async () => {
			const editor: MailsEditorV2 = generateNewEditor({
				recipients: {
					to: [
						{
							address: invalidEmailAddress,
							isGroup: false,
							type: ParticipantRole.TO
						}
					],
					cc: [],
					bcc: []
				}
			});
			setupEditorStore({ editors: [editor] });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			// TODO: act is used to ensure entire render lifecycle is completed.
			//  it would be better to ensure lifecycle is completed by awaiting the DOM (e.g.: await a button is visible).
			//  act is a gimmick and not really required.
			expect(screen.getByTestId('edit-view-editor')).toBeVisible();
			expect(await screen.findByText('DEFAULT')).toBeVisible();
			expect(await screen.findByText(invalidEmailAddress)).toBeVisible();
			expect(await screen.findByRole('button', { name: /label\.send/i })).toBeDisabled();
		});
		test("when there's an invalid CC recipient", async () => {
			const editor: MailsEditorV2 = generateNewEditor({
				recipients: {
					to: [],
					cc: [
						{
							address: invalidEmailAddress,
							isGroup: false,
							type: ParticipantRole.CARBON_COPY
						}
					],
					bcc: []
				}
			});
			setupEditorStore({ editors: [editor] });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			expect(screen.getByTestId('edit-view-editor')).toBeVisible();
			expect(await screen.findByText('DEFAULT')).toBeVisible();
			expect(await screen.findByText(invalidEmailAddress)).toBeVisible();
			expect(await screen.findByRole('button', { name: /label\.send/i })).toBeDisabled();
		});
		test("when there's an invalid BCC recipient", async () => {
			const editor: MailsEditorV2 = generateNewEditor({
				recipients: {
					to: [],
					cc: [],
					bcc: [
						{
							address: invalidEmailAddress,
							isGroup: false,
							type: ParticipantRole.BLIND_CARBON_COPY
						}
					]
				}
			});
			setupEditorStore({ editors: [editor] });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			expect(screen.getByTestId('edit-view-editor')).toBeVisible();
			expect(await screen.findByText('DEFAULT')).toBeVisible();
			expect(await screen.findByText(invalidEmailAddress)).toBeVisible();
			expect(await screen.findByRole('button', { name: /label\.send/i })).toBeDisabled();
		});
	});

	describe('Mail creation', () => {
		beforeEach(() => {
			aSuccessfullSaveDraft();
		});

		// warning
		it('should correctly send a new email', async () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });

			// Get the default identity address
			const mocksContext = getMocksContext();
			const from = mocksContext.identities.primary.identity.email;
			const { fullName } = mocksContext.identities.primary.identity;
			const address = faker.internet.email();
			const ccAddress = faker.internet.email();
			const subject = faker.lorem.sentence(1);
			const body = faker.lorem.sentence(10);

			const props = {
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

			vi.spyOn(hooks, 'getUserSettings').mockReturnValue(settings);

			const { user } = setupTest(<EditView {...props} />);

			expect(getSendButton()).toBeVisible();

			// Click on the "To" input and insert an address
			await user.click(getToInput());
			await act(async () => {
				await user.type(getToInput(), address);
			});

			// Click on the "CC" button to show CC Recipient field
			await act(async () => {
				await user.click(getCcButton());
			});
			await act(async () => {
				await user.type(getCcInput(), ccAddress);
			});

			// Insert a subject
			await act(async () => {
				await user.type(getSubjectInput(), subject);
			});

			const optionIcon = screen.getByTestId('options-dropdown-icon');
			expect(optionIcon).toBeInTheDocument();

			await user.click(optionIcon);

			const markAsImportantOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
				/label\.mark_as_important/i
			);
			expect(markAsImportantOption).toBeVisible();

			await user.click(getEditorTextareaElement());
			user.clear(getEditorTextareaElement());

			await user.click(getEditorTextareaElement());
			await user.type(getEditorTextareaElement(), body);

			// Check for the status of the "send" button to be enabled
			await waitFor(() => expect(getSendButton()).toBeEnabled());

			/*
			 * We simulate an error during in order to avoid the closing
			 * of the edit view which seems to cause issues during tests
			 */
			const response = buildSoapErrorResponseBody();
			const sendMsgPromise = createSoapAPIInterceptor<
				{ m: SoapDraftMessageObj },
				SoapSendMsgResponse | ErrorSoapBodyResponse
			>('SendMsg', response);

			await user.click(getSendButton());

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

			expect(getSoapMailBodyContent(msg, CT_PLAIN)).toBe(body);
		});

		it('should add the logged in account id to the originId field when replying to an email from the primary account', async () => {
			setupEditorStore({ editors: [] });
			const originalMessage = generateMessage({ id: '1' });
			const editor = generateReplyMsgEditor(originalMessage);
			addEditor({ id: editor.id, editor });
			const mocksContext = getMocksContext();
			const loggedInuserAccountId = mocksContext.identities.primary.identity.id;

			const props = {
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

			vi.spyOn(hooks, 'getUserSettings').mockReturnValue(settings);

			const { user } = setupTest(<EditView {...props} />);

			// Get the components
			const btnSend = await screen.findByTestId(/BtnSendMail/i);

			expect(btnSend).toBeVisible();

			// // Check for the status of the "send" button to be enabled
			await waitFor(() => expect(btnSend).toBeEnabled());

			/*
			 * We simulate an error during in order to avoid the closing
			 * of the edit view which seems to cause issues during tests
			 */
			const response = buildSoapErrorResponseBody();
			const sendMsgInterceptor = createSoapAPIInterceptor<
				{ m: SoapDraftMessageObj },
				SoapSendMsgResponse | ErrorSoapBodyResponse
			>('SendMsg', response);

			await user.click(btnSend);

			const { m: msg } = await sendMsgInterceptor;

			expect(msg.origid).toBe(`${loggedInuserAccountId}:${originalMessage.id}`);
		});

		it('should preserve the shared account id to the originId field when replying to an email from the shared account', async () => {
			setupEditorStore({ editors: [] });
			const originalMessage = generateMessage({ id: '40f51428-9c4e-4919-bd16-3b19e39f2843:1' });
			const editor = generateReplyMsgEditor(originalMessage);
			addEditor({ id: editor.id, editor });

			const props = {
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

			vi.spyOn(hooks, 'getUserSettings').mockReturnValue(settings);

			const { user } = setupTest(<EditView {...props} />);

			// Get the components
			const btnSend = await screen.findByTestId(/BtnSendMail/i);

			expect(btnSend).toBeVisible();

			// // Check for the status of the "send" button to be enabled
			await waitFor(() => expect(btnSend).toBeEnabled());

			/*
			 * We simulate an error during in order to avoid the closing
			 * of the edit view which seems to cause issues during tests
			 */
			const response = buildSoapErrorResponseBody();
			const sendMsgInterceptor = createSoapAPIInterceptor<
				{ m: SoapDraftMessageObj },
				SoapSendMsgResponse | ErrorSoapBodyResponse
			>('SendMsg', response);

			await user.click(btnSend);

			const { m: msg } = await sendMsgInterceptor;

			expect(msg.origid).toBe(originalMessage.id);
		});

		it('create a new email and text format should be as per setting', async () => {
			setupEditorStore({ editors: [] });

			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			// Text format should be plain as per the settings done
			expect(editor.isRichText).toBe(false);
		});
	});

	describe('send email', () => {
		beforeEach(() => {
			vi.clearAllTimers();
		});
		it('should send the entire text', async () => {
			createAPIInterceptor(
				'post',
				'/service/soap/GetShareInfoRequest',
				HttpResponse.json(getEmptyMSWShareInfoResponse())
			);
			createSoapAPIInterceptor('NoOp');
			createCheckSmimeEnabledAPIInterceptor();
			setupEditorStore({ editors: [] });
			const editor = await readyToBeSentEditorTestCase({
				id: '123-testId',
				did: '123-testId',
				isRichText: false,
				savedAttachments: [],
				unsavedAttachments: []
			});
			addEditor({ id: editor.id, editor });

			const sendMsgInterceptor = createSoapAPIInterceptor<
				SaveDraftRequest,
				SaveDraftResponse | ErrorSoapBodyResponse
			>('SendMsg');
			createSoapAPIInterceptor('SaveDraft');
			const { user } = setupTest(<TestingEditViewUnmount editor={editor} />);
			const btnSend = screen.queryByTestId('BtnSendMailMulti');
			await waitFor(() => expect(btnSend).toBeEnabled());
			const text = faker.lorem.paragraph();
			const area = screen.getByTestId('MailPlainTextEditor');

			// Insert the text into the text area
			await waitFor(clearAndInsertText(user, area, text));

			await user.click(btnSend as HTMLElement);

			vi.runOnlyPendingTimers();

			const sendMsgRequest = await sendMsgInterceptor;

			expect(sendMsgRequest?.m?.mp?.[0]?.content?._content).toEqual(text);
		});

		it('shows invalid recipient message when server returns invalid recipient SOAP error', async () => {
			createAPIInterceptor(
				'post',
				'/service/soap/GetShareInfoRequest',
				HttpResponse.json(getEmptyMSWShareInfoResponse())
			);
			createCheckSmimeEnabledAPIInterceptor();

			const editor = await readyToBeSentEditorTestCase({
				id: '123-testId',
				did: '123-testId'
			});
			setupEditorStore({ editors: [editor] });
			addEditor({ id: editor.id, editor });

			createSoapAPIInterceptor(
				'SendMsg',
				buildSoapErrorResponseBody({
					code: 'soap:Sender',
					detailCode: 'mail.SEND_ABORTED_ADDRESS_FAILURE',
					reason:
						'Invalid address: abc@example.com.  com.zimbra.cs.mailbox.MailSender$SafeSendFailedException: MESSAGE_NOT_DELIVERED; chained exception is:\n\tcom.zimbra.cs.mailclient.smtp.InvalidRecipientException: RCPT failed: Invalid recipient abc@example.com: 550 5.1.1 <abc@example.com>: Recipient address rejected',
					trace: 'qtp630298110-27889:1754665448505:7f9325b88e4f881d'
				})
			);

			const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const btnSend = await screen.findByTestId('BtnSendMailMulti');
			await waitFor(() => expect(btnSend).toBeEnabled());

			await user.click(btnSend);

			vi.advanceTimersByTime(4000);

			expect(await screen.findByText('error.invalid_recipient')).toBeVisible();
		});
	});

	describe('Draft', () => {
		beforeEach(() => {
			createAPIInterceptor(
				'post',
				'/service/soap/GetShareInfoRequest',
				HttpResponse.json(getEmptyMSWShareInfoResponse())
			);
			createCheckSmimeEnabledAPIInterceptor();
		});

		describe('it saves the draft when the user', () => {
			it('clicks on the save button', async () => {
				const mocksContext = getMocksContext();

				// Get the default identity address
				const sender = mocksContext.identities.primary.identity.email;

				const subject = faker.lorem.sentence(5);
				const recipient = faker.internet.email();
				const cc = faker.internet.email();
				const body = faker.lorem.paragraph(5);

				const editor = generateNewMessageEditor();
				editor.subject = subject;
				editor.identityId = mocksContext.identities.primary.identity.id;
				editor.recipients.to = [
					{
						address: recipient,
						isGroup: false,
						type: ParticipantRole.TO
					}
				];
				editor.recipients.cc = [
					{
						address: cc,
						isGroup: false,
						type: ParticipantRole.CARBON_COPY
					}
				];
				editor.text.plainText = body;
				setupEditorStore({ editors: [editor] });

				const saveDraftInterceptor = aSuccessfullSaveDraft();

				const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);

				await user.click(getSaveButton());

				// Obtain the message from the rest handler
				const { m: msg } = await saveDraftInterceptor;

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
				const editor = generateNewMessageEditor();
				setupEditorStore({ editors: [editor] });

				const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				const subjectText =
					"This is the most interesting subject ever! It's all about unicorns brewing beers for the elves";
				await waitFor(clearAndInsertText(user, getSubjectInput(), subjectText));

				awaitDebouncedSaveDraft();

				const { m: msg } = await draftSavingInterceptor;
				expect(msg.su._content).toBe(subjectText);
			});

			it('changes the TO recipient', async () => {
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				const editor = generateNewMessageEditor();
				setupEditorStore({ editors: [editor] });
				const recipient = faker.internet.email();

				const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
				await waitFor(clearAndInsertText(user, getToInput(), recipient));
				await user.tab();
				awaitDebouncedSaveDraft();

				const { m: msg } = await draftSavingInterceptor;
				const sentRecipient = msg.e[0];
				expect(sentRecipient.a).toBe(recipient);
			});

			// FIXME
			it.skip('changes the body', async () => {
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				const body = faker.lorem.text();
				const editor = generateNewMessageEditor();
				setupEditorStore({ editors: [editor] });

				const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);

				// Insert the text into the text area
				await user.pasteInto(getEditorTextareaElement(), body);

				awaitDebouncedSaveDraft();

				const { m: msg } = await draftSavingInterceptor;
				expect(msg.mp[0]?.content?._content).toBe(body);
			});

			it('attaches a file', async () => {
				const editor = generateNewMessageEditor();
				setupEditorStore({ editors: [editor] });

				const draftSavingInterceptor = aSuccessfullSaveDraft();

				const uploadAttachmentId =
					'3b7a64ac-e3b7-4812-8614-53667b72ae09:3545334d-9f85-47b4-911e-8390a1ddf7dc';
				createAPIInterceptor(
					'post',
					'/service/upload',
					new HttpResponse(
						`200,'null',[{"aid":"${uploadAttachmentId}","ct":"application/pdf","filename":"dummy.pdf","s":95736}]\n`,
						{ status: 200 }
					)
				);

				const { user } = setupTest(<EditView editorId={editor.id} closeController={vi.fn()} />);

				const fileInput = screen.getByTestId('file-input');
				await user.upload(fileInput, new File(['test string'], 'test.txt', { type: 'text/plain' }));

				awaitDebouncedSaveDraft();

				const { m: msg } = await draftSavingInterceptor;
				expect(msg.attach?.aid).toEqual(uploadAttachmentId);

				// expect(saveDraftSpy).toHaveBeenCalledTimes(2);
			});
		});

		it('the edit view request the close if user deletes the draft', async () => {
			const closeController = vi.fn();
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(
				<EditView editorId={editor.id} closeController={closeController} />
			);
			const deleteDraftButton = getDeleteDraftButton();
			await user.click(deleteDraftButton);

			expect(closeController).toHaveBeenCalled();
		});

		it.todo(
			'the edit view shows an error if the draft saving fails because the draft does not exist anymore'
		);

		describe('send button', () => {
			describe('is disabled when draft cannot be saved', () => {
				let failingSaveDraft: Promise<SaveDraftRequest>;

				beforeEach(() => {
					failingSaveDraft = aFailingSaveDraft();
					setupEditorStore({ editors: [] });
				});

				const checkSaveBtnIsDisabled = async (editor: MailsEditorV2): Promise<void> => {
					addEditor({
						id: editor.id,
						editor
					});

					const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
					await makeSomeChangeToTriggerSaveDraft(user);

					// Await the API to be called and fail
					await failingSaveDraft;

					const btnSend =
						screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
					expect(btnSend).toBeVisible();
					expect(btnSend).toBeDisabled();
				};

				it('and action is "new editor"', async () => {
					const editor = generateNewMessageEditor();
					await checkSaveBtnIsDisabled(editor);
				});

				it('and action is "reply"', async () => {
					const message = generateMessage({
						isComplete: true
					});
					const editor = generateReplyMsgEditor(message);
					await checkSaveBtnIsDisabled(editor);
				});
			});

			it('should be disabled when draft is being saved', async () => {
				const editor = generateNewMessageEditor();
				const saveDraftInterceptor = aSuccessfullSaveDraft();
				setupEditorStore({ editors: [editor] });

				const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
				await makeSomeChangeToTriggerSaveDraft(user);
				await saveDraftInterceptor;
				await screen.findByText('Saving...');

				expect(getSendButton()).toBeDisabled();
			});

			describe('is enabled again when draft is saved', () => {
				let saveDraftInterceptor: Promise<SaveDraftRequest>;
				beforeEach(() => {
					saveDraftInterceptor = aSuccessfullSaveDraft();
					setupEditorStore({ editors: [] });
				});

				const checkSendBtnEnabled = async (editor: MailsEditorV2): Promise<void> => {
					addEditor({
						id: editor.id,
						editor: { ...editor }
					});

					const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
					await makeSomeChangeToTriggerSaveDraft(user);
					await saveDraftInterceptor;

					await screen.findByText('Draft saved at', { exact: false });
					expect(getSendButton()).toBeEnabled();
				};

				it('and action is "reply"', async () => {
					const message = generateMessage({
						isComplete: true
					});

					const editor = generateReplyMsgEditor(message);

					await checkSendBtnEnabled(editor);
				});

				it('and action is "replyAll"', async () => {
					const message = generateMessage({
						isComplete: true
					});

					const editor = generateReplyAllMsgEditor(message);

					await checkSendBtnEnabled(editor);
				});
			});

			it('is enabled when an editor is created with "edit as new" action and a draft is saved', async () => {
				const saveDraftInterceptor = aSuccessfullSaveDraft();
				const message = generateMessage({ isComplete: true });
				const editor = generateEditAsNewEditor(message);
				setupEditorStore({ editors: [editor] });

				const { user } = setupTest(<EditView editorId={editor.id} closeController={vi.fn()} />);
				await makeSomeChangeToTriggerSaveDraft(user);
				await saveDraftInterceptor;

				// Await the draft to be saved
				await screen.findByText('Draft saved at', { exact: false });

				expect(getSendButton()).toBeEnabled();
			});
		});
	});

	describe.skip('Identities selection', () => {
		test.skip('identity selector must be visible when multiple identities are present', async () => {
			// Mock the "action" query param
			vi.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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
			setupTest(<EditView {...props} />);
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

				// Mock the "action" query param
				vi.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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
				setupTest(<EditView {...props} />);
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

					// Mock the "action" query param
					vi.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
						if (param === 'action') {
							return EditViewActions.REPLY;
						}
						return undefined;
					});

					// Mock the board context
					useBoard.mockImplementation(() => ({
						url: `${MAILS_ROUTE}/edit/${msg.id}?action=${EditViewActions.REPLY}`,
						context: { editorId: msg.id, folderId: FOLDERS.INBOX },
						title: ''
					}));

					const props = {
						editorId: 'new-1',
						setHeader: noop
					};

					// Create and wait for the component to be rendered
					setupTest(<EditView {...props} />);
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

					// Mock the "action" query param
					vi.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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
					setupTest(<EditView {...props} />);
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

					populateFoldersStore();

					// Mock the "action" query param
					vi.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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
					setupTest(<EditView {...props} />);
					expect(await screen.findByTestId('edit-view-editor')).toBeInTheDocument();

					expect(screen.getByTestId('from-dropdown')).toBeInTheDocument();
					expect(screen.getByTestId('from-identity-address')).toHaveTextContent(
						sharedAccountIdentity.email
					);
				});
			});
		});
	});

	describe('Text Editor Drag Over functionality', () => {
		beforeAll(() => {
			createCheckSmimeEnabledAPIInterceptor();
			createSoapAPIInterceptor('GetShareInfo');
		});

		beforeEach(() => {
			aSuccessfullSaveDraft();
		});

		it('should enable drop zone when dragging files over text editor', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Create a mock file for the drag event
			const file = new File(['test'], 'test.txt', { type: 'text/plain' });

			// Use fireEvent.dragOver with proper dataTransfer mock
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['Files'],
						files: [file]
					}
				});
			});

			// Check if drop zone becomes visible (indicating it was enabled)
			await waitFor(() => {
				const dropZone = screen.queryByTestId('drop-zone-attachment');
				expect(dropZone).toBeInTheDocument();
			});
		});

		it('should disable drop zone when dragging contacts over text editor', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Use fireEvent.dragOver with contact type
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['contact'],
						getData: () => 'contact-data'
					}
				});
			});

			// Verify drop zone is not enabled/visible for contacts
			const dropZone = screen.queryByTestId('drop-zone-attachment');
			expect(dropZone).not.toBeInTheDocument();
		});

		it('should disable drop zone when dragging text content over text editor', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Use fireEvent.dragOver with text type (simulating text drag from editor)
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['text/plain', 'text/html'],
						getData: () => 'some text content'
					}
				});
			});

			// Verify drop zone is not enabled/visible for text content
			const dropZone = screen.queryByTestId('drop-zone-attachment');
			expect(dropZone).not.toBeInTheDocument();
		});

		it('should handle drag events without dataTransfer gracefully', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Use fireEvent.dragOver without dataTransfer
			await act(async () => {
				expect(() => {
					fireEvent.dragOver(textEditor, {
						dataTransfer: null
					});
				}).not.toThrow();
			});
		});

		it('should prevent default behavior for file types other than contacts', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Test with various file types
			const fileTypes = ['application/pdf', 'image/jpeg', 'text/html', 'application/zip'];

			// eslint-disable-next-line no-restricted-syntax
			for (const fileType of fileTypes) {
				const file = new File(['test'], `test.${fileType.split('/')[1]}`, { type: fileType });

				// Use fireEvent.dragOver for each file type
				// Note: dataTransfer.types should include 'Files' when dragging files, not MIME types
				// eslint-disable-next-line no-await-in-loop
				await act(async () => {
					fireEvent.dragOver(textEditor, {
						dataTransfer: {
							types: ['Files'],
							files: [file]
						}
					});
				});

				// Check if drop zone is enabled for file types
				// eslint-disable-next-line no-await-in-loop
				await waitFor(() => {
					const dropZone = screen.queryByTestId('drop-zone-attachment');
					expect(dropZone).toBeInTheDocument();
				});
			}
		});
	});

	describe('Attachment processing and upload via drag and drop', () => {
		const createFileWithSize = (name: string, size: number, type = 'text/plain'): File => {
			const file = new File(['content'], name, { type });
			Object.defineProperty(file, 'size', { value: size });
			return file;
		};

		beforeEach(() => {
			(hooks.useUserSettings as Mock).mockReturnValue({
				attrs: {
					zimbraMtaMaxMessageSize: '10485760' // 10MB in bytes
				}
			});

			// Mock Files integration functions for smartlink modal
			(hooks.useIntegratedFunction as Mock).mockImplementation((id: string) => {
				if (id === 'get-link') {
					return [vi.fn().mockResolvedValue({ url: 'http://example.com/link' }), true];
				}
				return [vi.fn(), false];
			});

			(hooks.getIntegratedFunction as Mock).mockImplementation(() => [vi.fn(), false]);

			createAPIInterceptor('post', '/service/upload', new HttpResponse(null, { status: 200 }));
			createCheckSmimeEnabledAPIInterceptor();
			createSoapAPIInterceptor('GetShareInfo');
			aSuccessfullSaveDraft();
		});

		it('should add small files directly without showing smartlink modal when dropped', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Create small files (100KB each)
			const smallFile1 = createFileWithSize('small1.txt', 100000);
			const smallFile2 = createFileWithSize('small2.pdf', 100000, 'application/pdf');

			// Simulate drag over to enable drop zone
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['Files'],
						files: [smallFile1, smallFile2]
					}
				});
			});

			// Drop zone should appear
			const dropZone = await screen.findByTestId('drop-zone-attachment');
			expect(dropZone).toBeInTheDocument();

			// Simulate drop event on the drop zone
			await act(async () => {
				fireEvent.drop(dropZone, {
					dataTransfer: {
						files: [smallFile1, smallFile2]
					}
				});
			});

			// Modal should NOT appear for small files
			const modal = screen.queryByTestId('convert-to-smartlink-modal');
			expect(modal).not.toBeInTheDocument();

			// Files should be added to editor
			await waitFor(() => {
				const updatedEditor = useEditorsStore.getState().editors[editor.id];
				expect(updatedEditor?.unsavedAttachments.length).toBeGreaterThan(0);
			});
		});

		it('should show smartlink modal for large single file when dropped', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Create a large file (20MB)
			const largeFile = createFileWithSize('large-video.mp4', 20000000, 'video/mp4');

			// Simulate drag over
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['Files'],
						files: [largeFile]
					}
				});
			});

			// Drop zone should appear
			const dropZone = await screen.findByTestId('drop-zone-attachment');

			// Simulate drop event on the drop zone
			await act(async () => {
				fireEvent.drop(dropZone, {
					dataTransfer: {
						files: [largeFile]
					}
				});
			});

			// Modal should appear
			await screen.findByTestId('convert-to-smartlink-modal');
		});

		it('should show smartlink modal when combined file size exceeds limit after drop', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Create multiple files that together exceed the limit
			// 3MB each * 3 files = 9MB, with BASE64 conversion (1.33x) = ~12MB > 10MB
			const file1 = createFileWithSize('doc1.pdf', 3000000, 'application/pdf');
			const file2 = createFileWithSize('doc2.pdf', 3000000, 'application/pdf');
			const file3 = createFileWithSize('doc3.pdf', 3000000, 'application/pdf');

			// Simulate drag over
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['Files'],
						files: [file1, file2, file3]
					}
				});
			});

			// Drop zone should appear
			const dropZone = await screen.findByTestId('drop-zone-attachment');

			// Simulate drop event on the drop zone
			await act(async () => {
				fireEvent.drop(dropZone, {
					dataTransfer: {
						files: [file1, file2, file3]
					}
				});
			});

			// Modal should appear
			await screen.findByTestId('convert-to-smartlink-modal');
		});

		it('should handle different file types correctly when dropped', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Create files of various types, all small
			const textFile = createFileWithSize('document.txt', 50000, 'text/plain');
			const pdfFile = createFileWithSize('report.pdf', 50000, 'application/pdf');
			const imageFile = createFileWithSize('photo.jpg', 50000, 'image/jpeg');
			const excelFile = createFileWithSize(
				'data.xlsx',
				50000,
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);

			// Simulate drag over
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['Files'],
						files: [textFile, pdfFile, imageFile, excelFile]
					}
				});
			});

			// Drop zone should appear
			const dropZone = await screen.findByTestId('drop-zone-attachment');

			// Simulate drop event on the drop zone
			await act(async () => {
				fireEvent.drop(dropZone, {
					dataTransfer: {
						files: [textFile, pdfFile, imageFile, excelFile]
					}
				});
			});

			// No modal should appear for small files
			const modal = screen.queryByTestId('convert-to-smartlink-modal');
			expect(modal).not.toBeInTheDocument();
		});

		it('should respect BASE_64_CONVERSION_RATE in size calculation when dropped', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Create a file that's just under the limit without conversion
			// but exceeds it with BASE64 conversion (1.33x)
			// 8MB * 1.33 = 10.64MB > 10MB limit
			const file = createFileWithSize('borderline.zip', 8000000, 'application/zip');

			// Simulate drag over
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['Files'],
						files: [file]
					}
				});
			});

			// Drop zone should appear
			const dropZone = await screen.findByTestId('drop-zone-attachment');

			// Simulate drop event on the drop zone
			await act(async () => {
				fireEvent.drop(dropZone, {
					dataTransfer: {
						files: [file]
					}
				});
			});

			// Modal should appear because of BASE64 conversion
			await screen.findByTestId('convert-to-smartlink-modal');
		});

		it('should handle empty file drop gracefully', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Create a dummy file to trigger drop zone
			const dummyFile = createFileWithSize('dummy.txt', 100);

			// Simulate drag over to enable drop zone
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['Files'],
						files: [dummyFile]
					}
				});
			});

			// Drop zone should appear
			const dropZone = await screen.findByTestId('drop-zone-attachment');

			// Simulate drop event with no files (empty FileList)
			await act(async () => {
				expect(() => {
					fireEvent.drop(dropZone, {
						dataTransfer: {
							files: []
						}
					});
				}).not.toThrow();
			});

			// No modal should appear
			const modal = screen.queryByTestId('convert-to-smartlink-modal');
			expect(modal).not.toBeInTheDocument();
		});

		it('should not show modal when combined size is just under the limit', async () => {
			const baseEditor = generateNewMessageEditor();
			const editor: MailsEditorV2 = {
				...baseEditor,
				size: 0
			};

			setupEditorStore({ editors: [editor] });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const textEditor = await screen.findByTestId('MailPlainTextEditor');
			expect(textEditor).toBeVisible();

			// Create files that stay just under limit with BASE64 conversion
			// 7.5MB * 1.33 = 9.975MB < 10MB
			const file = createFileWithSize('just-under.pdf', 7500000, 'application/pdf');

			// Simulate drag over
			await act(async () => {
				fireEvent.dragOver(textEditor, {
					dataTransfer: {
						types: ['Files'],
						files: [file]
					}
				});
			});

			// Drop zone should appear
			const dropZone = await screen.findByTestId('drop-zone-attachment');

			// Simulate drop event on the drop zone
			await act(async () => {
				fireEvent.drop(dropZone, {
					dataTransfer: {
						files: [file]
					}
				});
			});

			// Modal should NOT appear
			const modal = screen.queryByTestId('convert-to-smartlink-modal');
			expect(modal).not.toBeInTheDocument();

			// Files should be added to editor
			await waitFor(() => {
				const updatedEditor = useEditorsStore.getState().editors[editor.id];
				expect(updatedEditor?.unsavedAttachments.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Container layout', () => {
		beforeAll(() => {
			createCheckSmimeEnabledAPIInterceptor();
			createSoapAPIInterceptor('GetShareInfo');
		});

		test('main container should render without height constraints to allow dynamic growth', async () => {
			const editor: MailsEditorV2 = generateNewEditor();
			setupEditorStore({ editors: [editor] });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const mainContainer = screen.getByTestId('edit-view-editor');

			const computedStyle = getComputedStyle(mainContainer);
			expect(computedStyle.height).toBe('100%');
		});
	});

	describe('Identity selector dropdown', () => {
		beforeAll(() => {
			createCheckSmimeEnabledAPIInterceptor();
			createSoapAPIInterceptor('GetShareInfo');
		});

		test('should show ChevronDownOutline icon when dropdown is closed', async () => {
			const editor: MailsEditorV2 = generateNewEditor();
			setupEditorStore({ editors: [editor] });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const identitySelector = await screen.findByTestId('from-dropdown');
			expect(identitySelector).toBeInTheDocument();

			const chevronDownIcon = within(identitySelector).getByTestId(
				TESTID_SELECTORS.icons.chevronDown
			);
			expect(chevronDownIcon).toBeInTheDocument();
		});

		test('should show ChevronUpOutline icon when dropdown is opened', async () => {
			const editor: MailsEditorV2 = generateNewEditor();
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const identitySelector = await screen.findByTestId('from-dropdown');
			expect(identitySelector).toBeInTheDocument();

			const identityToggle = within(identitySelector).getByTestId('identity-selector-toggle');
			await user.click(identityToggle);

			await waitFor(() => {
				const chevronUpIcon = within(identitySelector).getByTestId(
					TESTID_SELECTORS.icons.chevronUp
				);
				expect(chevronUpIcon).toBeInTheDocument();
			});
		});

		test('should toggle between ChevronUp and ChevronDown icons when opening and closing dropdown', async () => {
			const editor: MailsEditorV2 = generateNewEditor();
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const identitySelector = await screen.findByTestId('from-dropdown');
			expect(identitySelector).toBeInTheDocument();

			// Initial state - closed (ChevronDown)
			expect(
				within(identitySelector).getByTestId(TESTID_SELECTORS.icons.chevronDown)
			).toBeInTheDocument();

			const identityToggle = within(identitySelector).getByTestId('identity-selector-toggle');

			await user.click(identityToggle);

			// Open state (ChevronUp)
			await waitFor(() => {
				expect(
					within(identitySelector).getByTestId(TESTID_SELECTORS.icons.chevronUp)
				).toBeInTheDocument();
			});

			await user.click(identityToggle);

			// Closed state again (ChevronDown)
			await waitFor(() => {
				expect(
					within(identitySelector).getByTestId(TESTID_SELECTORS.icons.chevronDown)
				).toBeInTheDocument();
			});
		});
	});
});
