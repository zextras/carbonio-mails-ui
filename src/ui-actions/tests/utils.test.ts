/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { parseTextToHTMLDocument } from '../../helpers/text';
import { useEditorsStore } from '../../store/zustand/editor/store';
import { setupEditorStore } from '../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../tests/generators/editors';
import { generateStore } from '../../tests/generators/store';
import { CreateSmartLinksRequest, CreateSmartLinksResponse, MessageAction } from '../../types';
import {
	addSmartLinksToText,
	updateEditorWithSmartLinks,
	findMessageActionById,
	generateSmartLinkHtml
} from '../utils';

describe('findMessageActionById', () => {
	test('returns undefined if an empty actions array is passed', () => {
		expect(findMessageActionById([], '42')).toBeUndefined();
	});

	test('returns undefined if no action has the given name', () => {
		const actions: Array<MessageAction> = [
			{
				id: 'dummy-action-1',
				icon: 'gear',
				label: 'dummy action 1',
				onClick: jest.fn()
			},
			{
				id: 'dummy-action-2',
				icon: 'gear',
				label: 'dummy action 2',
				onClick: jest.fn()
			}
		];
		expect(findMessageActionById(actions, '42')).toBeUndefined();
	});

	test('returns the action that has the given name', () => {
		const action1 = {
			id: 'dummy-action-1',
			icon: 'gear',
			label: 'dummy action 1',
			onClick: jest.fn()
		};

		const action2 = {
			id: 'dummy-action-2',
			icon: 'gear',
			label: 'dummy action 2',
			onClick: jest.fn()
		};

		const action3 = {
			id: 'dummy-action-3',
			icon: 'gear',
			label: 'dummy action 3',
			onClick: jest.fn()
		};

		const actions: Array<MessageAction> = [action1, action2, action3];
		expect(findMessageActionById(actions, 'dummy-action-2')).toBe(action2);
	});

	test('returns the first action if multiple actions have the same given name', () => {
		const action1 = {
			id: 'dummy-action-1',
			icon: 'gear',
			label: 'dummy action 1',
			onClick: jest.fn()
		};

		const action2 = {
			id: 'dummy-action-2',
			icon: 'gear',
			label: 'dummy action 2',
			onClick: jest.fn()
		};

		const action3 = {
			id: 'dummy-action-3',
			icon: 'gear',
			label: 'dummy action 3',
			onClick: jest.fn()
		};

		const action4 = {
			id: 'dummy-action-2',
			icon: 'gear',
			label: 'dummy action 2',
			onClick: jest.fn()
		};

		const action5 = {
			id: 'dummy-action-4',
			icon: 'gear',
			label: 'dummy action 4',
			onClick: jest.fn()
		};

		const actions: Array<MessageAction> = [action1, action2, action3, action4, action5];
		expect(findMessageActionById(actions, 'dummy-action-2')).toBe(action2);
		expect(findMessageActionById(actions, 'dummy-action-4')).not.toBe(action2);
	});
});

describe('generateSmartLinkHtml', () => {
	it('generates correct HTML for smart link with attachment filename', async () => {
		const editor = await generateEditorV2Case(1, generateStore().dispatch);
		setupEditorStore({ editors: [editor] });

		const smartLink = { publicUrl: 'https://example.com/file' };
		const index = 0;
		const result = generateSmartLinkHtml({
			smartLink,
			filename: editor.savedAttachments[index].filename
		});
		const htmlDoc = parseTextToHTMLDocument(result);
		const expectedFileName = editor.savedAttachments[index].filename;
		const linkElement = htmlDoc.getElementsByTagName('a')[0];
		const hrefValue = linkElement.getAttribute('href');
		expect(hrefValue).toBe(smartLink.publicUrl);
		expect(linkElement.text).toBe(expectedFileName);
	});

	it('falls back to publicUrl when filename is undefined', async () => {
		const editor = await generateEditorV2Case(1, generateStore().dispatch);

		const smartLink = { publicUrl: 'https://example.com/file' };
		const index = 0;
		const attachmentsWithoutFileName = [{ ...editor.savedAttachments[index], filename: undefined }];
		const result = generateSmartLinkHtml({
			smartLink,
			// disable typescript to check the fallback
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			filename: attachmentsWithoutFileName[index].filename
		});

		const htmlDoc = parseTextToHTMLDocument(result);
		const linkElement = htmlDoc.getElementsByTagName('a')[0];
		expect(linkElement.text).toBe(smartLink.publicUrl);
	});
});

