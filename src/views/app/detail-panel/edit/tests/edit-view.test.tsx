/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useState } from 'react';

import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';
import { find, noop } from 'lodash';
import { HttpResponse } from 'msw';

import { aSuccessfullSaveDraft, aFailingSaveDraft } from './utils/utils';
import { EditViewActions, MAILS_ROUTE } from '../../../../../constants';
import { getDefaultIdentity } from '../../../../../helpers/identities';
import * as useQueryParam from '../../../../../hooks/use-query-param';
import { addEditor } from '../../../../../store/editor';
import type {
	CreateSmartLinksRequest,
	MailsEditorV2,
	SaveDraftRequest,
	SaveDraftResponse,
	SoapDraftMessageObj,
	SoapEmailMessagePartObj,
	SoapMailMessage,
	SoapMailMessagePart
} from '../../../../../types';
import { SoapSendMsgResponse } from '../../../../../types/soap/send-msg';
import { makeAllItemsVisible } from '../../../../settings/filters/tests/test-utils';
import { EditView, EditViewProp } from '../edit-view';
import { setupTest } from '@test-setup';
import { createFakeIdentity } from '@test-utils/accounts/fakeAccounts';
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
import { GetSignaturesRequest, GetSignaturesResponse } from 'api/get-signatures-soap-api';
import * as saveDraftAction from 'api/save-draft-soap-api';
import {
	generateEditAsNewEditor,
	generateNewMessageEditor,
	generateReplyAllMsgEditor,
	generateReplyMsgEditor
} from 'store/editor/editor-generators';
import { setupEditorStore } from 'tests/generators/editor-store';
import { readyToBeSentEditorTestCase } from 'tests/generators/editors';
import { generateMessage } from 'tests/generators/generateMessage';

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

jest.mock('../../../../../store/editor', () => ({
	...jest.requireActual('../../../../../store/editor'),
	deleteEditor: jest.fn()
}));

function generateNewEditor(customData: Partial<MailsEditorV2> = {}): MailsEditorV2 {
	return {
		recipients: { to: [], cc: [], bcc: [] },
		id: '',
		isRichText: false,
		isUrgent: false,
		sendAllowedStatus: {
			allowed: true
		},
		requestReadReceipt: false,
		savedAttachments: [],
		size: 0,
		subject: '',
		text: {
			plainText: 'Hello',
			richText: '<p>Hello</p>'
		},
		unsavedAttachments: [],
		action: EditViewActions.NEW,
		identityId: getDefaultIdentity().id,
		did: '123',
		...customData
	};
}

