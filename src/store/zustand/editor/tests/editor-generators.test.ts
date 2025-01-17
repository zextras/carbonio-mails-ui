/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import { EditViewActions } from '../../../../constants';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../tests/generators/store';
import { MailMessage } from '../../../../types';
import { generateEditor } from '../editor-generators';

jest.mock('uuid', () => ({
	v4: jest.fn(() => 'test-editor-id')
}));

jest.mock('@zextras/carbonio-shell-ui', () => ({
	getUserSettings: jest.fn(() => ({
		prefs: { zimbraPrefComposeFormat: 'html' }
	})),
	t: jest.fn((_key: string, fallback: string) => fallback)
}));

jest.mock('../../../../helpers/identities', () => ({
	getIdentityFromParticipant: jest.fn(() => ({ id: 'test-identity-id' })),
	getDefaultIdentity: jest.fn(() => ({ id: 'default-identity-id' }))
}));

// Test cases
describe('generateEditor', () => {
	const store = generateStore();
	const message = {
		...generateMessage(),
		originalId: 'test-orig-id',
		replyType: 'r'
	} as MailMessage;

	it('should generate an editor with action EDIT_AS_DRAFT', () => {
		const result = generateEditor({
			action: EditViewActions.EDIT_AS_DRAFT,
			id: 'test-id',
			messagesStoreDispatch: store.dispatch,
			message
		});

		expect(result).toBeTruthy();
		expect(result?.id).toBe('test-editor-id');
		expect(result?.identityId).toBe('test-identity-id');
		expect(result?.text.plainText).toContain(message.fragment);
		expect(result?.text.richText).toContain(message.fragment);
		expect(result?.recipients.to).toEqual([find(message.participants, { type: 't' })]);
		expect(result?.recipients.cc).toEqual([find(message.participants, { type: 'cc' })]);
		expect(result?.originalId).toEqual('test-orig-id');
		expect(result?.recipients.bcc).toEqual([]);
		expect(result?.isRichText).toBe(true);
	});

	it('should throw an error if id is missing for EDIT_AS_DRAFT', () => {
		expect(() =>
			generateEditor({
				action: EditViewActions.EDIT_AS_DRAFT,
				id: undefined,
				messagesStoreDispatch: store.dispatch,
				message
			})
		).toThrow('Cannot generate a draft editor without a message id');
	});

	it('should return null for unsupported actions', () => {
		const result = generateEditor({
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			action: 'UNSUPPORTED_ACTION',
			id: 'test-id',
			messagesStoreDispatch: store.dispatch,
			message
		});

		expect(result).toBeNull();
	});

	it('should return null if no message is provided for EDIT_AS_DRAFT', () => {
		const result = generateEditor({
			action: EditViewActions.EDIT_AS_DRAFT,
			id: 'test-id',
			messagesStoreDispatch: store.dispatch,
			message: null
		});

		expect(result).toBeNull();
	});
});