test('addSmartLinksToText add smartlinks to both plain and rich text correctly', async () => {
	const editor = await generateEditorV2Case(1, generateStore().dispatch);
	const createSmartLinkResponse = {
		smartLinks: [
			{ publicUrl: 'https://example.com/file1' },
			{ publicUrl: 'https://example.com/file2' }
		]
	};
	const result = addSmartLinksToText({
		response: createSmartLinkResponse,
		text: editor.text,
		attachments: editor.savedAttachments
	});
	const plainTextResponse = editor.text.plainText.concat(
		createSmartLinkResponse.smartLinks.map((smartLink) => smartLink.publicUrl).join('\n')
	);

	const expectedUrl1 = `href='${createSmartLinkResponse.smartLinks[0].publicUrl}' download>${editor.savedAttachments[0].filename}`;
	const expectedUrl2 = `href='${createSmartLinkResponse.smartLinks[0].publicUrl}' download>${editor.savedAttachments[0].filename}`;

	expect(result.plainText).toContain(plainTextResponse);
	expect(result.richText).toContain(expectedUrl1);
	expect(result.richText).toContain(expectedUrl2);
});

// createSmartLink

describe('createSmartLink', () => {
	it('request should contain the correct array of smart link attachments', async () => {
		const editor = await generateEditorV2Case(1, generateStore().dispatch);
		const attachmentToConvert = editor.savedAttachments[0];
		attachmentToConvert.requiresSmartLinkConversion = true;
		setupEditorStore({ editors: [editor] });

		const interceptor = createAPIInterceptor<CreateSmartLinksRequest, CreateSmartLinksResponse>(
			'CreateSmartLinks',
			undefined,
			{
				smartLinks: [{ publicUrl: 'https://example.com/file1' }]
			}
		);
		updateEditorWithSmartLinks({
			createSnackbar: jest.fn(),
			t: jest.fn(),
			editorId: editor.id
		});
		const request = await interceptor;
		const smartLink = {
			draftId: attachmentToConvert.messageId,
			partName: attachmentToConvert.partName
		};
		expect(request.attachments[0]).toMatchObject(smartLink);
		expect(request.attachments).toHaveLength(1);
	});

	it('should remove the attachment that has been converted to smartLink', async () => {
		const editor = await generateEditorV2Case(1, generateStore().dispatch);
		const oldSavedAttachments = editor.savedAttachments;
		const oldSavedAttachmentsLength = oldSavedAttachments.length;
		const attachmentToConvert = oldSavedAttachments[0];
		attachmentToConvert.requiresSmartLinkConversion = true;
		setupEditorStore({ editors: [editor] });

		const interceptor = createAPIInterceptor<CreateSmartLinksRequest, CreateSmartLinksResponse>(
			'CreateSmartLinks',
			undefined,
			{
				smartLinks: [{ publicUrl: 'https://example.com/file1' }]
			}
		);
		await updateEditorWithSmartLinks({
			createSnackbar: jest.fn(),
			t: jest.fn(),
			editorId: editor.id
		});
		await interceptor;

		const savedStandardAttachments = useEditorsStore.getState().editors[editor.id].savedAttachments;
		expect(savedStandardAttachments).toHaveLength(oldSavedAttachmentsLength - 1);
	});

	it.skip('TODO: error scenario', async () => {
		const editor = await generateEditorV2Case(1, generateStore().dispatch);
		const oldSavedAttachments = editor.savedAttachments;
		const oldSavedAttachmentsLength = oldSavedAttachments.length;
		const attachmentToConvert = oldSavedAttachments[0];
		attachmentToConvert.requiresSmartLinkConversion = true;
		setupEditorStore({ editors: [editor] });

		const interceptor = createAPIInterceptor<CreateSmartLinksRequest, ErrorSoapBodyResponse>(
			'CreateSmartLinks',
			undefined,
			{
				Fault: {
					Reason: { Text: 'Failed upload to Files' },
					Detail: {
						Error: { Code: '123', Detail: 'Failed due to connection timeout' }
					}
				}
			}
		);

		// TODO check the promise rejection and the sneakbar is opened with the correct message
		await updateEditorWithSmartLinks({
			createSnackbar: jest.fn(),
			t: jest.fn(),
			editorId: editor.id
		});
		await interceptor;

		const savedStandardAttachments = useEditorsStore.getState().editors[editor.id].savedAttachments;
		expect(savedStandardAttachments).toHaveLength(oldSavedAttachmentsLength - 1);
	});
});
