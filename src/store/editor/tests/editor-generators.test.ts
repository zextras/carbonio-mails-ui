/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import { EditViewActions } from 'constants/index';
import { generateEditor } from 'store/editor/editor-generators';
import { getEditor } from 'store/editor/hooks/editors';
import { generateMessage } from 'tests/generators/generateMessage';
import { EditViewActionsType, MailMessage } from 'types/index.d';

jest.mock('store/editor/hooks/editors', () => ({
	...jest.requireActual('store/editor/hooks/editors'),
	getEditor: jest.fn()
}));

jest.mock('uuid', () => ({
	v4: jest.fn(() => 'test-editor-id')
}));

jest.mock('@zextras/carbonio-shell-ui', () => ({
	getUserSettings: jest.fn(() => ({
		prefs: { zimbraPrefComposeFormat: 'html' }
	})),
	t: jest.fn((_key: string, fallback: string) => fallback)
}));

jest.mock('../../../helpers/identities', () => ({
	getIdentityFromParticipant: jest.fn(() => ({ id: 'test-identity-id' })),
	getDefaultIdentity: jest.fn(() => ({ id: 'default-identity-id' })),
	getRecipientReplyIdentity: jest.fn(() => ({ id: 'recipient-reply-id' })),
	getAddressOwnerAccount: jest.fn(() => ({ id: 'address-owner-id' }))
}));

describe('generateEditor', () => {
	const message = {
		...generateMessage(),
		originalId: 'test-orig-id',
		replyType: 'r'
	} as MailMessage;

	describe('Basic functionality', () => {
		it('should return null for unsupported actions', () => {
			const result = generateEditor({
				action: 'UNSUPPORTED_ACTION' as EditViewActionsType,
				id: 'test-id',
				message
			});
			expect(result).toBeNull();
		});
	});

	describe('EDIT_AS_DRAFT action', () => {
		const result = generateEditor({
			action: EditViewActions.EDIT_AS_DRAFT,
			id: 'test-id',
			message
		});

		it('should throw an error if id is missing', () => {
			expect(() =>
				generateEditor({
					action: EditViewActions.EDIT_AS_DRAFT,
					id: undefined,
					message
				})
			).toThrow('Cannot generate a draft editor without a message id');
		});

		it('should return null if no message is provided', () => {
			const editorWithNullMessage = generateEditor({
				action: EditViewActions.EDIT_AS_DRAFT,
				id: 'test-id',
				message: null
			});
			expect(editorWithNullMessage).toBeNull();
		});

		test('should generate editor with correct properties', () => {
			expect(result).toBeTruthy();
			expect(result?.id).toBe('test-editor-id');
			expect(result?.identityId).toBe('test-identity-id');
			expect(result?.isRichText).toBe(true);
		});

		test('should include message content', () => {
			expect(result?.text.plainText).toContain(message.fragment);
			expect(result?.text.richText).toContain(message.fragment);
		});

		test('should set correct recipients', () => {
			expect(result?.recipients.to).toEqual([find(message.participants, { type: 't' })]);
			expect(result?.recipients.cc).toEqual([find(message.participants, { type: 'cc' })]);
			expect(result?.recipients.bcc).toEqual([]);
		});

		test('should use message.originalId', () => {
			expect(result?.originalId).toEqual('test-orig-id');
		});
	});

	describe('EDIT_AS_NEW action', () => {
		const editor = generateEditor({
			action: EditViewActions.EDIT_AS_NEW,
			id: 'test-id',
			message
		});

		it('should throw an error if id is missing', () => {
			expect(() =>
				generateEditor({
					action: EditViewActions.EDIT_AS_NEW,
					id: undefined,
					message
				})
			).toThrow('Cannot generate an edit as new editor without a message id');
		});

		test('should generate editor with correct properties', () => {
			expect(editor).toBeTruthy();
			expect(editor?.id).toBe('test-editor-id');
			expect(editor?.identityId).toBe('test-identity-id');
			expect(editor?.isRichText).toBe(true);
		});

		test('should include message content', () => {
			expect(editor?.text.plainText).toContain(message.fragment);
			expect(editor?.text.richText).toContain(message.fragment);
		});

		test('should set correct recipients', () => {
			expect(editor?.recipients.to).toEqual([find(message.participants, { type: 't' })]);
			expect(editor?.recipients.cc).toEqual([find(message.participants, { type: 'cc' })]);
			expect(editor?.recipients.bcc).toEqual([]);
		});

		test('should not have originalId', () => {
			expect(editor?.originalId).toBeUndefined();
		});
	});

	describe('Urgent flag handling', () => {
		const urgentMessage = { ...message, urgent: true };

		describe.each`
			action                                   | expected
			${EditViewActions.REPLY}                 | ${false}
			${EditViewActions.NEW}                   | ${false}
			${EditViewActions.REPLY_ALL}             | ${false}
			${EditViewActions.FORWARD}               | ${false}
			${EditViewActions.COMPOSE}               | ${false}
			${EditViewActions.EDIT_AS_DRAFT}         | ${true}
			${EditViewActions.PREFILL_COMPOSE}       | ${false}
			${EditViewActions.FORWARD_AS_ATTACHMENT} | ${false}
			${EditViewActions.EDIT_AS_NEW}           | ${false}
			${EditViewActions.MAIL_TO}               | ${false}
		`('Action: $action', ({ action, expected }) => {
			it(`should set isUrgent to ${expected}`, () => {
				const editor = generateEditor({
					action,
					id: 'test-id',
					message: urgentMessage
				});
				expect(editor?.isUrgent).toBe(expected);
			});
		});

		describe('RESUME action', () => {
			it('should preserve urgent flag from original editor', () => {
				const draftEditor = generateEditor({
					action: EditViewActions.EDIT_AS_DRAFT,
					id: 'test-id',
					message: urgentMessage
				});

				(getEditor as jest.Mock).mockReturnValueOnce(draftEditor);

				const resumedEditor = generateEditor({
					action: EditViewActions.RESUME,
					id: draftEditor?.id
				});

				expect(resumedEditor?.isUrgent).toBe(true);
			});
		});
	});
});