describe('Edit view', () => {
	describe('Send button is disabled', () => {
		beforeAll(() => {
			createCheckSmimeEnabledAPIInterceptor();
			createSoapAPIInterceptor('GetShareInfo');
		});
		const invalidEmailAddress = 'invalidmailaddress.com';

		test('and says recipients are invalid when there`s at least an invalid recipient', async () => {
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

			await user.hover(
				screen.getByRole('button', {
					name: /label\.send/i
				})
			);

			makeAllItemsVisible();
			const tooltip = await screen.findByTestId('tooltip');
			expect(tooltip).toBeInTheDocument();
			expect(tooltip).toHaveTextContent(/label.invalid_recipients/);
		});
		test('when there`s an invalid TO recipient', async () => {
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
		test('when there`s an invalid CC recipient', async () => {
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
		test('when there`s an invalid BCC recipient', async () => {
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

		beforeAll(() => {
			createCheckSmimeEnabledAPIInterceptor();
			createSoapAPIInterceptor('GetShareInfo');
		});

		// warning
		it('should correctly send a new email', async () => {
			setupEditorStore({ editors: [] });
			const editor = generateNewMessageEditor();
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

			const { user } = setupTest(<EditView {...props} />);

			// Get the components
			const btnSend = await screen.findByTestId(/BtnSendMail/i);
			const btnCc = screen.getByTestId('BtnCc');
			const toComponent = screen.getByTestId('RecipientTo');
			const toInputElement = within(toComponent).getByRole('textbox');
			const subjectComponent = screen.getByTestId('subject');
			const subjectInputElement = within(subjectComponent).getByRole('textbox');
			const editorTextareaElement = screen.getByTestId('MailPlainTextEditor') as HTMLInputElement;

			expect(btnSend).toBeVisible();

			await user.click(toInputElement);
			await user.clear(toInputElement);
			await user.type(toInputElement, address);

			await user.tab();
			await user.click(btnCc);

			// Click on the "CC" button to show CC Recipient field
			const ccComponent = screen.getByTestId('RecipientCc');
			const ccInputElement = within(ccComponent).getByRole('textbox');

			await user.click(ccInputElement);
			await user.clear(ccInputElement);
			await user.type(ccInputElement, ccAddress);

			// Insert a subject
			await user.click(subjectInputElement);
			await user.clear(subjectInputElement);
			await user.type(subjectInputElement, subject);

			const optionIcon = screen.getByTestId('options-dropdown-icon');
			expect(optionIcon).toBeInTheDocument();

			await user.click(optionIcon);

			const markAsImportantOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
				/label\.mark_as_important/i
			);
			expect(markAsImportantOption).toBeVisible();

			await act(async () => {
				await awaitDebouncedSaveDraft();
			});

			await user.click(editorTextareaElement);
			await user.clear(editorTextareaElement);
			await user.type(editorTextareaElement, body);

			await act(async () => {
				await awaitDebouncedSaveDraft();
			});

			// // Check for the status of the "send" button to be enabled
			expect(btnSend).toBeEnabled();

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

			await user.click(btnSend);

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

			const { user } = setupTest(<EditView {...props} />);

			// Get the components
			const btnSend = await screen.findByTestId(/BtnSendMail/i);

			expect(btnSend).toBeVisible();

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
			const sendMsgInterceptor = createSoapAPIInterceptor<
				{ m: SoapDraftMessageObj },
				SoapSendMsgResponse
			>('SendMsg', response);

			await act(async () => {
				await user.click(btnSend);
			});

			const { m: msg } = await sendMsgInterceptor;

			expect(msg.origid).toBe(`${loggedInuserAccountId}:${originalMessage.id}`);
		});

		it('should preserve the shared account id to the originId field when replying to an email from the shared account', async () => {
			setupEditorStore({ editors: [] });
			const originalMessage = generateMessage({ id: '40f51428-9c4e-4919-bd16-3b19e39f2843:1' });
			const editor = generateReplyMsgEditor(originalMessage);
			addEditor({ id: editor.id, editor });

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

			const { user } = setupTest(<EditView {...props} />);

			// Get the components
			const btnSend = await screen.findByTestId(/BtnSendMail/i);

			expect(btnSend).toBeVisible();

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
			const sendMsgInterceptor = createSoapAPIInterceptor<
				{ m: SoapDraftMessageObj },
				SoapSendMsgResponse
			>('SendMsg', response);

			await act(async () => {
				await user.click(btnSend);
			});

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
					reason: '550 5.1.1 <abc@example.com>: Recipient address rejected',
					code: 'mail.SEND_ABORTED_ADDRESS_FAILURE'
				})
			);

			const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);

			const btnSend = await screen.findByTestId('BtnSendMailMulti');
			await waitFor(() => expect(btnSend).toBeEnabled());

			await act(async () => {
				await user.click(btnSend);
			});

			await act(async () => {
				jest.runOnlyPendingTimers();
			});

			await waitFor(
				() => {
					expect(
						screen.getByText((content) => content.includes('invalid_recipient'))
					).toBeInTheDocument();
				},
				{ timeout: 2000 }
			);
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

			await act(async () => {
				await user.click(btnSend as HTMLElement);
			});

			await act(async () => {
				jest.runOnlyPendingTimers();
			});

			const sendMsgRequest = await sendMsgInterceptor;

			expect(sendMsgRequest?.m?.mp?.[0]?.content?._content).toEqual(text);
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
		it('is not autosaved on initialization if draft id is present', async () => {
			const mockedSaveDraft = jest.spyOn(saveDraftAction, 'saveDraftSoapApi');

			aSuccessfullSaveDraft();
			setupEditorStore({ editors: [] });

			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor: { ...editor, did: '123' } });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);
			await act(async () => {
				jest.advanceTimersByTime(5_000);
			});
			expect(mockedSaveDraft).not.toHaveBeenCalled();
		});

		it('is autosaved on initialization if draft id is not present', async () => {
			const interceptor = aSuccessfullSaveDraft();
			setupEditorStore({ editors: [] });

			const editor = generateNewMessageEditor();
			addEditor({ id: editor.id, editor });

			setupTest(<EditView editorId={editor.id} closeController={noop} />);
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

				const editor = generateNewMessageEditor();
				addEditor({ id: editor.id, editor });

				const props = {
					editorId: editor.id,
					closeController: noop
				};

				const firstSaveDraftInterceptor = aSuccessfullSaveDraft();
				const { user } = setupTest(<EditView {...props} />);

				await firstSaveDraftInterceptor;
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
				const editorTextareaElement = screen.getByTestId('MailPlainTextEditor');

				await act(() => user.click(toInputElement));
				await act(() => user.clear(toInputElement));
				await act(() => user.type(toInputElement, recipient));

				await act(async () => {
					await user.click(btnCc);
				});

				const ccComponent = screen.getByTestId('RecipientCc');
				const ccInputElement = within(ccComponent).getByRole('textbox');

				await act(() => user.click(ccInputElement));
				await act(() => user.clear(ccInputElement));
				await act(() => user.type(ccInputElement, cc));

				await act(() => user.click(subjectInputElement));
				await act(() => user.clear(subjectInputElement));
				await act(() => user.type(subjectInputElement, subject));

				await act(async () => {
					await awaitDebouncedSaveDraft();
				});

				await act(async () => {
					await user.click(editorTextareaElement);
					await user.clear(editorTextareaElement);
					await user.type(editorTextareaElement, body);
				});

				const draftSavingInterceptor = aSuccessfullSaveDraft();

				await act(async () => {
					await awaitDebouncedSaveDraft();
				});

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

				const editor = generateNewMessageEditor();
				addEditor({ id: editor.id, editor });
				const props = {
					editorId: editor.id,
					closeController: noop
				};
				const firstSaveDraftInterceptor = aSuccessfullSaveDraft();
				const { user } = setupTest(<EditView {...props} />);
				await firstSaveDraftInterceptor;
				const draftSavingInterceptor = aSuccessfullSaveDraft();
				const subjectText =
					"This is the most interesting subject ever! It's all about unicorns brewing beers for the elves";
				const subjectInputElement = within(screen.getByTestId('subject')).getByRole('textbox');
				await waitFor(clearAndInsertText(user, subjectInputElement, subjectText));

				await act(async () => {
					await awaitDebouncedSaveDraft();
				});

				const { m: msg } = await draftSavingInterceptor;
				expect(msg.su._content).toBe(subjectText);
			});

			it('changes the recipient (to)', async () => {
				setupEditorStore({ editors: [] });

				const editor = generateNewMessageEditor();
				addEditor({ id: editor.id, editor });
				const props = {
					editorId: editor.id,
					closeController: noop
				};
				const firstSaveDraftInterceptor = aSuccessfullSaveDraft();
				const { user } = setupTest(<EditView {...props} />);
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

				const editor = generateNewMessageEditor();
				addEditor({ id: editor.id, editor });
				const props = {
					editorId: editor.id,
					closeController: noop
				};
				const firstSaveDraftInterceptor = aSuccessfullSaveDraft();
				const { user } = setupTest(<EditView {...props} />);
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

				const editor = generateNewMessageEditor();
				addEditor({ id: editor.id, editor });
				const props = {
					editorId: editor.id,
					closeController: noop
				};
				const saveDraftSpy = jest.spyOn(saveDraftAction, 'saveDraftSoapApi');
				const firstSaveDraft = aSuccessfullSaveDraft();

				const { user } = setupTest(<EditView {...props} />);
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

			describe('is enabled when draft is saved', () => {
				beforeEach(() => {
					aSuccessfullSaveDraft();
					setupEditorStore({ editors: [] });
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
				aSuccessfullSaveDraft();
				setupEditorStore({ editors: [] });

				const message = generateMessage({ isComplete: true });
				const editor = generateEditAsNewEditor(message);

				addEditor({
					id: editor.id,
					editor
				});

				const props: EditViewProp = {
					editorId: editor.id,
					closeController: noop
				};

				setupTest(<EditView {...props} />);
				expect(await screen.findByText('message.email_saved_at')).toBeVisible();
				const btnSend =
					screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
				expect(btnSend).toBeVisible();
				expect(btnSend).toBeEnabled();
			});
		});
	});

	describe.skip('Identities selection', () => {
		test.skip('identity selector must be visible when multiple identities are present', async () => {
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
					jest.spyOn(useQueryParam, 'useQueryParam').mockImplementation((param) => {
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
});
