/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { vi } from 'vitest';

import { useEditorsStore } from '../store';
import * as shell from '@test-mocks/@zextras/carbonio-shell-ui';
import { generateMessage } from '__test__/generators/generateMessage';
import { EditViewActions, PROCESS_STATUS } from 'constants/index';
import { generateEditor, resumeEditor } from 'store/editor/editor-generators';
import { EditViewActionsType, MailsEditorV2 } from 'types/editor';
import { MailMessage } from 'types/messages';

vi.mock('@zextras/carbonio-shell-ui', async () => ({
	...(await vi.importActual('@zextras/carbonio-shell-ui')),
	...shell,
	getUserSettings: vi.fn(() => ({
		prefs: { zimbraPrefComposeFormat: 'html' }
	})),
	t: vi.fn((_key: string, fallback: string) => fallback)
}));
describe('generateEditor', () => {
	const messageDate = new Date();
	const message = {
		...generateMessage(),
		date: messageDate.getTime(),
		participants: [
			{
				type: 'f',
				email: 'from@me'
			},
			{
				type: 't',
				email: 'to@me'
			},
			{
				type: 'c',
				email: 'cc@me'
			}
		],
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
			expect(result?.isRichText).toBe(true);
		});

		test('should include message content', () => {
			expect(result?.text.plainText).toContain(message.fragment);
			expect(result?.text.richText).toContain(message.fragment);
		});

		test('should set correct recipients 1', () => {
			expect(result?.recipients.to).toEqual([{ type: 't', email: 'to@me' }]);
			expect(result?.recipients.cc).toEqual([{ type: 'c', email: 'cc@me' }]);
			expect(result?.recipients.bcc).toEqual([]);
		});

		test('should use message.originalId', () => {
			expect(result?.originalId).toEqual('test-orig-id');
		});

		test('that it sets the correct draftSave status based on the last save timestamp', () => {
			expect(result?.draftSaveProcessStatus).toEqual({
				status: PROCESS_STATUS.COMPLETED,
				lastSaveTimestamp: messageDate
			});
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
			expect(editor?.isRichText).toBe(true);
		});

		test('should include message content', () => {
			expect(editor?.text.plainText).toContain(message.fragment);
			expect(editor?.text.richText).toContain(message.fragment);
		});

		test('should set correct recipients', () => {
			expect(editor?.recipients.to).toEqual([{ type: 't', email: 'to@me' }]);
			expect(editor?.recipients.cc).toEqual([{ type: 'c', email: 'cc@me' }]);
			expect(editor?.recipients.bcc).toEqual([]);
		});

		test('should not have originalId', () => {
			expect(editor?.originalId).toBeUndefined();
		});

		describe('subject sanitizing and handling', () => {
			const baseMessage = {
				...message,
				subject: 'RE: Test Subject'
			};

			it('removes RE: prefix from subject', () => {
				const editor2 = generateEditor({
					action: EditViewActions.EDIT_AS_NEW,
					id: 'test-id',
					message: baseMessage
				});
				expect(editor2?.subject).toBe('Test Subject');
			});

			it('should not removes RE: string literal if it is not prefix from subject', () => {
				const message2 = { ...baseMessage, subject: 'TEST RE: Test Subject' };
				const editor2 = generateEditor({
					action: EditViewActions.EDIT_AS_NEW,
					id: 'test-id',
					message: message2
				});
				expect(editor2?.subject).toBe('TEST RE: Test Subject');
			});

			it('removes FWD: prefix from subject', () => {
				const message2 = { ...baseMessage, subject: 'FWD: Test Subject' };
				const editor2 = generateEditor({
					action: EditViewActions.EDIT_AS_NEW,
					id: 'test-id',
					message: message2
				});
				expect(editor2?.subject).toBe('Test Subject');
			});

			it('should not removes FWD: string literal if it is not prefix from subject', () => {
				const message2 = { ...baseMessage, subject: 'TEST FWD: Test Subject' };
				const editor2 = generateEditor({
					action: EditViewActions.EDIT_AS_NEW,
					id: 'test-id',
					message: message2
				});
				expect(editor2?.subject).toBe('TEST FWD: Test Subject');
			});

			it('removes multiple RE: prefixes', () => {
				const message2 = { ...baseMessage, subject: 'RE: RE: Test Subject' };
				const editor3 = generateEditor({
					action: EditViewActions.EDIT_AS_NEW,
					id: 'test-id',
					message: message2
				});
				expect(editor3?.subject).toBe('Test Subject');
			});

			it('does not change subject if no RE: prefix', () => {
				const message3 = { ...baseMessage, subject: 'Test Subject' };
				const editor4 = generateEditor({
					action: EditViewActions.EDIT_AS_NEW,
					id: 'test-id',
					message: message3
				});
				expect(editor4?.subject).toBe('Test Subject');
			});

			it('sets subject to empty string if originalMessage.subject is undefined', () => {
				const message4 = { ...baseMessage, subject: undefined as unknown } as MailMessage;
				const editor5 = generateEditor({
					action: EditViewActions.EDIT_AS_NEW,
					id: 'test-id',
					message: message4
				});
				expect(editor5?.subject).toBe('');
			});
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
				}) as MailsEditorV2;
				const draftEditorId = draftEditor.id;
				useEditorsStore.getState().addEditor(draftEditorId, draftEditor);

				const resumedEditor = resumeEditor(draftEditor?.id);

				expect(resumedEditor?.isUrgent).toBe(true);
			});
		});
	});
});
