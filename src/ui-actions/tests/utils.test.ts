/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setupEditorStore } from '../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../tests/generators/editors';
import { generateStore } from '../../tests/generators/store';
import { MessageAction } from '../../types';
import { findMessageActionById, generateSmartLinkHtml } from '../utils';

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
			attachments: editor.savedAttachments,
			index
		});
		const expectedFileName = editor.savedAttachments[index].filename;
		const expectedUrl = `href='${smartLink.publicUrl}'`;
		expect(result).toContain(expectedUrl);
		expect(result).toContain(expectedFileName);
	});

	it('falls back to publicUrl when filename is undefined', async () => {
		const editor = await generateEditorV2Case(1, generateStore().dispatch);
		setupEditorStore({ editors: [editor] });

		const smartLink = { publicUrl: 'https://example.com/file' };
		const index = 0;
		const attachmentsWithoutFileName = [{ ...editor.savedAttachments[index], filename: undefined }];
		const result = generateSmartLinkHtml({
			smartLink,
			// disable typescript to check the fallback
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			attachments: attachmentsWithoutFileName,
			index
		});
		const expectedUrl = `href='${smartLink.publicUrl}'`;
		const expectedFileName = `download>${smartLink.publicUrl}</a>`;
		expect(result).toContain(expectedUrl);
		expect(result).toContain(expectedFileName);
	});
});
